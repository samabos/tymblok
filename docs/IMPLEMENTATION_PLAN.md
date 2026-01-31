 schedule modal
  - Dismiss (×) button
- EmptyState (inbox zero illustration)

Data:
- Use useInbox hook with filters
- useDismissInboxItem mutation
- Pull to refresh

Schedule flow:
- Add button opens a mini modal
- Select date, time, duration, category
- useScheduleInboxItem mutation

Reference /docs/TYMBLOK_UI_SPEC.md for source colors.

Write tests for filtering and schedule flow.
```

**Checklist:**
- [ ] List renders
- [ ] Filters work
- [ ] Schedule flow works
- [ ] Dismiss works
- [ ] Empty state shows
- [ ] Tests pass
- [ ] PR created and CI passes

---

### Task 2.9 - 2.13 & Phases 3-5

See remaining tasks following the same pattern in the full document.

---

## Summary

| Phase | Tasks | Estimated Hours |
|-------|-------|-----------------|
| 0: Foundation | 7 | 28h |
| 1: Core API | 8 | 45h |
| 2: Mobile MVP | 13 | 78h |
| 3: Integrations | 5 | 32h |
| 4: Polish | 7 | 25h |
| 5: Launch Prep | 6 | 36h |
| **Total** | **46** | **~244h** |

---

## Quick Reference: Claude Code Workflow

For each task, use this template:

```
Read /docs/IMPLEMENTATION_PLAN.md task {X.X}.

Create branch: feature/{X.X}-{short-name}

Implement the feature following the requirements.
Reference these docs as needed:
- /docs/ARCHITECTURE.md
- /docs/DATABASE_SCHEMA.md  
- /docs/API_SPEC.md
- /docs/TYMBLOK_UI_SPEC.md
- /docs/prototype.jsx (for UI styling)

Write unit tests with >80% coverage for new code.
Run linter and fix any issues.
Commit with conventional commits.
Push and create PR.
Ensure CI passes before requesting review.
```

---

## Phase 2 Post-Launch Enhancements

After MVP launch, these features from the original "Out of Scope" become Phase 2:

| Feature | Priority | Estimate |
|---------|----------|----------|
| Slack integration | P2.1 | 8h |
| Push notifications | P2.1 | 6h |
| Calendar view (week/month) | P2.1 | 12h |
| Team/collaboration | P2.2 | 20h |
| Recurring blocks | P2.2 | 8h |
| Desktop menu bar | P2.2 | 10h |
| Browser extension | P2.3 | 15h |
| Time tracking billing | P2.3 | 20h |
| AI scheduling | P2.4 | 15h |

---

*Last updated: January 2026*
