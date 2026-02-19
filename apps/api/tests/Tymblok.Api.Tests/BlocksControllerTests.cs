using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Tymblok.Api.DTOs;

namespace Tymblok.Api.Tests;

[Collection("Sequential")]
public class BlocksControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public BlocksControllerTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    private async Task<string> GetAuthTokenAsync()
    {
        var registerRequest = new RegisterRequest($"test{Guid.NewGuid()}@test.com", "Password123!", "Test User");
        var registerResponse = await _client.PostAsJsonAsync("/api/auth/register", registerRequest);
        var authResult = await registerResponse.Content.ReadFromJsonAsync<ApiResponse<AuthResponse>>();
        return authResult!.Data.AccessToken;
    }

    private async Task<Guid> CreateCategoryAsync(string token, string name = "Work")
    {
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var categoryRequest = new CreateCategoryRequest(name, "#6366f1", "briefcase");
        var categoryResponse = await _client.PostAsJsonAsync("/api/categories", categoryRequest);
        var category = await categoryResponse.Content.ReadFromJsonAsync<ApiResponse<CategoryDto>>();
        return category!.Data.Id;
    }

    [Fact]
    public async Task CreateBlock_WithValidData_ReturnsCreated()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        var categoryId = await CreateCategoryAsync(token);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var request = new CreateBlockRequest(
            "Morning standup",
            "Daily team sync",
            categoryId,
            DateOnly.FromDateTime(DateTime.UtcNow),
            new TimeOnly(9, 0),
            30
        );

        // Act
        var response = await _client.PostAsJsonAsync("/api/blocks", request);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<BlockDto>>();
        Assert.NotNull(result);
        Assert.Equal("Morning standup", result.Data.Title);
        Assert.Equal("Daily team sync", result.Data.Subtitle);
        Assert.Equal(categoryId, result.Data.CategoryId);
        Assert.Equal(30, result.Data.DurationMinutes);
        Assert.Equal(new TimeOnly(9, 30), result.Data.EndTime); // Auto-calculated
        Assert.False(result.Data.IsCompleted);
        Assert.Equal(0, result.Data.Progress);

        // Cleanup
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task CreateBlock_WithInvalidCategoryId_ReturnsNotFound()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var request = new CreateBlockRequest(
            "Test Block",
            null,
            Guid.NewGuid(), // Non-existent category
            DateOnly.FromDateTime(DateTime.UtcNow),
            new TimeOnly(10, 0),
            60
        );

        // Act
        var response = await _client.PostAsJsonAsync("/api/blocks", request);

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiError>();
        Assert.NotNull(result);
        Assert.Equal("CATEGORY_NOT_FOUND", result.Error.Code);

        // Cleanup
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task CreateBlock_WithoutAuth_ReturnsUnauthorized()
    {
        // Arrange
        var request = new CreateBlockRequest(
            "Test",
            null,
            Guid.NewGuid(),
            DateOnly.FromDateTime(DateTime.UtcNow),
            new TimeOnly(10, 0),
            60
        );

        // Act
        var response = await _client.PostAsJsonAsync("/api/blocks", request);

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetBlocks_ForToday_ReturnsOk()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        var categoryId = await CreateCategoryAsync(token);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Create blocks for today
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        await _client.PostAsJsonAsync("/api/blocks", new CreateBlockRequest("Block 1", null, categoryId, today, new TimeOnly(9, 0), 30));
        await _client.PostAsJsonAsync("/api/blocks", new CreateBlockRequest("Block 2", null, categoryId, today, new TimeOnly(10, 0), 60));

        // Act - Get today's blocks (default)
        var response = await _client.GetAsync("/api/blocks");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<BlocksResponse>>();
        Assert.NotNull(result);
        Assert.True(result.Data.Blocks.Count >= 2);
        Assert.All(result.Data.Blocks, b => Assert.Equal(today, b.Date));
        // Should be ordered by start time
        Assert.True(result.Data.Blocks[0].StartTime <= result.Data.Blocks[1].StartTime);

        // Cleanup
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task GetBlocks_BySpecificDate_ReturnsFilteredResults()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        var categoryId = await CreateCategoryAsync(token);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var targetDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1));
        await _client.PostAsJsonAsync("/api/blocks", new CreateBlockRequest("Tomorrow's block", null, categoryId, targetDate, new TimeOnly(14, 0), 90));

        // Act - Get blocks for specific date
        var response = await _client.GetAsync($"/api/blocks?date={targetDate:yyyy-MM-dd}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<BlocksResponse>>();
        Assert.NotNull(result);
        Assert.All(result.Data.Blocks, b => Assert.Equal(targetDate, b.Date));

        // Cleanup
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task GetBlocks_ByDateRange_ReturnsMultipleDays()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        var categoryId = await CreateCategoryAsync(token);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var startDate = DateOnly.FromDateTime(DateTime.UtcNow);
        var endDate = startDate.AddDays(2);

        // Create blocks across multiple days
        await _client.PostAsJsonAsync("/api/blocks", new CreateBlockRequest("Day 1", null, categoryId, startDate, new TimeOnly(9, 0), 30));
        await _client.PostAsJsonAsync("/api/blocks", new CreateBlockRequest("Day 2", null, categoryId, startDate.AddDays(1), new TimeOnly(10, 0), 30));
        await _client.PostAsJsonAsync("/api/blocks", new CreateBlockRequest("Day 3", null, categoryId, endDate, new TimeOnly(11, 0), 30));

        // Act
        var response = await _client.GetAsync($"/api/blocks?startDate={startDate:yyyy-MM-dd}&endDate={endDate:yyyy-MM-dd}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<BlocksResponse>>();
        Assert.NotNull(result);
        Assert.True(result.Data.Blocks.Count >= 3);
        // Should be ordered by date, then time
        for (int i = 1; i < result.Data.Blocks.Count; i++)
        {
            var prev = result.Data.Blocks[i - 1];
            var curr = result.Data.Blocks[i];
            Assert.True(prev.Date <= curr.Date);
        }

        // Cleanup
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task GetBlock_WithValidId_ReturnsOk()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        var categoryId = await CreateCategoryAsync(token);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Create a block
        var createResponse = await _client.PostAsJsonAsync("/api/blocks", new CreateBlockRequest(
            "Test Block",
            "Description",
            categoryId,
            DateOnly.FromDateTime(DateTime.UtcNow),
            new TimeOnly(15, 0),
            45
        ));
        var createdBlock = await createResponse.Content.ReadFromJsonAsync<ApiResponse<BlockDto>>();

        // Act
        var response = await _client.GetAsync($"/api/blocks/{createdBlock!.Data.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<BlockDto>>();
        Assert.NotNull(result);
        Assert.Equal("Test Block", result.Data.Title);
        Assert.NotNull(result.Data.Category); // Category should be eager loaded

        // Cleanup
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task GetBlock_NotOwnedByUser_ReturnsNotFound()
    {
        // Arrange
        var token1 = await GetAuthTokenAsync();
        var categoryId = await CreateCategoryAsync(token1);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token1);

        // Create block with first user
        var createResponse = await _client.PostAsJsonAsync("/api/blocks", new CreateBlockRequest(
            "Private Block",
            null,
            categoryId,
            DateOnly.FromDateTime(DateTime.UtcNow),
            new TimeOnly(12, 0),
            60
        ));
        var createdBlock = await createResponse.Content.ReadFromJsonAsync<ApiResponse<BlockDto>>();

        // Switch to second user
        var token2 = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token2);

        // Act - Try to access first user's block
        var response = await _client.GetAsync($"/api/blocks/{createdBlock!.Data.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        // Cleanup
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task UpdateBlock_WithValidData_ReturnsOk()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        var categoryId = await CreateCategoryAsync(token);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Create a block
        var createResponse = await _client.PostAsJsonAsync("/api/blocks", new CreateBlockRequest(
            "Old Title",
            "Old Subtitle",
            categoryId,
            DateOnly.FromDateTime(DateTime.UtcNow),
            new TimeOnly(8, 0),
            30
        ));
        var createdBlock = await createResponse.Content.ReadFromJsonAsync<ApiResponse<BlockDto>>();

        var updateRequest = new UpdateBlockRequest(
            "New Title",
            "New Subtitle",
            null,
            null,
            new TimeOnly(9, 0), // Change start time
            60, // Change duration
            true, // Mark as urgent
            null,
            null
        );

        // Act
        var response = await _client.PatchAsJsonAsync($"/api/blocks/{createdBlock!.Data.Id}", updateRequest);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<BlockDto>>();
        Assert.NotNull(result);
        Assert.Equal("New Title", result.Data.Title);
        Assert.Equal("New Subtitle", result.Data.Subtitle);
        Assert.Equal(new TimeOnly(9, 0), result.Data.StartTime);
        Assert.Equal(60, result.Data.DurationMinutes);
        Assert.Equal(new TimeOnly(10, 0), result.Data.EndTime); // Should be recalculated
        Assert.True(result.Data.IsUrgent);

        // Cleanup
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task UpdateBlock_ChangeCategory_ReturnsOk()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        var categoryId1 = await CreateCategoryAsync(token, "Work");
        var categoryId2 = await CreateCategoryAsync(token, "Personal");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Create block with first category
        var createResponse = await _client.PostAsJsonAsync("/api/blocks", new CreateBlockRequest(
            "Test Block",
            null,
            categoryId1,
            DateOnly.FromDateTime(DateTime.UtcNow),
            new TimeOnly(13, 0),
            30
        ));
        var createdBlock = await createResponse.Content.ReadFromJsonAsync<ApiResponse<BlockDto>>();

        var updateRequest = new UpdateBlockRequest(
            "Test Block",
            null,
            categoryId2, // Change category
            null,
            null,
            null,
            null,
            null,
            null
        );

        // Act
        var response = await _client.PatchAsJsonAsync($"/api/blocks/{createdBlock!.Data.Id}", updateRequest);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<BlockDto>>();
        Assert.NotNull(result);
        Assert.Equal(categoryId2, result.Data.CategoryId);

        // Cleanup
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task UpdateBlock_NotOwnedByUser_ReturnsForbidden()
    {
        // Arrange
        var token1 = await GetAuthTokenAsync();
        var categoryId = await CreateCategoryAsync(token1);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token1);

        // Create block with first user
        var createResponse = await _client.PostAsJsonAsync("/api/blocks", new CreateBlockRequest(
            "Original",
            null,
            categoryId,
            DateOnly.FromDateTime(DateTime.UtcNow),
            new TimeOnly(11, 0),
            30
        ));
        var createdBlock = await createResponse.Content.ReadFromJsonAsync<ApiResponse<BlockDto>>();

        // Switch to second user
        var token2 = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token2);

        var updateRequest = new UpdateBlockRequest("Hacked", null, null, null, null, null, null, null, null);

        // Act
        var response = await _client.PatchAsJsonAsync($"/api/blocks/{createdBlock!.Data.Id}", updateRequest);

        // Assert
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiError>();
        Assert.NotNull(result);
        Assert.Equal("NOT_OWNER", result.Error.Code);

        // Cleanup
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task CompleteBlock_WithValidId_ReturnsOk()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        var categoryId = await CreateCategoryAsync(token);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Create a block
        var createResponse = await _client.PostAsJsonAsync("/api/blocks", new CreateBlockRequest(
            "To Complete",
            null,
            categoryId,
            DateOnly.FromDateTime(DateTime.UtcNow),
            new TimeOnly(14, 0),
            45
        ));
        var createdBlock = await createResponse.Content.ReadFromJsonAsync<ApiResponse<BlockDto>>();

        // Act
        var response = await _client.PostAsJsonAsync($"/api/blocks/{createdBlock!.Data.Id}/complete", new { });

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<BlockDto>>();
        Assert.NotNull(result);
        Assert.True(result.Data.IsCompleted);
        Assert.Equal(100, result.Data.Progress);
        Assert.NotNull(result.Data.CompletedAt);

        // Cleanup
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task CompleteBlock_NotOwnedByUser_ReturnsForbidden()
    {
        // Arrange
        var token1 = await GetAuthTokenAsync();
        var categoryId = await CreateCategoryAsync(token1);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token1);

        // Create block with first user
        var createResponse = await _client.PostAsJsonAsync("/api/blocks", new CreateBlockRequest(
            "Block",
            null,
            categoryId,
            DateOnly.FromDateTime(DateTime.UtcNow),
            new TimeOnly(16, 0),
            30
        ));
        var createdBlock = await createResponse.Content.ReadFromJsonAsync<ApiResponse<BlockDto>>();

        // Switch to second user
        var token2 = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token2);

        // Act
        var response = await _client.PostAsJsonAsync($"/api/blocks/{createdBlock!.Data.Id}/complete", new { });

        // Assert
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);

        // Cleanup
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task DeleteBlock_WithValidId_ReturnsOk()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        var categoryId = await CreateCategoryAsync(token);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Create a block
        var createResponse = await _client.PostAsJsonAsync("/api/blocks", new CreateBlockRequest(
            "To Delete",
            null,
            categoryId,
            DateOnly.FromDateTime(DateTime.UtcNow),
            new TimeOnly(17, 0),
            30
        ));
        var createdBlock = await createResponse.Content.ReadFromJsonAsync<ApiResponse<BlockDto>>();

        // Act
        var response = await _client.DeleteAsync($"/api/blocks/{createdBlock!.Data.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<MessageResponse>>();
        Assert.NotNull(result);
        Assert.Contains("deleted successfully", result.Data.Message, StringComparison.OrdinalIgnoreCase);

        // Verify it's actually deleted
        var getResponse = await _client.GetAsync($"/api/blocks/{createdBlock.Data.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);

        // Cleanup
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task DeleteBlock_NotOwnedByUser_ReturnsForbidden()
    {
        // Arrange
        var token1 = await GetAuthTokenAsync();
        var categoryId = await CreateCategoryAsync(token1);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token1);

        // Create block with first user
        var createResponse = await _client.PostAsJsonAsync("/api/blocks", new CreateBlockRequest(
            "Protected",
            null,
            categoryId,
            DateOnly.FromDateTime(DateTime.UtcNow),
            new TimeOnly(18, 0),
            30
        ));
        var createdBlock = await createResponse.Content.ReadFromJsonAsync<ApiResponse<BlockDto>>();

        // Switch to second user
        var token2 = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token2);

        // Act
        var response = await _client.DeleteAsync($"/api/blocks/{createdBlock!.Data.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiError>();
        Assert.NotNull(result);
        Assert.Equal("NOT_OWNER", result.Error.Code);

        // Cleanup
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task GetBlocks_WithoutAuth_ReturnsUnauthorized()
    {
        // Act
        var response = await _client.GetAsync("/api/blocks");

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task CreateBlock_WithUrgentFlag_SavesCorrectly()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        var categoryId = await CreateCategoryAsync(token);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var request = new CreateBlockRequest(
            "Urgent Task",
            null,
            categoryId,
            DateOnly.FromDateTime(DateTime.UtcNow),
            new TimeOnly(8, 30),
            120,
            true // Urgent
        );

        // Act
        var response = await _client.PostAsJsonAsync("/api/blocks", request);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<BlockDto>>();
        Assert.NotNull(result);
        Assert.True(result.Data.IsUrgent);

        // Cleanup
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task UpdateBlock_SetProgress_UpdatesCorrectly()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        var categoryId = await CreateCategoryAsync(token);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Create a block
        var createResponse = await _client.PostAsJsonAsync("/api/blocks", new CreateBlockRequest(
            "In Progress",
            null,
            categoryId,
            DateOnly.FromDateTime(DateTime.UtcNow),
            new TimeOnly(10, 30),
            60
        ));
        var createdBlock = await createResponse.Content.ReadFromJsonAsync<ApiResponse<BlockDto>>();

        var updateRequest = new UpdateBlockRequest(
            "In Progress",
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            50 // 50% progress
        );

        // Act
        var response = await _client.PatchAsJsonAsync($"/api/blocks/{createdBlock!.Data.Id}", updateRequest);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<BlockDto>>();
        Assert.NotNull(result);
        Assert.Equal(50, result.Data.Progress);
        Assert.False(result.Data.IsCompleted); // Not completed yet

        // Cleanup
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task CreateBlock_AutoCalculatesEndTime()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        var categoryId = await CreateCategoryAsync(token);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var startTime = new TimeOnly(14, 30);
        var duration = 90; // 1.5 hours
        var expectedEndTime = new TimeOnly(16, 0);

        var request = new CreateBlockRequest(
            "Test",
            null,
            categoryId,
            DateOnly.FromDateTime(DateTime.UtcNow),
            startTime,
            duration
        );

        // Act
        var response = await _client.PostAsJsonAsync("/api/blocks", request);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<BlockDto>>();
        Assert.NotNull(result);
        Assert.Equal(expectedEndTime, result.Data.EndTime);

        // Cleanup
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task CreateBlock_AutoAssignsSortOrder()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        var categoryId = await CreateCategoryAsync(token);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var date = DateOnly.FromDateTime(DateTime.UtcNow);

        // Create multiple blocks on same date
        var response1 = await _client.PostAsJsonAsync("/api/blocks", new CreateBlockRequest("Block 1", null, categoryId, date, new TimeOnly(9, 0), 30));
        var response2 = await _client.PostAsJsonAsync("/api/blocks", new CreateBlockRequest("Block 2", null, categoryId, date, new TimeOnly(10, 0), 30));
        var response3 = await _client.PostAsJsonAsync("/api/blocks", new CreateBlockRequest("Block 3", null, categoryId, date, new TimeOnly(11, 0), 30));

        // Assert
        var block1 = await response1.Content.ReadFromJsonAsync<ApiResponse<BlockDto>>();
        var block2 = await response2.Content.ReadFromJsonAsync<ApiResponse<BlockDto>>();
        var block3 = await response3.Content.ReadFromJsonAsync<ApiResponse<BlockDto>>();

        Assert.NotNull(block1);
        Assert.NotNull(block2);
        Assert.NotNull(block3);

        // Sort orders should be sequential
        Assert.True(block1.Data.SortOrder > 0);
        Assert.True(block2.Data.SortOrder > block1.Data.SortOrder);
        Assert.True(block3.Data.SortOrder > block2.Data.SortOrder);

        // Cleanup
        _client.DefaultRequestHeaders.Authorization = null;
    }
}
