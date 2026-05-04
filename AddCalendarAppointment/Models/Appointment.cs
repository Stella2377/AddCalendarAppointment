using System;
using System.Collections.Generic;

namespace AddCalendarAppointment.Models
{
    public class Appointment
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string Location { get; set; }
        public string Description { get; set; }

        public VisibilityType Visibility { get; set; }
        public string ColorCategory { get; set; }

        public bool IsRecurring { get; set; }
        public RecurringType RecurringRule { get; set; }

        public bool IsDeleted { get; set; }
        public DateTime? DeletedDate { get; set; }

        public Guid OwnerId { get; set; }
        public User Owner { get; set; }

        public Guid? TeamId { get; set; }
        public Team Team { get; set; }

        public ICollection<AppointmentGuest> Guests { get; set; }
    }
}