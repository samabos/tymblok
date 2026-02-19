namespace Tymblok.Core.Entities;

public class SupportContent : BaseEntity
{
    public string Slug { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public SupportContentType ContentType { get; set; }
    public bool IsPublished { get; set; } = true;
    public int DisplayOrder { get; set; }
}
