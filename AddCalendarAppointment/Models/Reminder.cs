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

        public Guid AppointmentId { get; set; }
        public virtual Appointment Appointment { get; set; }

        public Guid UserId { get; set; } // Lưu ID người nhận thông báo
        public bool IsRead { get; set; } = false; // Trạng thái đã đọc hay chưa
        public DateTime CreatedAt { get; set; } = DateTime.Now; // Để sắp xếp mới nhất lên đầu
    }
}