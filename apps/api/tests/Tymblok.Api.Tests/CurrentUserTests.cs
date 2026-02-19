using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Tymblok.Api.Services;

namespace Tymblok.Api.Tests;

public class CurrentUserTests
{
    private static IHttpContextAccessor CreateAccessor(ClaimsPrincipal? user = null)
    {
        var context = new DefaultHttpContext();
        if (user != null)
            context.User = user;

        var accessor = new HttpContextAccessor { HttpContext = context };
        return accessor;
    }

    private static ClaimsPrincipal CreatePrincipal(string? nameIdentifier)
    {
        var claims = new List<Claim>();
        if (nameIdentifier != null)
            claims.Add(new Claim(ClaimTypes.NameIdentifier, nameIdentifier));

        return new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
    }

    [Fact]
    public void UserId_WithValidGuidClaim_ReturnsGuid()
    {
        var expectedId = Guid.NewGuid();
        var accessor = CreateAccessor(CreatePrincipal(expectedId.ToString()));
        var currentUser = new CurrentUser(accessor);

        var result = currentUser.UserId;

        Assert.Equal(expectedId, result);
    }

    [Fact]
    public void UserId_WithNoClaim_ThrowsUnauthorizedAccessException()
    {
        var accessor = CreateAccessor(CreatePrincipal(null));
        var currentUser = new CurrentUser(accessor);

        Assert.Throws<UnauthorizedAccessException>(() => currentUser.UserId);
    }

    [Fact]
    public void UserId_WithInvalidGuid_ThrowsUnauthorizedAccessException()
    {
        var accessor = CreateAccessor(CreatePrincipal("not-a-guid"));
        var currentUser = new CurrentUser(accessor);

        Assert.Throws<UnauthorizedAccessException>(() => currentUser.UserId);
    }

    [Fact]
    public void UserId_WithNoHttpContext_ThrowsUnauthorizedAccessException()
    {
        var accessor = new HttpContextAccessor { HttpContext = null };
        var currentUser = new CurrentUser(accessor);

        Assert.Throws<UnauthorizedAccessException>(() => currentUser.UserId);
    }

    [Fact]
    public void UserId_WithEmptyClaim_ThrowsUnauthorizedAccessException()
    {
        var accessor = CreateAccessor(CreatePrincipal(""));
        var currentUser = new CurrentUser(accessor);

        Assert.Throws<UnauthorizedAccessException>(() => currentUser.UserId);
    }

    [Fact]
    public void UserId_CalledMultipleTimes_ReturnsSameValue()
    {
        var expectedId = Guid.NewGuid();
        var accessor = CreateAccessor(CreatePrincipal(expectedId.ToString()));
        var currentUser = new CurrentUser(accessor);

        var first = currentUser.UserId;
        var second = currentUser.UserId;

        Assert.Equal(first, second);
    }
}
