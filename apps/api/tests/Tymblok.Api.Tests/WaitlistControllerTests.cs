using System.Net;
using System.Net.Http.Json;
using Tymblok.Api.DTOs;

namespace Tymblok.Api.Tests;

[Collection("Sequential")]
public class WaitlistControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public WaitlistControllerTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Subscribe_WithValidEmail_ReturnsCreated()
    {
        var request = new WaitlistRequest("waitlist-test@example.com", "Test User", "landing");

        var response = await _client.PostAsJsonAsync("/api/waitlist", request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<WaitlistResponse>>();
        Assert.NotNull(result);
        Assert.False(result.Data.AlreadySubscribed);
        Assert.Contains("waitlist", result.Data.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Subscribe_DuplicateEmail_ReturnsOkWithAlreadySubscribed()
    {
        var request = new WaitlistRequest("duplicate-test@example.com", "Test", "landing");

        // First subscription
        await _client.PostAsJsonAsync("/api/waitlist", request);

        // Duplicate subscription
        var response = await _client.PostAsJsonAsync("/api/waitlist", request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<WaitlistResponse>>();
        Assert.NotNull(result);
        Assert.True(result.Data.AlreadySubscribed);
    }

    [Fact]
    public async Task Subscribe_WithInvalidEmail_ReturnsBadRequest()
    {
        var request = new { email = "not-an-email", name = "Test", source = "landing" };

        var response = await _client.PostAsJsonAsync("/api/waitlist", request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Subscribe_WithMissingEmail_ReturnsBadRequest()
    {
        var request = new { name = "Test", source = "landing" };

        var response = await _client.PostAsJsonAsync("/api/waitlist", request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Subscribe_WithOnlyEmail_ReturnsCreated()
    {
        var request = new WaitlistRequest("minimal-test@example.com", null, null);

        var response = await _client.PostAsJsonAsync("/api/waitlist", request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task Subscribe_EmailIsCaseInsensitive()
    {
        var request1 = new WaitlistRequest("CASE-test@example.com", "Test", "landing");
        var request2 = new WaitlistRequest("case-test@example.com", "Test", "landing");

        await _client.PostAsJsonAsync("/api/waitlist", request1);
        var response = await _client.PostAsJsonAsync("/api/waitlist", request2);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<WaitlistResponse>>();
        Assert.NotNull(result);
        Assert.True(result.Data.AlreadySubscribed);
    }
}
