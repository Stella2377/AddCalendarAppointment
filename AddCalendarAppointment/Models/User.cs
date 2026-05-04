using AddCalendarAppointment.Models;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace AddCalendarAppointment.Models
{
    public class User
    {
        [Key]
        public string? UserID { get; set; }

        public string? UserName { get; set; }

        // Mối quan hệ: Một User có thể tham gia nhiều GroupMeeting
        public virtual ICollection<GroupMeeting> GroupMeetings { get; set; } = new List<GroupMeeting>();
    }
}