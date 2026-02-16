using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Tymblok.Api.DTOs;

namespace Tymblok.Api.Tests;

[Collection("Sequential")]
public class CategoriesControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public CategoriesControllerTests(CustomWebApplicationFactory factory)
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
    public async Task CreateCategory_WithValidData_ReturnsCreated()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var request = new CreateCategoryRequest("Work", "#6366f1", "briefcase");

        // Act
        var response = await _client.PostAsJsonAsync("/api/categories", request);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<CategoryDto>>();
        Assert.NotNull(result);
        Assert.Equal("Work", result.Data.Name);
        Assert.Equal("#6366f1", result.Data.Color);
        Assert.Equal("briefcase", result.Data.Icon);
        Assert.False(result.Data.IsSystem);

        // Cleanup
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task CreateCategory_WithInvalidColor_ReturnsBadRequest()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var request = new { name = "Work", color = "invalid-color", icon = "briefcase" };

        // Act
        var response = await _client.PostAsJsonAsync("/api/categories", request);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        // Cleanup
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task CreateCategory_WithoutAuth_ReturnsUnauthorized()
    {
        // Arrange
        var request = new CreateCategoryRequest("Work", "#6366f1", "briefcase");

        // Act
        var response = await _client.PostAsJsonAsync("/api/categories", request);

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetCategories_WithAuth_ReturnsOk()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Create a category first
        var createRequest = new CreateCategoryRequest("Personal", "#ec4899", "user");
        await _client.PostAsJsonAsync("/api/categories", createRequest);

        // Act
        var response = await _client.GetAsync("/api/categories");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<CategoriesResponse>>();
        Assert.NotNull(result);
        Assert.NotEmpty(result.Data.Categories);

        // Cleanup
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task GetCategory_WithValidId_ReturnsOk()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Create a category first
        var createRequest = new CreateCategoryRequest("Test Category", "#10b981", "star");
        var createResponse = await _client.PostAsJsonAsync("/api/categories", createRequest);
        var createdCategory = await createResponse.Content.ReadFromJsonAsync<ApiResponse<CategoryDto>>();

        // Act
        var response = await _client.GetAsync($"/api/categories/{createdCategory!.Data.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<CategoryDto>>();
        Assert.NotNull(result);
        Assert.Equal("Test Category", result.Data.Name);

        // Cleanup
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task GetCategory_NotOwnedByUser_ReturnsNotFound()
    {
        // Arrange
        var token1 = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token1);

        // Create a category with first user
        var createRequest = new CreateCategoryRequest("Private Category", "#f59e0b", "lock");
        var createResponse = await _client.PostAsJsonAsync("/api/categories", createRequest);
        var createdCategory = await createResponse.Content.ReadFromJsonAsync<ApiResponse<CategoryDto>>();

        // Switch to second user
        var token2 = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token2);

        // Act - Try to access first user's category
        var response = await _client.GetAsync($"/api/categories/{createdCategory!.Data.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        // Cleanup
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task UpdateCategory_WithValidData_ReturnsOk()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Create a category first
        var createRequest = new CreateCategoryRequest("Old Name", "#6366f1", "old-icon");
        var createResponse = await _client.PostAsJsonAsync("/api/categories", createRequest);
        var createdCategory = await createResponse.Content.ReadFromJsonAsync<ApiResponse<CategoryDto>>();

        var updateRequest = new UpdateCategoryRequest("New Name", "#ec4899", "new-icon");

        // Act
        var response = await _client.PatchAsJsonAsync($"/api/categories/{createdCategory!.Data.Id}", updateRequest);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<CategoryDto>>();
        Assert.NotNull(result);
        Assert.Equal("New Name", result.Data.Name);
        Assert.Equal("#ec4899", result.Data.Color);
        Assert.Equal("new-icon", result.Data.Icon);

        // Cleanup
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task UpdateCategory_NotOwnedByUser_ReturnsForbidden()
    {
        // Arrange
        var token1 = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token1);

        // Create a category with first user
        var createRequest = new CreateCategoryRequest("User1 Category", "#6366f1", "icon1");
        var createResponse = await _client.PostAsJsonAsync("/api/categories", createRequest);
        var createdCategory = await createResponse.Content.ReadFromJsonAsync<ApiResponse<CategoryDto>>();

        // Switch to second user
        var token2 = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token2);

        var updateRequest = new UpdateCategoryRequest("Hacked Name", "#000000", "hacked");

        // Act - Try to update first user's category
        var response = await _client.PatchAsJsonAsync($"/api/categories/{createdCategory!.Data.Id}", updateRequest);

        // Assert
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiError>();
        Assert.NotNull(result);
        Assert.Equal("NOT_OWNER", result.Error.Code);

        // Cleanup
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task DeleteCategory_WithValidId_ReturnsOk()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Create a category first
        var createRequest = new CreateCategoryRequest("To Delete", "#ef4444", "trash");
        var createResponse = await _client.PostAsJsonAsync("/api/categories", createRequest);
        var createdCategory = await createResponse.Content.ReadFromJsonAsync<ApiResponse<CategoryDto>>();

        // Act
        var response = await _client.DeleteAsync($"/api/categories/{createdCategory!.Data.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<MessageResponse>>();
        Assert.NotNull(result);
        Assert.Contains("deleted successfully", result.Data.Message, StringComparison.OrdinalIgnoreCase);

        // Verify it's actually deleted
        var getResponse = await _client.GetAsync($"/api/categories/{createdCategory.Data.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);

        // Cleanup
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task DeleteCategory_NotOwnedByUser_ReturnsForbidden()
    {
        // Arrange
        var token1 = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token1);

        // Create a category with first user
        var createRequest = new CreateCategoryRequest("Protected Category", "#6366f1", "shield");
        var createResponse = await _client.PostAsJsonAsync("/api/categories", createRequest);
        var createdCategory = await createResponse.Content.ReadFromJsonAsync<ApiResponse<CategoryDto>>();

        // Switch to second user
        var token2 = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token2);

        // Act - Try to delete first user's category
        var response = await _client.DeleteAsync($"/api/categories/{createdCategory!.Data.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiError>();
        Assert.NotNull(result);
        Assert.Equal("NOT_OWNER", result.Error.Code);

        // Cleanup
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task GetCategories_WithoutAuth_ReturnsUnauthorized()
    {
        // Act
        var response = await _client.GetAsync("/api/categories");

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task UpdateCategory_WithInvalidColorFormat_ReturnsBadRequest()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Create a category first
        var createRequest = new CreateCategoryRequest("Test", "#6366f1", "icon");
        var createResponse = await _client.PostAsJsonAsync("/api/categories", createRequest);
        var createdCategory = await createResponse.Content.ReadFromJsonAsync<ApiResponse<CategoryDto>>();

        var updateRequest = new { name = "Updated", color = "blue", icon = "icon" };

        // Act
        var response = await _client.PatchAsJsonAsync($"/api/categories/{createdCategory!.Data.Id}", updateRequest);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        // Cleanup
        _client.DefaultRequestHeaders.Authorization = null;
    }
}
