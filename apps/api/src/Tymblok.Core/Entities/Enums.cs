namespace Tymblok.Core.Entities;

public enum Theme
{
    Light,
    Dark,
    System
}

public enum TextSize
{
    Small,
    Medium,
    Large
}

public enum IntegrationProvider
{
    GitHub,
    Jira,
    GoogleCalendar,
    Slack,
    Notion,
    Linear
}

public enum InboxSource
{
    Manual,
    GitHub,
    Jira,
    GoogleCalendar,
    Slack,
    GoogleDrive
}

public enum InboxItemType
{
    Task,
    Update,
    Reminder,
    Event
}

public enum InboxPriority
{
    Normal,
    High
}
