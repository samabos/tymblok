using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Tymblok.Api.Controllers;
using Tymblok.Api.DTOs;

namespace Tymblok.Api.Tests;

// Concrete subclass to test the abstract BaseApiController
public class TestController : BaseApiController
{
    public ApiResponse<T> TestWrapResponse<T>(T data) => WrapResponse(data);
    public ApiError TestCreateErrorResponse(string code, string message) => CreateErrorResponse(code, message);
}

public class BaseApiControllerTests
{
    private static TestController CreateController(string? traceIdentifier = null)
    {
        var controller = new TestController();
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                TraceIdentifier = traceIdentifier ?? "test-trace-id"
            }
        };
        return controller;
    }

    [Fact]
    public void WrapResponse_ReturnsApiResponseWithData()
    {
        var controller = CreateController();
        var data = new { Name = "Test", Value = 42 };

        var result = controller.TestWrapResponse(data);

        Assert.Equal(data, result.Data);
    }

    [Fact]
    public void WrapResponse_IncludesTraceIdentifier()
    {
        var controller = CreateController("my-trace-123");

        var result = controller.TestWrapResponse("hello");

        Assert.Equal("my-trace-123", result.Meta.RequestId);
    }

    [Fact]
    public void WrapResponse_IncludesTimestamp()
    {
        var controller = CreateController();

        var result = controller.TestWrapResponse("data");

        Assert.NotNull(result.Meta.Timestamp);
        Assert.True(DateTimeOffset.TryParse(result.Meta.Timestamp, out _));
    }

    [Fact]
    public void WrapResponse_WithStringData_ReturnsCorrectType()
    {
        var controller = CreateController();

        var result = controller.TestWrapResponse("test string");

        Assert.IsType<ApiResponse<string>>(result);
        Assert.Equal("test string", result.Data);
    }

    [Fact]
    public void CreateErrorResponse_ReturnsApiErrorWithCodeAndMessage()
    {
        var controller = CreateController();

        var result = controller.TestCreateErrorResponse("NOT_FOUND", "Resource not found");

        Assert.Equal("NOT_FOUND", result.Error.Code);
        Assert.Equal("Resource not found", result.Error.Message);
    }

    [Fact]
    public void CreateErrorResponse_IncludesTraceIdentifier()
    {
        var controller = CreateController("error-trace-456");

        var result = controller.TestCreateErrorResponse("ERR", "msg");

        Assert.Equal("error-trace-456", result.Meta.RequestId);
    }

    [Fact]
    public void CreateErrorResponse_IncludesTimestamp()
    {
        var controller = CreateController();

        var result = controller.TestCreateErrorResponse("ERR", "msg");

        Assert.NotNull(result.Meta.Timestamp);
        Assert.True(DateTimeOffset.TryParse(result.Meta.Timestamp, out _));
    }
}
