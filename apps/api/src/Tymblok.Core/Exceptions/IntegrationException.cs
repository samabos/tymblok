namespace Tymblok.Core.Exceptions;

public class IntegrationException : Exception
{
    public string Code { get; }

    public IntegrationException(string code, string message) : base(message)
    {
        Code = code;
    }
}
