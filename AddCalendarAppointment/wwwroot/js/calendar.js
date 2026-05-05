$(document).ready(function () {
    // --- KHỞI TẠO BIẾN TOÀN CỤC ---
    let currDate = new Date(); 

    renderDynamicMiniCalendar(currDate);
    updateMainMonthTitle(currDate);
    loadAppointments();

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
        updateMainCalendarGrid(currDate);
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

    const today = new Date();
    const isCurrentMonth = (month === today.getMonth() && year === today.getFullYear());

    const monthName = date.toLocaleString('default', { month: 'long' });
    $miniTitle.text(`${monthName} ${year}`);

    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const prevLastDay = new Date(year, month, 0).getDate();

    let days = [];

    // 1. Lấy ngày tháng trước
    for (let x = firstDayIndex; x > 0; x--) {
        days.push({ day: prevLastDay - x + 1, status: 'text-muted' });
    }

    // 2. Lấy ngày tháng hiện tại
    for (let i = 1; i <= lastDay; i++) {
        let status = '';
        if (isCurrentMonth) {
            if (i === today.getDate()) {
                status = 'current-day';
            } else if (i === date.getDate()) {
                status = 'selected-day';
            }
        }
        days.push({ day: i, status: status });
    }

    // 3. Lấy ngày tháng sau cho đủ 6 hàng (42 ô)
    const remaining = 42 - days.length;
    for (let j = 1; j <= remaining; j++) {
        days.push({ day: j, status: 'text-muted' });
    }

    // 4. Vẽ các hàng (tr) và cột (td) vào bảng
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

// ==========================================
// CÁC HÀM GỌI AJAX (BACKEND GIAO TIẾP)
// ==========================================

function loadAppointments() {
    $.ajax({
        url: '/api/Appointment/GetAppointments',
        type: 'GET',
        success: function (data) {
            console.log("Dữ liệu trả về từ API:", data);
            // Xóa hết các event trên giao diện trước khi render cái mới
            $('.appointment-block').remove();

            data.forEach(function (evt) {
                let dateStr = evt.start.split('T')[0]; // Lấy "YYYY-MM-DD"
                let startDate = new Date(evt.start);
                let endDate = new Date(evt.end);

                // Tính toán vị trí Y (top) trên lưới (1 giờ = 60px, 1 phút = 1px)
                let topPx = (startDate.getHours() * 60) + startDate.getMinutes();
                
                // Tính toán thời lượng để quyết định chiều cao của khối (Height)
                let durationMins = (endDate - startDate) / (1000 * 60); 
                let heightPx = durationMins > 0 ? durationMins : 60; // Mặc định 60px (1 tiếng)

                // Tìm cột ngày tương ứng
                let $column = $(`.day-col[data-date='${dateStr}']`);

                console.log(`Tìm cột ngày ${dateStr}:`, $column.length > 0 ? "Thành công" : "Thất bại");

                if ($column.length > 0) {
                    // Format thời gian hiển thị (ví dụ: 9:00 AM)
                    let timeString = startDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) + 
                                     " - " + 
                                     endDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                    
                    let locString = evt.location ? `<br/>📍 ${evt.location}` : '';

                    // Render block HTML
                    let blockHtml = `
                        <div class="appointment-block p-1 text-white rounded shadow-sm" 
                             data-id="${evt.id}" 
                             draggable="true" 
                             style="position: absolute; top: ${topPx}px; height: ${heightPx}px; width: 95%; z-index: 10; cursor: grab; background-color: #3f51b5; overflow: hidden;">
                            <div class="title" style="font-weight: 600; font-size: 13px; line-height: 1.2;">${evt.title}</div>
                            <div class="time-loc" style="font-size: 11px; line-height: 1.2; margin-top: 2px;">
                                ${timeString}
                                ${locString}
                            </div>
                        </div>
                    `;
                    $column.append(blockHtml);
                }
            });
        },
        error: function (err) {
            console.error("Lỗi khi load appointments từ database:", err);
        }
    });
}
function updateAppointmentTime(id, date, hour, min, callback) {
    // Logic tính toán DateTime sẽ gửi xuống API
    let newStartTime = `${date}T${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:00`;

    $.ajax({
        url: `/api/appointment/edit-recurring/${id}?type=ThisEvent`,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ StartTime: newStartTime }),
        success: function (res) {
            callback(true);
        },
        error: function (err) {
            console.error(err);
            callback(false);
        }
    });
}

function duplicateAppointment(originalId, targetTime, callback) {
    let newStartTime = `${targetTime.date}T${targetTime.hour.toString().padStart(2, '0')}:${targetTime.minute.toString().padStart(2, '0')}:00`;

    // Gọi lên Controller để xử lý logic Duplicate
    $.ajax({
        url: `/api/appointment/duplicate`, // API giả định
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ originalId: originalId, newStartTime: newStartTime }),
        success: function (res) {
            callback(res.newId); // Trả về ID của sự kiện vừa tạo
        },
        error: function () {
            alert('Lỗi duplicate sự kiện');
            callback(null);
        }
    });
}

function openDetailsModal(id) {
    // 1. Fetch dữ liệu chi tiết từ server
    // $.get(`/api/appointment/${id}`, function(data) { ... });

    // 2. Điền data vào Modal
    $('#detailModal').data('current-id', id);
    $('#detailModalTitle').val('Data từ API...');

    // 3. Mở Bootstrap modal
    let myModal = new bootstrap.Modal(document.getElementById('detailModal'));
    myModal.show();

}

function updateMainMonthTitle(date) {
    const $mainTitle = $('#main-month-title');
    if ($mainTitle.length) {
        const monthStr = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        $mainTitle.text(monthStr);
    }
}

function updateMainCalendarGrid(date) {
    let startOfWeek = new Date(date);
    let day = startOfWeek.getDay(); // Lấy thứ trong tuần (0: CN, 6: T7)
    startOfWeek.setDate(startOfWeek.getDate() - day); // Đưa về ngày Chủ Nhật đầu tuần

    // Duyệt qua từng cột ngày để update lại thuộc tính data-date
    $('.day-col').each(function (index) {
        let currentDay = new Date(startOfWeek);
        currentDay.setDate(startOfWeek.getDate() + index);

        // Format ngày chuẩn yyyy-MM-dd
        let yyyy = currentDay.getFullYear();
        let mm = String(currentDay.getMonth() + 1).padStart(2, '0');
        let dd = String(currentDay.getDate()).padStart(2, '0');
        let dateStr = `${yyyy}-${mm}-${dd}`;

        // Cập nhật lại data-date cho khung lưới
        $(this).attr('data-date', dateStr);

        // Cập nhật lại con số trên Header (hiển thị mùng mấy)
        let $header = $('.day-header').eq(index);
        $header.find('.day-num').text(currentDay.getDate());

        // Highlight ngày hiện tại
        if (currentDay.toDateString() === new Date().toDateString()) {
            $header.addClass('active');
        } else {
            $header.removeClass('active');
        }
    });
}