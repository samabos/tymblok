using System.Text.Json.Serialization;

namespace Tymblok.Core.Entities;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum Theme
{
    Light,
    Dark,
    System
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum TextSize
{
    Small,
    Medium,
    Large
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum IntegrationProvider
{
    GitHub,
    Jira,
    GoogleCalendar,
    Slack,
    Notion,
    Linear
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum InboxSource
{
    Manual,
    GitHub,
    Jira,
    GoogleCalendar,
    Slack,
    GoogleDrive
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum InboxItemType
{
    Task,
    Update,
    Reminder,
    Event
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum InboxPriority
{
    Low,
    Medium,
    High,
    Critical
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum TimerState
{
    NotStarted,
    Running,
    Paused,
    Completed
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum SupportContentType
{
    HelpFaq,
    PrivacyPolicy,
    TermsOfService
}
