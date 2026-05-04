$(document).ready(function () {
    // --- KHỞI TẠO BIẾN TOÀN CỤC ---
    let currDate = new Date(); 

    renderDynamicMiniCalendar(currDate);
    updateMainMonthTitle(currDate);

    // ==========================================
    // SỰ KIỆN ĐIỀU HƯỚNG
    // ==========================================

    $('#mini-prev').on('click', function () {
        currDate.setMonth(currDate.getMonth() - 1);
        renderDynamicMiniCalendar(currDate);
    });

    $('#mini-next').on('click', function () {
        currDate.setMonth(currDate.getMonth() + 1);
        renderDynamicMiniCalendar(currDate);
    });

    $('#btn-today').on('click', function () {
        currDate = new Date();
        syncAllCalendars();
    });

    $('#main-prev').on('click', function () {
        const view = $('#viewSelector').val();
        if (view === "7") currDate.setDate(currDate.getDate() - 7);
        else if (view === "1") currDate.setDate(currDate.getDate() - 1);
        else currDate.setMonth(currDate.getMonth() - 1);

        syncAllCalendars();
    });

    $('#main-next').on('click', function () {
        const view = $('#viewSelector').val();
        if (view === "7") currDate.setDate(currDate.getDate() + 7);
        else if (view === "1") currDate.setDate(currDate.getDate() + 1);
        else currDate.setMonth(currDate.getMonth() + 1);

        syncAllCalendars();
    });

    function syncAllCalendars() {
        renderDynamicMiniCalendar(currDate);
        updateMainMonthTitle(currDate);
        if (typeof loadAppointments === "function") {
            loadAppointments(); 
        }
    }

    $('#btnToggleSidebar').on('click', function () {
        $('#sidebar').toggleClass('collapsed');
    });
});

// ==========================================
// HÀM VẼ MINI CALENDAR
// ==========================================
function renderDynamicMiniCalendar(date) {
    const $tbody = $('#mini-calendar-body');
    const $miniTitle = $('#mini-month-title');
    if ($tbody.length === 0) return;

    $tbody.empty();
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Ngày thực tế hệ thống
    const today = new Date();
    // Kiểm tra xem lịch có đang hiển thị đúng tháng/năm hiện tại không
    const isCurrentMonth = (month === today.getMonth() && year === today.getFullYear());

    const monthName = date.toLocaleString('default', { month: 'long' });
    $miniTitle.text(`${monthName} ${year}`);

    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const prevLastDay = new Date(year, month, 0).getDate();

    let days = [];
    // Ngày tháng trước
    for (let x = firstDayIndex; x > 0; x--) {
        days.push({ day: prevLastDay - x + 1, status: 'text-muted' });
    }

    // Ngày trong tháng hiện tại
    for (let i = 1; i <= lastDay; i++) {
        let status = '';
        
        // CHỈ TÔ MÀU NẾU LỊCH ĐANG Ở ĐÚNG THÁNG THỰC TẾ
        if (isCurrentMonth) {
            if (i === today.getDate()) {
                status = 'current-day'; // Xanh đậm cho hôm nay
            } else if (i === date.getDate()) {
                status = 'selected-day'; // Xanh nhạt cho ngày đang chọn
            }
        }
        // Nếu không trùng tháng hiện tại, status để trống -> Ngày trắng trơn
        
        days.push({ day: i, status: status });
    }

    // Ngày tháng sau
    const remaining = 42 - days.length;
    for (let j = 1; j <= remaining; j++) {
        days.push({ day: j, status: 'text-muted' });
    }

    for (let i = 0; i < days.length; i += 7) {
        let $tr = $('<tr></tr>');
        days.slice(i, i + 7).forEach(d => {
            let $td = $(`<td>${d.day}</td>`);
            
            if (d.status === 'text-muted') {
                $td.addClass('text-muted');
                $td.css('cursor', 'default'); 
            } else {
                if (d.status) $td.addClass(d.status);
                
                $td.css('cursor', 'pointer').on('click', function () {
                    currDate = new Date(year, month, d.day);
                    renderDynamicMiniCalendar(currDate);
                    updateMainMonthTitle(currDate);
                    
                    if (typeof loadAppointments === "function") {
                        loadAppointments();
                    }
                });
            }
            $tr.append($td);
        });
        $tbody.append($tr);
    }
}

function updateMainMonthTitle(date) {
    const $mainTitle = $('#main-month-title');
    if ($mainTitle.length) {
        const monthStr = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        $mainTitle.text(monthStr);
    }
}