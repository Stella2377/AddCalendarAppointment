let currDate = new Date();
let currentViewMode = 7; // Mặc định là 7 ngày (Week)
$(document).ready(function () {
    syncAllCalendars();

    // ==========================================
    // SỰ KIỆN ĐIỀU HƯỚNG
    // ==========================================

    // Sửa lại selector cho Mini Calendar để khớp với ID trong file cshtml
    $('#mini-prev').on('click', function () {
        currDate.setMonth(currDate.getMonth() - 1);
        syncAllCalendars(); // Cập nhật toàn bộ để lịch chính đi theo
    });

    $('#mini-next').on('click', function () {
        currDate.setMonth(currDate.getMonth() + 1);
        syncAllCalendars(); // Cập nhật toàn bộ để lịch chính đi theo
    });

    $('#btn-today').on('click', function () {
        currDate = new Date();
        syncAllCalendars();
    });

    $('#main-prev').off('click').on('click', function (e) {
        e.preventDefault();
        const view = $('#viewSelector').val();
        currentViewMode = parseInt(view);

        if (view === "7") currDate.setDate(currDate.getDate() - 7);
        else if (view === "1") currDate.setDate(currDate.getDate() - 1);
        else if (view === "30") currDate.setMonth(currDate.getMonth() - 1);
        else currDate.setDate(currDate.getDate() - currentViewMode);

        syncAllCalendars();
    });

    // Xử lý nút TIẾP THEO (Main Next)
    $('#main-next').off('click').on('click', function (e) {
        e.preventDefault();
        const view = $('#viewSelector').val();
        currentViewMode = parseInt(view);

        if (view === "7") currDate.setDate(currDate.getDate() + 7);
        else if (view === "1") currDate.setDate(currDate.getDate() + 1);
        else if (view === "30") currDate.setMonth(currDate.getMonth() + 1);
        else currDate.setDate(currDate.getDate() + currentViewMode);

        syncAllCalendars();
    });

    // Sự kiện đổi chế độ View (Day, Week...)
    $('#viewSelector').on('change', function () {
        currentViewMode = parseInt($(this).val());
        // Cập nhật CSS Variable để chia cột
        document.documentElement.style.setProperty('--col-count', currentViewMode);
        syncAllCalendars();
    });

    // Hàm đồng bộ tất cả các thành phần lịch
    function syncAllCalendars() {
        renderDynamicMiniCalendar(currDate);
        updateMainMonthTitle(currDate);
        renderMainCalendar(); // Vẽ lại lưới lịch chính
    }

    $('#btnToggleSidebar').on('click', function () {
        $('#sidebar').toggleClass('collapsed');
    });
});

// ==========================================
// HÀM VẼ LƯỚI LỊCH CHÍNH (MAIN CALENDAR) - MỚI BỔ SUNG
// ==========================================
function renderMainCalendar() {
    const $headerGrid = $('.calendar-header-grid');
    const $calendarGrid = $('.calendar-grid');
    const viewMode = parseInt($('#viewSelector').val() || 7);

    // Xóa các cột cũ (Giữ lại cột GMT/Time-col)
    $headerGrid.find('.day-header').remove();
    $calendarGrid.find('.day-col').remove();

    // Tính toán ngày bắt đầu hiển thị
    let startDate = new Date(currDate);
    if (viewMode === 7) {
        // Nếu là tuần, đưa về ngày Thứ 2 (hoặc Chủ nhật tùy bạn, ở đây là Thứ 2)
        let day = startDate.getDay();
        let diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
        startDate.setDate(diff);
    }

    for (let i = 0; i < viewMode; i++) {
        let d = new Date(startDate);
        d.setDate(startDate.getDate() + i);

        let dateStr = d.toISOString().split('T')[0];
        let isToday = new Date().toDateString() === d.toDateString();
        let activeClass = isToday ? 'active' : '';

        // 1. Vẽ Header (THỨ + NGÀY)
        $headerGrid.append(`
            <div class="day-header ${activeClass}">
                <div class="day-name">${d.toLocaleString('en-US', { weekday: 'short' }).toUpperCase()}</div>
                <div class="day-num">${d.getDate()}</div>
            </div>
        `);

        // 2. Vẽ Cột ngày nội dung
        $calendarGrid.append(`<div class="day-col" data-date="${dateStr}"></div>`);
    }

    // Sau khi vẽ khung xong, load dữ liệu sự kiện vào
    if (typeof loadAppointments === "function") {
        loadAppointments();
    }
}

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
        if (year === today.getFullYear() && month === today.getMonth() && i === today.getDate()) {
            status = 'current-day';
        } else if (i === date.getDate() && month === date.getMonth() && year === date.getFullYear()) {
            status = 'selected-day';
        }
        days.push({ day: i, status: status });
    }

    // 3. Lấy ngày tháng sau
    const remaining = 42 - days.length;
    for (let j = 1; j <= remaining; j++) {
        days.push({ day: j, status: 'text-muted' });
    }

    // 4. Vẽ bảng
    for (let i = 0; i < days.length; i += 7) {
        let $tr = $('<tr></tr>');
        days.slice(i, i + 7).forEach(d => {
            let $td = $(`<td>${d.day}</td>`);
            if (d.status === 'text-muted') {
                $td.addClass('text-muted');
            } else {
                if (d.status) $td.addClass(d.status);
                $td.css('cursor', 'pointer').on('click', function () {
                    // Khi click vào ngày ở Mini Calendar
                    currDate = new Date(year, month, d.day);
                    // Cập nhật lại toàn bộ
                    const view = $('#viewSelector').val();
                    document.documentElement.style.setProperty('--col-count', view);
                    renderDynamicMiniCalendar(currDate);
                    updateMainMonthTitle(currDate);
                    renderMainCalendar();
                });
            }
            $tr.append($td);
        });
        $tbody.append($tr);
    }
}

// ==========================================
// CÁC HÀM GỌI AJAX & UTILS
// ==========================================

function loadAppointments() {
    $.ajax({
        url: '/api/Appointment/GetAppointments',
        type: 'GET',
        success: function (data) {
            $('.appointment-block').remove();

            data.forEach(function (evt) {
                let dateStr = evt.start.split('T')[0];
                let startDate = new Date(evt.start);
                let endDate = new Date(evt.end);

                let topPx = (startDate.getHours() * 60) + startDate.getMinutes();
                let durationMins = (endDate - startDate) / (1000 * 60);
                let heightPx = durationMins > 0 ? durationMins : 60;

                let $column = $(`.day-col[data-date='${dateStr}']`);

                if ($column.length > 0) {
                    let timeString = startDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) +
                        " - " +
                        endDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

                    let locString = evt.location ? `<br/>📍 ${evt.location}` : '';

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
            console.error("Lỗi khi load appointments:", err);
        }
    });
}

function updateMainMonthTitle(date) {
    const $mainTitle = $('#main-month-title');
    if ($mainTitle.length) {
        const monthStr = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        $mainTitle.text(monthStr);
    }
}


// ==========================================
// KÉO THẢ VÀ HIỂN THỊ POPOVER TẠO CUỘC HẸN
// ==========================================

let isCreating = false;
let startY = 0;
let $dragCol = null;
let $ghostEvent = null;

$(document).ready(function () {
    $(document).on('mousedown', '.day-col', function (e) {
        if ($(e.target).closest('.appointment-block').length > 0) return;
        $('#event-popover').hide();

        isCreating = true;
        $dragCol = $(this);
        startY = e.pageY - $dragCol.offset().top;

        $ghostEvent = $('<div class="appointment-ghost"></div>').css({
            position: 'absolute', top: startY + 'px', left: '0', width: '95%', height: '0px',
            backgroundColor: 'rgba(3, 155, 229, 0.4)', border: '1px solid #039be5', zIndex: 5, borderRadius: '4px'
        });
        $dragCol.append($ghostEvent);
    });

    $(document).on('mousemove', function (e) {
        if (!isCreating || !$ghostEvent) return;
        let currentY = e.pageY - $dragCol.offset().top;
        let top = Math.min(startY, currentY);
        let height = Math.abs(currentY - startY);
        $ghostEvent.css({ top: top + 'px', height: height + 'px' });
    });

    $(document).on('mouseup', function (e) {
        if (!isCreating) return;
        isCreating = false;

        let finalTop = parseFloat($ghostEvent.css('top'));
        let finalHeight = parseFloat($ghostEvent.css('height'));
        if (finalHeight < 15) finalHeight = 30; // Mặc định 30 phút

        let dateStr = $dragCol.data('date');

        let startHour = Math.floor(finalTop / 60);
        let startMin = Math.floor(finalTop % 60);
        let endTop = finalTop + finalHeight;
        let endHour = Math.floor(endTop / 60);
        let endMin = Math.floor(endTop % 60);

        // Đổ dữ liệu tính toán được vào Form của Popover
        $('#popover-title').val('');
        $('#popover-location').val('');
        $('#popover-description').val('');
        $('#popover-guests').val('');
        $('#popover-color').val('#039be5'); // Xanh mặc định

        $('#popover-start-date').val(dateStr);
        $('#popover-start-time').val(`${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`);
        $('#popover-end-time').val(`${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`);

        // Tính vị trí Popover
        let rect = $ghostEvent[0].getBoundingClientRect();
        let popoverLeft = rect.right + 10;
        if (popoverLeft + 420 > window.innerWidth) popoverLeft = rect.left - 430;

        $('#event-popover').css({ top: rect.top + window.scrollY + 'px', left: popoverLeft + 'px' }).show();
        $('#popover-title').focus();
    });

    // Tắt popover
    $('#btn-close-popover').on('click', function () {
        $('#event-popover').hide();
        if ($ghostEvent) $ghostEvent.remove();
    });

    // LƯU SỰ KIỆN XUỐNG DB
    $('#btn-save-event').off('click').on('click', function () {
        let title = $('#popover-title').val();
        if (!title || title.trim() === "") {
            alert("Vui lòng nhập tiêu đề!");
            return;
        }

        // Lấy lại thời gian từ ô input (người dùng có thể đã sửa đổi)
        let startDateVal = $('#popover-start-date').val();
        let startTimeVal = $('#popover-start-time').val();
        let endTimeVal = $('#popover-end-time').val();

        // Gắn lại thành Date object hoàn chỉnh
        let finalStart = new Date(`${startDateVal}T${startTimeVal}:00`);
        let finalEnd = new Date(`${startDateVal}T${endTimeVal}:00`);

        let appointmentData = {
            Title: title,
            StartTime: toLocalISOString(finalStart),
            EndTime: toLocalISOString(finalEnd),
            Location: $('#popover-location').val(),
            Description: $('#popover-description').val(),
            ColorCategory: $('#popover-color').val(),
            Visibility: parseInt($('#popover-visibility').val() || "0"),
            IsRecurring: false,
            RecurringRule: 0
            // Nếu có chức năng gửi Email cho Guests thì xử lý mảng Guests ở đây
        };

        $('#btn-save-event').prop('disabled', true).text('Đang lưu...');

        $.ajax({
            url: '/api/Appointment/create',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(appointmentData),
            success: function (res) {
                $('#event-popover').hide();
                if ($ghostEvent) $ghostEvent.remove();

                if (res.success) {
                    loadAppointments(); // Cập nhật lại lịch
                }
            },
            error: function (err) {
                console.error("Lỗi từ server:", err.responseText);
                alert("Lưu thất bại! Bạn F12 xem tab Network hoặc Console nhé.");
            },
            complete: function () {
                $('#btn-save-event').prop('disabled', false).text('Save');
            }
        });
    });
});

function toLocalISOString(date) {
    const pad = n => n < 10 ? '0' + n : n;
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + 'T' +
        pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
}