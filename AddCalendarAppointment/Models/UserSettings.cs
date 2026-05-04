using System;

namespace AddCalendarAppointment.Models
{
    public class UserSettings
    {
        public Guid Id { get; set; }

        public Guid UserId { get; set; }
        public User User { get; set; }

        public string LanguageRegion { get; set; }
        public string TimeZone { get; set; }
        public string DateFormat { get; set; }
        public string TimeFormat { get; set; }
        public int DefaultDuration { get; set; }
        public NotificationType NotificationType { get; set; }
        public string ShowSnoozed { get; set; }
        public bool ShowWeekends { get; set; }
        public bool ShowDeclined { get; set; }
        public bool ShowCompleted { get; set; }
        public DayOfWeek StartWeekOn { get; set; }
        public string CustomViewDays { get; set; }
    }
}