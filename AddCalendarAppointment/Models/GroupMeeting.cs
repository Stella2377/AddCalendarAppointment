using System.Collections.Generic;

namespace AddCalendarAppointment.Models
{
    // Kế thừa từ Appointment (Đúng với mũi tên "is a")
    public class GroupMeeting : Appointment
    {
        // Mối quan hệ: Danh sách người tham gia cuộc họp
        // Phục vụ cho hành động: addParticipant(user) trong sơ đồ
        public virtual ICollection<User> Participants { get; set; } = new List<User>();
    }
}