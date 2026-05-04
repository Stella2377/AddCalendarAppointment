using AddCalendarAppointment.Models;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace AddCalendarAppointment.Models
{
    public class Appointment
    {
        [Key]
        public int Id { get; set; } // Khóa chính (EF Core bắt buộc)

        [Required(ErrorMessage = "Tên lịch hẹn không được trống")]
        public string Name { get; set; }

        public string? Location { get; set; }

        [Required]
        public DateTime StartTime { get; set; }

        [Required]
        public DateTime EndTime { get; set; }

        // Thuộc tính để xử lý nhánh rẽ "Replace" (Ghi đè/Xóa lịch cũ)
        public bool IsDeleted { get; set; } = false;

        // Mối quan hệ: Một lịch hẹn sở hữu (owns) nhiều lời nhắc
        public virtual ICollection<Reminder> Reminders { get; set; } = new List<Reminder>();
    }
}