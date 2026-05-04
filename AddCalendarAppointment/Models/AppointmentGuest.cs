using System;

namespace AddCalendarAppointment.Models
{
    public class AppointmentGuest
    {
        public Guid AppointmentId { get; set; }
        public Appointment Appointment { get; set; }

        public Guid UserId { get; set; }
        public User User { get; set; }

        public GuestStatus Status { get; set; }
    }
}