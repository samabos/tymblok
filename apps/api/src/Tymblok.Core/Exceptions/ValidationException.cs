namespace Tymblok.Core.Exceptions;

public class ValidationException : Exception
{
    public string Code { get; }

    public ValidationException(string code, string message) : base(message)
    {
        Code = code;
    }
}
