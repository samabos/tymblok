namespace Tymblok.Core.Interfaces;

public interface ICurrentUser
{
    Guid UserId { get; }
}