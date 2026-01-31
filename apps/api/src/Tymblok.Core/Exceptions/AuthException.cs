namespace Tymblok.Core.Exceptions;

public class AuthException : Exception
{
    public string Code { get; }

    public AuthException(string code, string message) : base(message)
    {
        Code = code;
    }
}
