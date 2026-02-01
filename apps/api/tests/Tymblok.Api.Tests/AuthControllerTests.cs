using System.Net;
using System.Net.Http.Json;
using Tymblok.Api.DTOs;

namespace Tymblok.Api.Tests;

public class AuthControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public AuthControllerTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Register_WithValidData_ReturnsCreated()
    {
        // Arrange
        var request = new RegisterRequest("newuser@test.com", "Password123!", "New User");

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/register", request);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<AuthResponse>>();
        Assert.NotNull(result);
        Assert.NotEmpty(result.Data.AccessToken);
        Assert.NotEmpty(result.Data.RefreshToken);
        Assert.Equal("newuser@test.com", result.Data.User.Email);
    }

    [Fact]
    public async Task Register_WithInvalidEmail_ReturnsBadRequest()
    {
        // Arrange
        var request = new { email = "invalid-email", password = "Password123!", name = "Test" };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/register", request);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Register_WithShortPassword_ReturnsBadRequest()
    {
        // Arrange
        var request = new { email = "test@example.com", password = "short", name = "Test" };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/register", request);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsOk()
    {
        // Arrange - First register a user
        var registerRequest = new RegisterRequest("logintest@test.com", "Password123!", "Login Test");
        await _client.PostAsJsonAsync("/api/auth/register", registerRequest);

        var loginRequest = new LoginRequest("logintest@test.com", "Password123!");

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", loginRequest);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<AuthResponse>>();
        Assert.NotNull(result);
        Assert.NotEmpty(result.Data.AccessToken);
    }

    [Fact]
    public async Task Login_WithInvalidCredentials_ReturnsUnauthorized()
    {
        // Arrange
        var request = new LoginRequest("nonexistent@test.com", "WrongPassword!");

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", request);

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Refresh_WithValidToken_ReturnsNewTokens()
    {
        // Arrange - First register and get tokens
        var registerRequest = new RegisterRequest("refreshtest@test.com", "Password123!", "Refresh Test");
        var registerResponse = await _client.PostAsJsonAsync("/api/auth/register", registerRequest);
        var authResult = await registerResponse.Content.ReadFromJsonAsync<ApiResponse<AuthResponse>>();

        var refreshRequest = new RefreshRequest(authResult!.Data.RefreshToken);

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/refresh", refreshRequest);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<RefreshResponse>>();
        Assert.NotNull(result);
        Assert.NotEmpty(result.Data.AccessToken);
        Assert.NotEmpty(result.Data.RefreshToken);
    }

    [Fact]
    public async Task Refresh_WithInvalidToken_ReturnsUnauthorized()
    {
        // Arrange
        var request = new RefreshRequest("invalid_refresh_token");

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/refresh", request);

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ExternalLogin_WithInvalidProvider_ReturnsBadRequest()
    {
        // Act
        var response = await _client.GetAsync("/api/auth/external/invalidprovider");

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiError>();
        Assert.NotNull(result);
        Assert.Equal("INVALID_PROVIDER", result.Error.Code);
    }

    [Fact]
    public async Task GetLinkedProviders_WithoutAuth_ReturnsUnauthorized()
    {
        // Act
        var response = await _client.GetAsync("/api/auth/external/providers");

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ExternalLogin_ValidProviderNotConfigured_ReturnsError()
    {
        // Act - Request for Google (not configured in test environment)
        var response = await _client.GetAsync("/api/auth/external/google");

        // Assert - In test environment without OAuth configured,
        // we expect an error (500 or redirect to error)
        // This validates the endpoint exists and handles unconfigured providers
        Assert.True(
            response.StatusCode == HttpStatusCode.InternalServerError ||
            response.StatusCode == HttpStatusCode.BadRequest ||
            response.StatusCode == HttpStatusCode.Redirect,
            $"Expected error status for unconfigured OAuth, got {response.StatusCode}");
    }

    [Fact]
    public async Task UnlinkExternalProvider_WithoutAuth_ReturnsUnauthorized()
    {
        // Act
        var response = await _client.DeleteAsync("/api/auth/external/link/google");

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
