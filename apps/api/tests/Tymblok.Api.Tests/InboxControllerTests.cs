using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Tymblok.Api.DTOs;
using Tymblok.Core.Entities;

namespace Tymblok.Api.Tests;

[Collection("Sequential")]
public class InboxControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public InboxControllerTests(CustomWebApplicationFactory factory)
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

    [Fact]
    public async Task CreateInboxItem_WithValidData_ReturnsCreated()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var request = new CreateInboxItemRequest("Review PR #123", "Review the pull request for new feature", InboxPriority.High);

        // Act
        var response = await _client.PostAsJsonAsync("/api/inbox", request);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<InboxItemDto>>();
        Assert.NotNull(result);
        Assert.Equal("Review PR #123", result.Data.Title);
        Assert.Equal("Review the pull request for new feature", result.Data.Description);
        Assert.Equal(InboxPriority.High, result.Data.Priority);
        Assert.Equal(InboxSource.Manual, result.Data.Source);
        Assert.Equal(InboxItemType.Task, result.Data.Type);
        Assert.False(result.Data.IsDismissed);
        Assert.False(result.Data.IsScheduled);

        // Cleanup
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task CreateInboxItem_WithoutAuth_ReturnsUnauthorized()
    {
        // Arrange
        var request = new CreateInboxItemRequest("Test Item", null, InboxPriority.Normal);

        // Act
        var response = await _client.PostAsJsonAsync("/api/inbox", request);

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task CreateInboxItem_WithEmptyTitle_ReturnsBadRequest()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var request = new { title = "", description = "Test", priority = InboxPriority.Normal };

        // Act
        var response = await _client.PostAsJsonAsync("/api/inbox", request);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        // Cleanup
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task GetInboxItems_WithAuth_ReturnsOk()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Create some items first
        await _client.PostAsJsonAsync("/api/inbox", new CreateInboxItemRequest("Item 1", null, InboxPriority.Normal));
        await _client.PostAsJsonAsync("/api/inbox", new CreateInboxItemRequest("Item 2", null, InboxPriority.High));

        // Act
        var response = await _client.GetAsync("/api/inbox");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<InboxItemsResponse>>();
        Assert.NotNull(result);
        Assert.True(result.Data.Items.Count >= 2);

        // Cleanup
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task GetInboxItems_WithIsDismissedFilter_ReturnsFilteredResults()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Create and dismiss one item
        var createResponse = await _client.PostAsJsonAsync("/api/inbox", new CreateInboxItemRequest("To Dismiss", null, InboxPriority.Normal));
        var createdItem = await createResponse.Content.ReadFromJsonAsync<ApiResponse<InboxItemDto>>();
        await _client.PatchAsJsonAsync($"/api/inbox/{createdItem!.Data.Id}/dismiss", new { });

        // Create another item that's not dismissed
        await _client.PostAsJsonAsync("/api/inbox", new CreateInboxItemRequest("Active Item", null, InboxPriority.Normal));

        // Act - Filter for non-dismissed items
        var response = await _client.GetAsync("/api/inbox?isDismissed=false");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<InboxItemsResponse>>();
        Assert.NotNull(result);
        Assert.All(result.Data.Items, item => Assert.False(item.IsDismissed));

        // Cleanup
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task GetInboxItems_WithPriorityFilter_ReturnsFilteredResults()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Create items with different priorities
        await _client.PostAsJsonAsync("/api/inbox", new CreateInboxItemRequest("Normal Priority", null, InboxPriority.Normal));
        await _client.PostAsJsonAsync("/api/inbox", new CreateInboxItemRequest("High Priority", null, InboxPriority.High));

        // Act - Filter for high priority only
        var response = await _client.GetAsync($"/api/inbox?priority={InboxPriority.High}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<InboxItemsResponse>>();
        Assert.NotNull(result);
        Assert.All(result.Data.Items, item => Assert.Equal(InboxPriority.High, item.Priority));

        // Cleanup
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task GetInboxItem_WithValidId_ReturnsOk()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Create an item
        var createResponse = await _client.PostAsJsonAsync("/api/inbox", new CreateInboxItemRequest("Test Item", "Description", InboxPriority.Normal));
        var createdItem = await createResponse.Content.ReadFromJsonAsync<ApiResponse<InboxItemDto>>();

        // Act
        var response = await _client.GetAsync($"/api/inbox/{createdItem!.Data.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<InboxItemDto>>();
        Assert.NotNull(result);
        Assert.Equal("Test Item", result.Data.Title);

        // Cleanup
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task GetInboxItem_NotOwnedByUser_ReturnsNotFound()
    {
        // Arrange
        var token1 = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token1);

        // Create an item with first user
        var createResponse = await _client.PostAsJsonAsync("/api/inbox", new CreateInboxItemRequest("Private Item", null, InboxPriority.Normal));
        var createdItem = await createResponse.Content.ReadFromJsonAsync<ApiResponse<InboxItemDto>>();

        // Switch to second user
        var token2 = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token2);

        // Act - Try to access first user's item
        var response = await _client.GetAsync($"/api/inbox/{createdItem!.Data.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        // Cleanup
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task UpdateInboxItem_WithValidData_ReturnsOk()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Create an item
        var createResponse = await _client.PostAsJsonAsync("/api/inbox", new CreateInboxItemRequest("Old Title", "Old Description", InboxPriority.Normal));
        var createdItem = await createResponse.Content.ReadFromJsonAsync<ApiResponse<InboxItemDto>>();

        var updateRequest = new UpdateInboxItemRequest("New Title", "New Description", InboxPriority.High, null);

        // Act
        var response = await _client.PatchAsJsonAsync($"/api/inbox/{createdItem!.Data.Id}", updateRequest);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<InboxItemDto>>();
        Assert.NotNull(result);
        Assert.Equal("New Title", result.Data.Title);
        Assert.Equal("New Description", result.Data.Description);
        Assert.Equal(InboxPriority.High, result.Data.Priority);

        // Cleanup
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task UpdateInboxItem_NotOwnedByUser_ReturnsForbidden()
    {
        // Arrange
        var token1 = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token1);

        // Create an item with first user
        var createResponse = await _client.PostAsJsonAsync("/api/inbox", new CreateInboxItemRequest("Original", null, InboxPriority.Normal));
        var createdItem = await createResponse.Content.ReadFromJsonAsync<ApiResponse<InboxItemDto>>();

        // Switch to second user
        var token2 = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token2);

        var updateRequest = new UpdateInboxItemRequest("Hacked", null, null, null);

        // Act - Try to update first user's item
        var response = await _client.PatchAsJsonAsync($"/api/inbox/{createdItem!.Data.Id}", updateRequest);

        // Assert
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiError>();
        Assert.NotNull(result);
        Assert.Equal("NOT_OWNER", result.Error.Code);

        // Cleanup
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task DismissInboxItem_WithValidId_ReturnsOk()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Create an item
        var createResponse = await _client.PostAsJsonAsync("/api/inbox", new CreateInboxItemRequest("To Dismiss", null, InboxPriority.Normal));
        var createdItem = await createResponse.Content.ReadFromJsonAsync<ApiResponse<InboxItemDto>>();

        // Act
        var response = await _client.PatchAsJsonAsync($"/api/inbox/{createdItem!.Data.Id}/dismiss", new { });

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<InboxItemDto>>();
        Assert.NotNull(result);
        Assert.True(result.Data.IsDismissed);
        Assert.NotNull(result.Data.DismissedAt);

        // Cleanup
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task DismissInboxItem_NotOwnedByUser_ReturnsForbidden()
    {
        // Arrange
        var token1 = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token1);

        // Create an item with first user
        var createResponse = await _client.PostAsJsonAsync("/api/inbox", new CreateInboxItemRequest("Item", null, InboxPriority.Normal));
        var createdItem = await createResponse.Content.ReadFromJsonAsync<ApiResponse<InboxItemDto>>();

        // Switch to second user
        var token2 = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token2);

        // Act - Try to dismiss first user's item
        var response = await _client.PatchAsJsonAsync($"/api/inbox/{createdItem!.Data.Id}/dismiss", new { });

        // Assert
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);

        // Cleanup
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task DeleteInboxItem_WithValidId_ReturnsOk()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Create an item
        var createResponse = await _client.PostAsJsonAsync("/api/inbox", new CreateInboxItemRequest("To Delete", null, InboxPriority.Normal));
        var createdItem = await createResponse.Content.ReadFromJsonAsync<ApiResponse<InboxItemDto>>();

        // Act
        var response = await _client.DeleteAsync($"/api/inbox/{createdItem!.Data.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<MessageResponse>>();
        Assert.NotNull(result);
        Assert.Contains("deleted successfully", result.Data.Message, StringComparison.OrdinalIgnoreCase);

        // Verify it's actually deleted
        var getResponse = await _client.GetAsync($"/api/inbox/{createdItem.Data.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);

        // Cleanup
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task DeleteInboxItem_NotOwnedByUser_ReturnsForbidden()
    {
        // Arrange
        var token1 = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token1);

        // Create an item with first user
        var createResponse = await _client.PostAsJsonAsync("/api/inbox", new CreateInboxItemRequest("Protected Item", null, InboxPriority.Normal));
        var createdItem = await createResponse.Content.ReadFromJsonAsync<ApiResponse<InboxItemDto>>();

        // Switch to second user
        var token2 = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token2);

        // Act - Try to delete first user's item
        var response = await _client.DeleteAsync($"/api/inbox/{createdItem!.Data.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiError>();
        Assert.NotNull(result);
        Assert.Equal("NOT_OWNER", result.Error.Code);

        // Cleanup
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task GetInboxItems_WithoutAuth_ReturnsUnauthorized()
    {
        // Act
        var response = await _client.GetAsync("/api/inbox");

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task CreateInboxItem_WithExternalData_SavesCorrectly()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var request = new CreateInboxItemRequest(
            "GitHub PR #456",
            "Review this PR",
            InboxPriority.High,
            null,
            "pr-456",
            "https://github.com/user/repo/pull/456"
        );

        // Act
        var response = await _client.PostAsJsonAsync("/api/inbox", request);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<InboxItemDto>>();
        Assert.NotNull(result);
        Assert.Equal("pr-456", result.Data.ExternalId);
        Assert.Equal("https://github.com/user/repo/pull/456", result.Data.ExternalUrl);

        // Cleanup
        _client.DefaultRequestHeaders.Authorization = null;
    }
}
