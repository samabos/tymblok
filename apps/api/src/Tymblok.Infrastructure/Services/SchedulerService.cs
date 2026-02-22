using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Tymblok.Core.Entities;
using Tymblok.Core.Exceptions;
using Tymblok.Core.Interfaces;

namespace Tymblok.Infrastructure.Services;

public class SchedulerService : ISchedulerService
{
    // System category IDs (from TymblokDbContext seed data)
    private static readonly Guid GitHubCategoryId = Guid.Parse("00000000-0000-0000-0000-000000000001");
    private static readonly Guid JiraCategoryId = Guid.Parse("00000000-0000-0000-0000-000000000002");
    private static readonly Guid MeetingCategoryId = Guid.Parse("00000000-0000-0000-0000-000000000003");
    private static readonly Guid FocusCategoryId = Guid.Parse("00000000-0000-0000-0000-000000000004");

    // Zone defaults
    private const int BatchZoneDurationMinutes = 90;
    private const int MinFocusBlockMinutes = 30;
    private const int BatchBufferMinutes = 5;
    private const int MinSlotMinutes = 15;

    private readonly IBlockService _blockService;
    private readonly IInboxRepository _inboxRepository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IAuditService _auditService;
    private readonly ILogger<SchedulerService> _logger;

    public SchedulerService(
        IBlockService blockService,
        IInboxRepository inboxRepository,
        ICategoryRepository categoryRepository,
        UserManager<ApplicationUser> userManager,
        IAuditService auditService,
        ILogger<SchedulerService> logger)
    {
        _blockService = blockService;
        _inboxRepository = inboxRepository;
        _categoryRepository = categoryRepository;
        _userManager = userManager;
        _auditService = auditService;
        _logger = logger;
    }

    // ========================================================================
    // Internal Types
    // ========================================================================

    private enum ZoneType { Focus, Batch, Flex }

    private record TimeSlot(TimeOnly Start, TimeOnly End, int DurationMinutes);

    private class MutableSlot
    {
        public TimeOnly CurrentStart { get; set; }
        public TimeOnly End { get; }
        public int RemainingMinutes { get; set; }

        public MutableSlot(TimeSlot slot)
        {
            CurrentStart = slot.Start;
            End = slot.End;
            RemainingMinutes = slot.DurationMinutes;
        }
    }

    private record ScheduleZone(ZoneType Type, List<TimeSlot> AvailableSlots)
    {
        public int TotalAvailableMinutes => AvailableSlots.Sum(s => s.DurationMinutes);
    }

    private record ScoredItem(
        InboxItem Item,
        int Score,
        int EstimatedMinutes,
        ZoneType PreferredZone,
        string? GroupKey);

    // ========================================================================
    // Public API
    // ========================================================================

    public async Task<ScheduleProposal> AutoPlanAsync(
        AutoPlanData data, Guid userId, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString())
            ?? throw new NotFoundException("USER_NOT_FOUND", "User not found");

        // Stage 1: Load fixed blocks
        var fixedBlocks = await _blockService.GetByDateAsync(userId, data.Date, ct);

        // Stage 2: Build day template (zones with available slots)
        var zones = BuildDayTemplate(user, fixedBlocks);

        // Stage 3: Load schedulable inbox items
        var scoredItems = await LoadAndScoreItemsAsync(userId, data.InboxItemIds);

        // Stage 4-5: Fill zones
        var (proposedBlocks, warnings) = FillZones(zones, scoredItems, data.Date);

        // Stage 6: Evaluate
        var score = EvaluateSchedule(proposedBlocks, scoredItems, zones);

        await _auditService.LogAsync(
            action: "AutoPlan",
            entityType: "Schedule",
            entityId: data.Date.ToString("yyyy-MM-dd"),
            userId: userId,
            newValues: new
            {
                data.Date,
                ProposedCount = proposedBlocks.Count,
                TotalItems = scoredItems.Count,
                score.Overall
            });

        _logger.LogInformation(
            "Auto-plan generated | UserId: {UserId} | Date: {Date} | Proposed: {Count} | Score: {Score}",
            userId, data.Date, proposedBlocks.Count, score.Overall);

        return new ScheduleProposal(proposedBlocks, score, warnings);
    }

    public async Task<ScheduleProposal> ReplanAsync(
        ReplanData data, Guid userId, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString())
            ?? throw new NotFoundException("USER_NOT_FOUND", "User not found");

        // Load all blocks for the date
        var allBlocks = await _blockService.GetByDateAsync(userId, data.Date, ct);

        // Determine which blocks are fixed constraints
        IList<TimeBlock> fixedBlocks;
        if (data.KeepBlockIds is { Count: > 0 })
        {
            var keepSet = data.KeepBlockIds.ToHashSet();
            // Always keep calendar-synced blocks + explicitly kept blocks
            fixedBlocks = allBlocks
                .Where(b => b.ExternalSource != null || keepSet.Contains(b.Id))
                .ToList();
        }
        else
        {
            // Keep all existing blocks (same as auto-plan — fill gaps only)
            fixedBlocks = allBlocks;
        }

        var zones = BuildDayTemplate(user, fixedBlocks);

        // Load schedulable items + re-pool items from non-kept blocks
        var scoredItems = await LoadAndScoreItemsAsync(userId, inboxItemIds: null);

        // If specific blocks were freed, their inbox items re-enter the pool
        if (data.KeepBlockIds is { Count: > 0 })
        {
            var freedBlocks = allBlocks.Where(b =>
                b.ExternalSource == null && !data.KeepBlockIds.Contains(b.Id)).ToList();

            // Find inbox items linked to freed blocks
            var allInboxItems = await _inboxRepository.GetByUserIdAsync(userId, isDismissed: false);
            var freedInboxItems = allInboxItems
                .Where(i => i.IsScheduled && i.ScheduledBlockId.HasValue &&
                            freedBlocks.Any(b => b.Id == i.ScheduledBlockId.Value))
                .ToList();

            var now = DateTime.UtcNow;
            var freedScored = freedInboxItems.Select(item => new ScoredItem(
                item, ScoreItem(item, now), EstimateDuration(item),
                ClassifyItem(item), GetGroupKey(item)));

            // Merge freed items into the pool (avoid duplicates)
            var existingIds = scoredItems.Select(s => s.Item.Id).ToHashSet();
            scoredItems.AddRange(freedScored.Where(s => !existingIds.Contains(s.Item.Id)));
            scoredItems = scoredItems.OrderByDescending(s => s.Score).ToList();
        }

        var (proposedBlocks, warnings) = FillZones(zones, scoredItems, data.Date);
        var score = EvaluateSchedule(proposedBlocks, scoredItems, zones);

        await _auditService.LogAsync(
            action: "Replan",
            entityType: "Schedule",
            entityId: data.Date.ToString("yyyy-MM-dd"),
            userId: userId,
            newValues: new
            {
                data.Date,
                ProposedCount = proposedBlocks.Count,
                KeptBlocks = fixedBlocks.Count,
                score.Overall
            });

        _logger.LogInformation(
            "Replan generated | UserId: {UserId} | Date: {Date} | Proposed: {Count} | Kept: {Kept} | Score: {Score}",
            userId, data.Date, proposedBlocks.Count, fixedBlocks.Count, score.Overall);

        return new ScheduleProposal(proposedBlocks, score, warnings);
    }

    // ========================================================================
    // Stage 2: Build Day Template
    // ========================================================================

    private List<ScheduleZone> BuildDayTemplate(ApplicationUser user, IList<TimeBlock> fixedBlocks)
    {
        var workStart = user.WorkingHoursStart;
        var workEnd = user.WorkingHoursEnd;
        var lunchStart = user.LunchStart;
        var lunchEnd = lunchStart.AddMinutes(user.LunchDurationMinutes);

        // Calculate batch zone end (post-lunch, capped at work end)
        var batchEnd = lunchEnd.AddMinutes(BatchZoneDurationMinutes);
        if (batchEnd > workEnd) batchEnd = workEnd;

        var zones = new List<ScheduleZone>();

        // Focus zone: work start → lunch start
        if (workStart < lunchStart)
        {
            var focusSlots = SubtractBlocks(workStart, lunchStart, fixedBlocks);
            zones.Add(new ScheduleZone(ZoneType.Focus, focusSlots));
        }

        // Batch zone: lunch end → batch end
        if (lunchEnd < batchEnd)
        {
            var batchSlots = SubtractBlocks(lunchEnd, batchEnd, fixedBlocks);
            zones.Add(new ScheduleZone(ZoneType.Batch, batchSlots));
        }

        // Flex zone: batch end → work end
        if (batchEnd < workEnd)
        {
            var flexSlots = SubtractBlocks(batchEnd, workEnd, fixedBlocks);
            zones.Add(new ScheduleZone(ZoneType.Flex, flexSlots));
        }

        return zones;
    }

    private static List<TimeSlot> SubtractBlocks(
        TimeOnly rangeStart, TimeOnly rangeEnd, IList<TimeBlock> blocks)
    {
        // Collect busy periods that overlap with the range
        var busyPeriods = blocks
            .Where(b => b.StartTime < rangeEnd && b.EndTime > rangeStart)
            .Select(b => (
                Start: b.StartTime < rangeStart ? rangeStart : b.StartTime,
                End: b.EndTime > rangeEnd ? rangeEnd : b.EndTime))
            .OrderBy(p => p.Start)
            .ToList();

        var slots = new List<TimeSlot>();
        var current = rangeStart;

        foreach (var busy in busyPeriods)
        {
            if (busy.Start > current)
            {
                var duration = (int)(busy.Start - current).TotalMinutes;
                if (duration >= MinSlotMinutes)
                {
                    slots.Add(new TimeSlot(current, busy.Start, duration));
                }
            }

            if (busy.End > current)
            {
                current = busy.End;
            }
        }

        // Remaining time after last busy period
        if (current < rangeEnd)
        {
            var duration = (int)(rangeEnd - current).TotalMinutes;
            if (duration >= MinSlotMinutes)
            {
                slots.Add(new TimeSlot(current, rangeEnd, duration));
            }
        }

        return slots;
    }

    // ========================================================================
    // Stage 3: Load & Score Items
    // ========================================================================

    private async Task<List<ScoredItem>> LoadAndScoreItemsAsync(
        Guid userId, List<Guid>? inboxItemIds)
    {
        var allItems = await _inboxRepository.GetByUserIdAsync(userId, isDismissed: false);
        var schedulable = allItems.Where(i => !i.IsScheduled).ToList();

        if (inboxItemIds is { Count: > 0 })
        {
            var idSet = inboxItemIds.ToHashSet();
            schedulable = schedulable.Where(i => idSet.Contains(i.Id)).ToList();
        }

        var now = DateTime.UtcNow;
        return schedulable
            .Select(item => new ScoredItem(
                item,
                ScoreItem(item, now),
                EstimateDuration(item),
                ClassifyItem(item),
                GetGroupKey(item)))
            .OrderByDescending(s => s.Score)
            .ToList();
    }

    // ========================================================================
    // Stage 3a: Classification
    // ========================================================================

    private static ZoneType ClassifyItem(InboxItem item)
    {
        // GitHub PRs → Batch zone (grouped reviews)
        if (item.Source == InboxSource.GitHub)
            return ZoneType.Batch;

        // High-priority tasks → Focus zone
        if (item.Priority is InboxPriority.Critical or InboxPriority.High
            && item.Type == InboxItemType.Task)
            return ZoneType.Focus;

        // Events and reminders → Flex zone
        if (item.Type is InboxItemType.Event or InboxItemType.Reminder)
            return ZoneType.Flex;

        // Medium/Low priority → Flex zone
        return ZoneType.Flex;
    }

    // ========================================================================
    // Stage 3b: Scoring
    // ========================================================================

    private static int ScoreItem(InboxItem item, DateTime now)
    {
        // Priority base score
        var score = item.Priority switch
        {
            InboxPriority.Critical => 100,
            InboxPriority.High => 75,
            InboxPriority.Medium => 50,
            InboxPriority.Low => 25,
            _ => 50
        };

        // Type bonus
        score += item.Type switch
        {
            InboxItemType.Task => 10,
            InboxItemType.Event => 5,
            _ => 0
        };

        // Age bonus: older items bubble up (+5/day, capped at +30)
        var ageDays = (now - item.CreatedAt).Days;
        score += Math.Min(ageDays * 5, 30);

        return score;
    }

    // ========================================================================
    // Stage 3c: Duration Estimation
    // ========================================================================

    private static int EstimateDuration(InboxItem item)
    {
        return item.Type switch
        {
            InboxItemType.Task => 45,
            InboxItemType.Event => 30,
            InboxItemType.Update => 15,
            InboxItemType.Reminder => 10,
            _ => 30
        };
    }

    // ========================================================================
    // Stage 3d: Grouping Key
    // ========================================================================

    private static string? GetGroupKey(InboxItem item)
    {
        // GitHub PRs: group by repo (parse "github:owner/repo#123")
        if (item.Source == InboxSource.GitHub && item.ExternalId != null)
        {
            var hashIndex = item.ExternalId.IndexOf('#');
            if (hashIndex > 0)
                return item.ExternalId[..hashIndex]; // "github:owner/repo"
        }

        return null;
    }

    // ========================================================================
    // Stage 4: Fill Zones
    // ========================================================================

    private (List<ProposedBlock> Blocks, List<string> Warnings) FillZones(
        List<ScheduleZone> zones, List<ScoredItem> scoredItems, DateOnly date)
    {
        var proposedBlocks = new List<ProposedBlock>();
        var warnings = new List<string>();

        // Partition items by preferred zone
        var focusItems = scoredItems
            .Where(s => s.PreferredZone == ZoneType.Focus)
            .OrderByDescending(s => s.Score).ToList();
        var batchItems = scoredItems
            .Where(s => s.PreferredZone == ZoneType.Batch)
            .OrderByDescending(s => s.Score).ToList();
        var flexItems = scoredItems
            .Where(s => s.PreferredZone == ZoneType.Flex)
            .OrderByDescending(s => s.Score).ToList();

        var focusZone = zones.FirstOrDefault(z => z.Type == ZoneType.Focus);
        var batchZone = zones.FirstOrDefault(z => z.Type == ZoneType.Batch);
        var flexZone = zones.FirstOrDefault(z => z.Type == ZoneType.Flex);

        // Fill Focus zone
        var focusOverflow = PlaceItemsInZone(
            focusZone, focusItems, proposedBlocks, date, MinFocusBlockMinutes);

        // Fill Batch zone (with repo grouping)
        var batchOverflow = PlaceBatchItems(
            batchZone, batchItems, proposedBlocks, date);

        // Combine overflow into Flex
        var allFlexItems = flexItems
            .Concat(focusOverflow)
            .Concat(batchOverflow)
            .OrderByDescending(s => s.Score)
            .ToList();

        // Fill Flex zone
        var finalOverflow = PlaceItemsInZone(
            flexZone, allFlexItems, proposedBlocks, date, MinSlotMinutes);

        if (finalOverflow.Count > 0)
        {
            warnings.Add(
                $"{finalOverflow.Count} item(s) could not be scheduled — not enough available time");
        }

        // Sort final blocks by start time
        proposedBlocks.Sort((a, b) => a.StartTime.CompareTo(b.StartTime));

        return (proposedBlocks, warnings);
    }

    private static List<ScoredItem> PlaceItemsInZone(
        ScheduleZone? zone,
        List<ScoredItem> items,
        List<ProposedBlock> proposedBlocks,
        DateOnly date,
        int minBlockMinutes)
    {
        var overflow = new List<ScoredItem>();
        if (zone == null || zone.AvailableSlots.Count == 0)
        {
            overflow.AddRange(items);
            return overflow;
        }

        var slots = zone.AvailableSlots.Select(s => new MutableSlot(s)).ToList();
        var zoneName = zone.Type.ToString().ToLowerInvariant();

        foreach (var scored in items)
        {
            var needed = Math.Max(scored.EstimatedMinutes, minBlockMinutes);
            var slot = slots.FirstOrDefault(s => s.RemainingMinutes >= needed);

            if (slot != null)
            {
                var startTime = slot.CurrentStart;
                var endTime = startTime.AddMinutes(scored.EstimatedMinutes);
                var (categoryId, categoryName, categoryColor, categoryIcon) =
                    GetCategoryForItem(scored.Item, zone.Type);

                proposedBlocks.Add(new ProposedBlock(
                    Title: scored.Item.Title,
                    Subtitle: scored.Item.Description,
                    CategoryId: categoryId,
                    CategoryName: categoryName,
                    CategoryColor: categoryColor,
                    CategoryIcon: categoryIcon,
                    Date: date,
                    StartTime: startTime,
                    EndTime: endTime,
                    DurationMinutes: scored.EstimatedMinutes,
                    IsUrgent: scored.Item.Priority is InboxPriority.Critical or InboxPriority.High,
                    InboxItemId: scored.Item.Id,
                    Zone: zoneName));

                slot.CurrentStart = endTime;
                slot.RemainingMinutes -= scored.EstimatedMinutes;
            }
            else
            {
                overflow.Add(scored);
            }
        }

        return overflow;
    }

    private static List<ScoredItem> PlaceBatchItems(
        ScheduleZone? zone,
        List<ScoredItem> items,
        List<ProposedBlock> proposedBlocks,
        DateOnly date)
    {
        var overflow = new List<ScoredItem>();
        if (zone == null || zone.AvailableSlots.Count == 0)
        {
            overflow.AddRange(items);
            return overflow;
        }

        var slots = zone.AvailableSlots.Select(s => new MutableSlot(s)).ToList();
        const string zoneName = "batch";

        // Group by repo/key, sorted by total group score descending
        var groups = items
            .GroupBy(s => s.GroupKey ?? s.Item.Id.ToString())
            .OrderByDescending(g => g.Sum(s => s.Score))
            .ToList();

        foreach (var group in groups)
        {
            var groupItems = group.OrderByDescending(s => s.Score).ToList();
            var totalMinutes = groupItems.Sum(s => s.EstimatedMinutes)
                + Math.Max(0, groupItems.Count - 1) * BatchBufferMinutes;

            // Try to find a slot that fits the entire group
            var slot = slots.FirstOrDefault(s => s.RemainingMinutes >= totalMinutes);

            if (slot != null)
            {
                // Place entire group contiguously
                for (var i = 0; i < groupItems.Count; i++)
                {
                    var scored = groupItems[i];
                    var startTime = slot.CurrentStart;
                    var endTime = startTime.AddMinutes(scored.EstimatedMinutes);
                    var (categoryId, categoryName, categoryColor, categoryIcon) =
                        GetCategoryForItem(scored.Item, ZoneType.Batch);

                    proposedBlocks.Add(new ProposedBlock(
                        Title: scored.Item.Title,
                        Subtitle: scored.Item.Description,
                        CategoryId: categoryId,
                        CategoryName: categoryName,
                        CategoryColor: categoryColor,
                        CategoryIcon: categoryIcon,
                        Date: date,
                        StartTime: startTime,
                        EndTime: endTime,
                        DurationMinutes: scored.EstimatedMinutes,
                        IsUrgent: scored.Item.Priority is InboxPriority.Critical or InboxPriority.High,
                        InboxItemId: scored.Item.Id,
                        Zone: zoneName));

                    slot.CurrentStart = endTime;
                    slot.RemainingMinutes -= scored.EstimatedMinutes;

                    // Add buffer between items (not after the last one)
                    if (i < groupItems.Count - 1 && slot.RemainingMinutes >= BatchBufferMinutes)
                    {
                        slot.CurrentStart = slot.CurrentStart.AddMinutes(BatchBufferMinutes);
                        slot.RemainingMinutes -= BatchBufferMinutes;
                    }
                }
            }
            else
            {
                // Can't fit group together — place items individually
                foreach (var scored in groupItems)
                {
                    var individualSlot = slots.FirstOrDefault(
                        s => s.RemainingMinutes >= scored.EstimatedMinutes);

                    if (individualSlot != null)
                    {
                        var startTime = individualSlot.CurrentStart;
                        var endTime = startTime.AddMinutes(scored.EstimatedMinutes);
                        var (categoryId, categoryName, categoryColor, categoryIcon) =
                            GetCategoryForItem(scored.Item, ZoneType.Batch);

                        proposedBlocks.Add(new ProposedBlock(
                            Title: scored.Item.Title,
                            Subtitle: scored.Item.Description,
                            CategoryId: categoryId,
                            CategoryName: categoryName,
                            CategoryColor: categoryColor,
                            CategoryIcon: categoryIcon,
                            Date: date,
                            StartTime: startTime,
                            EndTime: endTime,
                            DurationMinutes: scored.EstimatedMinutes,
                            IsUrgent: scored.Item.Priority is InboxPriority.Critical or InboxPriority.High,
                            InboxItemId: scored.Item.Id,
                            Zone: zoneName));

                        individualSlot.CurrentStart = endTime;
                        individualSlot.RemainingMinutes -= scored.EstimatedMinutes;
                    }
                    else
                    {
                        overflow.Add(scored);
                    }
                }
            }
        }

        return overflow;
    }

    // ========================================================================
    // Stage 5: Evaluate Schedule
    // ========================================================================

    private static ScheduleQualityScore EvaluateSchedule(
        List<ProposedBlock> blocks, List<ScoredItem> allItems, List<ScheduleZone> zones)
    {
        if (blocks.Count == 0)
        {
            return new ScheduleQualityScore(0, 0, allItems.Count == 0 ? 100 : 0, 100, 100);
        }

        // Focus time score: % of focus zone capacity used for focus blocks
        var focusZone = zones.FirstOrDefault(z => z.Type == ZoneType.Focus);
        var focusCapacity = focusZone?.TotalAvailableMinutes ?? 0;
        var focusUsed = blocks.Where(b => b.Zone == "focus").Sum(b => b.DurationMinutes);
        var focusTimeScore = focusCapacity > 0
            ? Math.Min(100, (int)(focusUsed * 100.0 / focusCapacity))
            : 100;

        // Priority coverage: % of Critical+High items that got placed
        var highPriorityItems = allItems
            .Where(s => s.Item.Priority is InboxPriority.Critical or InboxPriority.High)
            .ToList();
        var placedInboxIds = blocks
            .Where(b => b.InboxItemId.HasValue)
            .Select(b => b.InboxItemId!.Value)
            .ToHashSet();
        var highPriorityPlaced = highPriorityItems.Count(s => placedInboxIds.Contains(s.Item.Id));
        var priorityCoverage = highPriorityItems.Count > 0
            ? Math.Min(100, (int)(highPriorityPlaced * 100.0 / highPriorityItems.Count))
            : 100;

        // Context switch score: fewer category switches = better
        var switches = 0;
        for (var i = 1; i < blocks.Count; i++)
        {
            if (blocks[i].CategoryId != blocks[i - 1].CategoryId)
                switches++;
        }
        var maxSwitches = Math.Max(1, blocks.Count - 1);
        var contextSwitchScore = (int)((1.0 - (double)switches / maxSwitches) * 100);

        // Buffer time score: some unscheduled time is healthy
        var totalAvailable = zones.Sum(z => z.TotalAvailableMinutes);
        var totalScheduled = blocks.Sum(b => b.DurationMinutes);
        var bufferRatio = totalAvailable > 0
            ? (double)(totalAvailable - totalScheduled) / totalAvailable
            : 1.0;
        var bufferTimeScore = bufferRatio switch
        {
            >= 0.10 and <= 0.30 => 100,
            >= 0.05 and < 0.10 => 80,
            > 0.30 and <= 0.50 => 70,
            < 0.05 => 50,
            _ => 40
        };

        // Overall: weighted average
        var overall = (int)(
            focusTimeScore * 0.30 +
            priorityCoverage * 0.30 +
            contextSwitchScore * 0.25 +
            bufferTimeScore * 0.15);

        return new ScheduleQualityScore(
            overall, focusTimeScore, priorityCoverage, contextSwitchScore, bufferTimeScore);
    }

    // ========================================================================
    // Helpers
    // ========================================================================

    private static (Guid Id, string Name, string Color, string Icon) GetCategoryForItem(
        InboxItem item, ZoneType zone)
    {
        return item.Source switch
        {
            InboxSource.GitHub => (GitHubCategoryId, "GitHub", "#10b981", "github"),
            InboxSource.Jira => (JiraCategoryId, "Jira", "#3b82f6", "jira"),
            InboxSource.GoogleCalendar => (MeetingCategoryId, "Meeting", "#a855f7", "users"),
            _ => zone switch
            {
                ZoneType.Focus => (FocusCategoryId, "Focus", "#f59e0b", "zap"),
                ZoneType.Batch => (FocusCategoryId, "Focus", "#f59e0b", "zap"),
                ZoneType.Flex => (FocusCategoryId, "Focus", "#f59e0b", "zap"),
                _ => (FocusCategoryId, "Focus", "#f59e0b", "zap")
            }
        };
    }
}
