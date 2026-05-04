using System;
using System.Collections.Generic;

namespace AddCalendarAppointment.Models
{
    public enum VisibilityType
    {
        Private,
        Public
    }

    public enum RecurringType
    {
        None,
        Daily,
        Weekly,
        Monthly,
        Annually,
        Custom
    }

    public enum GuestStatus
    {
        Pending,
        Accepted,
        Deny,
        Maybe
    }

    public enum NotificationType
    {
        Off,
        Alerts
    }

    public class User
    {
        public Guid Id { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public string? FullName { get; set; }
        public string Password { get; set; }

        public ICollection<Team> OwnedTeams { get; set; }
        public ICollection<Team> JoinedTeams { get; set; }
        public ICollection<Appointment> OwnedAppointments { get; set; }
        public ICollection<AppointmentGuest> AppointmentInvitations { get; set; }
        public UserSettings Settings { get; set; }
    }
}