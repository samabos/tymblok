using Moq;
using Microsoft.Extensions.Logging;
using Tymblok.Core.Entities;
using Tymblok.Core.Exceptions;
using Tymblok.Core.Interfaces;
using Tymblok.Infrastructure.Services;

namespace Tymblok.Infrastructure.Tests.Services;

public class IntegrationServiceTests
{
    private readonly Mock<IIntegrationRepository> _repoMock;
    private readonly Mock<IInboxRepository> _inboxRepoMock;
    private readonly Mock<ITokenEncryptionService> _encryptionMock;
    private readonly Mock<IOAuthStateService> _stateMock;
    private readonly Mock<IAuditService> _auditMock;
    private readonly Mock<IIntegrationProviderService> _githubProviderMock;
    private readonly Mock<ILogger<IntegrationService>> _loggerMock;
    private readonly IntegrationService _service;
    private readonly Guid _userId = Guid.NewGuid();

    public IntegrationServiceTests()
    {
        _repoMock = new Mock<IIntegrationRepository>();
        _inboxRepoMock = new Mock<IInboxRepository>();
        _encryptionMock = new Mock<ITokenEncryptionService>();
        _stateMock = new Mock<IOAuthStateService>();
        _auditMock = new Mock<IAuditService>();
        _githubProviderMock = new Mock<IIntegrationProviderService>();
        _loggerMock = new Mock<ILogger<IntegrationService>>();

        _githubProviderMock.Setup(p => p.Provider).Returns(IntegrationProvider.GitHub);

        _service = new IntegrationService(
            _repoMock.Object,
            _inboxRepoMock.Object,
            _encryptionMock.Object,
            _stateMock.Object,
            _auditMock.Object,
            new[] { _githubProviderMock.Object },
            _loggerMock.Object
        );
    }

    [Fact]
    public async Task GetAllAsync_ReturnsUserIntegrations()
    {
        var integrations = new List<Integration>
        {
            new() { Id = Guid.NewGuid(), UserId = _userId, Provider = IntegrationProvider.GitHub, ExternalUsername = "testuser", AccessToken = "enc", ExternalUserId = "123" }
        };
        _repoMock.Setup(r => r.GetByUserIdAsync(_userId)).ReturnsAsync(integrations);

        var result = await _service.GetAllAsync(_userId);

        Assert.Single(result);
        Assert.Equal(IntegrationProvider.GitHub, result[0].Provider);
        Assert.Equal("testuser", result[0].ExternalUsername);
    }

    [Fact]
    public async Task ConnectAsync_ReturnsAuthUrl()
    {
        _repoMock.Setup(r => r.GetByProviderAsync(_userId, IntegrationProvider.GitHub))
            .ReturnsAsync((Integration?)null);
        _githubProviderMock.Setup(p => p.GetAuthUrlAsync(_userId, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new OAuthConfig("https://github.com/login/oauth/authorize?...", "state123"));

        var result = await _service.ConnectAsync(_userId, IntegrationProvider.GitHub, null);

        Assert.Contains("github.com", result.AuthUrl);
        Assert.Equal("state123", result.State);
    }

    [Fact]
    public async Task ConnectAsync_ThrowsConflict_WhenAlreadyConnected()
    {
        _repoMock.Setup(r => r.GetByProviderAsync(_userId, IntegrationProvider.GitHub))
            .ReturnsAsync(new Integration { Id = Guid.NewGuid(), Provider = IntegrationProvider.GitHub, AccessToken = "enc", ExternalUserId = "123" });

        await Assert.ThrowsAsync<ConflictException>(() =>
            _service.ConnectAsync(_userId, IntegrationProvider.GitHub, null));
    }

    [Fact]
    public async Task CallbackAsync_CreatesIntegration_WithEncryptedTokens()
    {
        var state = "valid-state";
        _stateMock.Setup(s => s.ValidateState(state))
            .Returns(new OAuthStateData(_userId, IntegrationProvider.GitHub, null));
        _repoMock.Setup(r => r.GetByProviderAsync(_userId, IntegrationProvider.GitHub))
            .ReturnsAsync((Integration?)null);
        _githubProviderMock.Setup(p => p.ExchangeCodeAsync("code123", null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new OAuthTokenResult("access-token", null, null, "ext-123", "testuser", "https://avatar.url"));
        _encryptionMock.Setup(e => e.Encrypt("access-token")).Returns("encrypted-token");
        _repoMock.Setup(r => r.CreateAsync(It.IsAny<Integration>()))
            .ReturnsAsync((Integration i) => i);

        var result = await _service.CallbackAsync(_userId, IntegrationProvider.GitHub, "code123", state, null);

        Assert.Equal("testuser", result.ExternalUsername);
        _encryptionMock.Verify(e => e.Encrypt("access-token"), Times.Once);
        _repoMock.Verify(r => r.CreateAsync(It.Is<Integration>(i =>
            i.AccessToken == "encrypted-token" &&
            i.ExternalUserId == "ext-123")), Times.Once);
        _repoMock.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CallbackAsync_ThrowsValidation_ForInvalidState()
    {
        _stateMock.Setup(s => s.ValidateState("bad-state"))
            .Returns((OAuthStateData?)null);

        await Assert.ThrowsAsync<ValidationException>(() =>
            _service.CallbackAsync(_userId, IntegrationProvider.GitHub, "code", "bad-state", null));
    }

    [Fact]
    public async Task CallbackAsync_ThrowsValidation_ForStateMismatch()
    {
        var otherUserId = Guid.NewGuid();
        _stateMock.Setup(s => s.ValidateState("state"))
            .Returns(new OAuthStateData(otherUserId, IntegrationProvider.GitHub, null));

        await Assert.ThrowsAsync<ValidationException>(() =>
            _service.CallbackAsync(_userId, IntegrationProvider.GitHub, "code", "state", null));
    }

    [Fact]
    public async Task DisconnectAsync_DeletesIntegration_AndRevokesAccess()
    {
        var integration = new Integration
        {
            Id = Guid.NewGuid(), UserId = _userId, Provider = IntegrationProvider.GitHub,
            AccessToken = "enc", ExternalUserId = "123", ExternalUsername = "user"
        };
        _repoMock.Setup(r => r.GetByProviderAsync(_userId, IntegrationProvider.GitHub))
            .ReturnsAsync(integration);

        await _service.DisconnectAsync(_userId, IntegrationProvider.GitHub);

        _githubProviderMock.Verify(p => p.RevokeAccessAsync(integration, It.IsAny<CancellationToken>()), Times.Once);
        _repoMock.Verify(r => r.Delete(integration), Times.Once);
        _repoMock.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DisconnectAsync_ThrowsNotFound_WhenNotConnected()
    {
        _repoMock.Setup(r => r.GetByProviderAsync(_userId, IntegrationProvider.GitHub))
            .ReturnsAsync((Integration?)null);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            _service.DisconnectAsync(_userId, IntegrationProvider.GitHub));
    }

    [Fact]
    public async Task SyncAsync_DelegatesToProvider_AndUpdatesLastSyncAt()
    {
        var integration = new Integration
        {
            Id = Guid.NewGuid(), UserId = _userId, Provider = IntegrationProvider.GitHub,
            AccessToken = "enc", ExternalUserId = "123"
        };
        _repoMock.Setup(r => r.GetByProviderAsync(_userId, IntegrationProvider.GitHub))
            .ReturnsAsync(integration);
        _githubProviderMock.Setup(p => p.SyncAsync(integration, _userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SyncResult(5, DateTime.UtcNow));

        var result = await _service.SyncAsync(_userId, IntegrationProvider.GitHub);

        Assert.Equal(5, result.ItemsSynced);
        _repoMock.Verify(r => r.Update(It.Is<Integration>(i => i.LastSyncAt != null && i.LastSyncError == null)), Times.Once);
    }

    [Fact]
    public async Task SyncAsync_RecordsError_WhenProviderFails()
    {
        var integration = new Integration
        {
            Id = Guid.NewGuid(), UserId = _userId, Provider = IntegrationProvider.GitHub,
            AccessToken = "enc", ExternalUserId = "123"
        };
        _repoMock.Setup(r => r.GetByProviderAsync(_userId, IntegrationProvider.GitHub))
            .ReturnsAsync(integration);
        _githubProviderMock.Setup(p => p.SyncAsync(integration, _userId, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("API rate limited"));

        await Assert.ThrowsAsync<IntegrationException>(() =>
            _service.SyncAsync(_userId, IntegrationProvider.GitHub));

        _repoMock.Verify(r => r.Update(It.Is<Integration>(i => i.LastSyncError == "API rate limited")), Times.Once);
    }

    [Fact]
    public async Task ConnectAsync_ThrowsValidation_ForUnsupportedProvider()
    {
        _repoMock.Setup(r => r.GetByProviderAsync(_userId, IntegrationProvider.Slack))
            .ReturnsAsync((Integration?)null);

        await Assert.ThrowsAsync<ValidationException>(() =>
            _service.ConnectAsync(_userId, IntegrationProvider.Slack, null));
    }
}
