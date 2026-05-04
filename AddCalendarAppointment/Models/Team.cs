using System;
using System.Collections.Generic;

namespace AddCalendarAppointment.Models
{
    public class Team
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public DateTime CreatedTime { get; set; }

        public Guid OwnerId { get; set; }
        public User Owner { get; set; }

        public ICollection<User> Members { get; set; }
        public ICollection<Appointment> Appointments { get; set; }
    }
}