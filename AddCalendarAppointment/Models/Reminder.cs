using System;
using System.ComponentModel.DataAnnotations;

namespace AddCalendarAppointment.Models
{
    public class Reminder
    {
        [Key]
        public int Id { get; set; }

        public DateTime AlertTime { get; set; }

        public string? Message { get; set; }

        // Khóa ngoại liên kết ngược lại với Appointment
        public int AppointmentId { get; set; }
        public virtual Appointment Appointment { get; set; }
    }
}