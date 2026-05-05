let currDate = new Date();
let currentViewMode = 7; // Mặc định là 7 ngày (Week)

// ==========================================
// QUẢN LÝ BẢNG MÀU VÀ SIDEBAR (MY CALENDARS)
// ==========================================

// 1. Mảng 11 màu cố định theo yêu cầu
const CALENDAR_COLORS = [
    { hex: '#d50000', defaultName: 'Red' },
    { hex: '#e67c73', defaultName: 'Light Red' },
    { hex: '#f4511e', defaultName: 'Orange' },
    { hex: '#f6bf26', defaultName: 'Yellow' },
    { hex: '#33b679', defaultName: 'Light Green' },
    { hex: '#0b8043', defaultName: 'Green' },
    { hex: '#039be5', defaultName: 'Blue' },       // Màu mặc định
    { hex: '#3f51b5', defaultName: 'Indigo' },
    { hex: '#7986cb', defaultName: 'Light Purple' },
    { hex: '#8e24aa', defaultName: 'Purple' },
    { hex: '#616161', defaultName: 'Grey' }
];

// 2. Lấy dữ liệu tên lịch từ LocalStorage
function getCalendarCategories() {
    let savedNames = JSON.parse(localStorage.getItem('customCalendarNames')) || {};
    return CALENDAR_COLORS.map(c => ({
        hex: c.hex,
        displayName: savedNames[c.hex] ? savedNames[c.hex] : `(${c.defaultName})`,
        isDefault: !savedNames[c.hex]
    }));
}

// 3. Render danh sách ra Sidebar
function renderSidebarCalendars() {
    let categories = getCalendarCategories();
    let html = '';

    categories.forEach(cat => {
        html += `
            <div class="form-check d-flex align-items-center mb-2">
                <!-- THÊM CLASS calendar-color-filter VÀO ĐÂY -->
                <input class="form-check-input me-2 shadow-none calendar-color-filter" type="checkbox" value="${cat.hex}" checked 
                       style="background-color: ${cat.hex}; border-color: ${cat.hex}; cursor: pointer; border-radius: 3px;">
                <span class="editable-category" data-color="${cat.hex}" style="font-size: 13px; cursor: text; flex-grow: 1; padding: 2px 4px; border-radius: 4px;">
                    ${cat.displayName}
                </span>
            </div>
        `;
    });

    $('#my-calendars-list').html(html);
}

// 4. Xử lý sự kiện click để đổi tên Lịch ở Sidebar
$(document).on('click', '.editable-category', function () {
    let $el = $(this);
    if ($el.find('input').length > 0) return; // Đang ở chế độ sửa thì bỏ qua

    let currentColor = $el.data('color');
    let currentText = $el.text().trim();

    // Nếu đang là tên mặc định (có dấu ngoặc đơn), xóa đi để người dùng gõ mới
    if (currentText.startsWith('(') && currentText.endsWith(')')) {
        currentText = '';
    }

    // Biến text thành ô input
    let $input = $(`<input type="text" class="form-control form-control-sm p-0 px-1" value="${currentText}" style="height: 22px; font-size: 13px;">`);
    $el.html($input);
    $input.focus();

    // Lưu lại khi người dùng bấm Enter hoặc click chuột ra ngoài
    $input.on('blur keypress', function (e) {
        if (e.type === 'keypress' && e.which !== 13) return; // Chỉ nhận phím Enter

        let newText = $(this).val().trim();
        let savedNames = JSON.parse(localStorage.getItem('customCalendarNames')) || {};

        if (newText) {
            savedNames[currentColor] = newText;
        } else {
            delete savedNames[currentColor]; // Nếu để trống thì quay về mặc định
        }

        localStorage.setItem('customCalendarNames', JSON.stringify(savedNames));
        renderSidebarCalendars(); // Vẽ lại sidebar
    });
});

// Chạy hàm render khi web vừa load xong
$(document).ready(function () {
    renderSidebarCalendars();
});

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

                    // Mã hóa mảng guests để nhét vào HTML an toàn
                    let guestsJson = evt.guests ? encodeURIComponent(JSON.stringify(evt.guests)) : '%5B%5D';
                    let descStr = evt.description ? evt.description.replace(/"/g, '&quot;') : '';
                    let locHtmlStr = evt.location ? evt.location.replace(/"/g, '&quot;') : '';
                    let notifStr = evt.notification || '30 minutes before';

                    let blockHtml = `
                        <div class="appointment-block p-1 text-white rounded shadow-sm" 
                             data-id="${evt.id}" 
                             data-title="${evt.title || '(No title)'}"
                             data-notification="${evt.notification || '30 minutes before'}"
                             data-start="${evt.start}"
                             data-end="${evt.end}"
                             data-color="${evt.color}"
                             data-location="${locHtmlStr}"
                             data-description="${descStr}"
                             data-guests="${guestsJson}"
                             draggable="true" 
                             style="position: absolute; top: ${topPx}px; height: ${heightPx}px; width: 95%; z-index: 10; background-color: ${evt.color}; overflow: hidden;">
                            <div class="title" style="font-weight: 600; font-size: 13px; line-height: 1.2;">${evt.title || '(No title)'}</div>
                            <div class="time-loc" style="font-size: 11px; line-height: 1.2; margin-top: 2px;">
                                ${timeString} ${locString}
                            </div>
                            <div class="resize-handle"></div>
                        </div>
                    `;
                    $column.append(blockHtml);
                }
            });
            applyColorFilter(); 
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
// LOGIC DI CHUYỂN CUỘC HẸN (MOVE DRAG & DROP)
// ==========================================
let draggedEventId = null;
let eventDurationMins = 0;
let dragOffsetY = 0; 
let $dragShadow = null; // Biến lưu khối bóng (shadow) do chúng ta tự tạo

$(document).on('dragstart', '.appointment-block', function (e) {
    if ($(e.originalEvent.target).hasClass('resize-handle')) {
        e.preventDefault();
        return;
    }

    draggedEventId = $(this).data('id');
    eventDurationMins = $(this).outerHeight(); 

    let rect = this.getBoundingClientRect();
    dragOffsetY = e.originalEvent.clientY - rect.top;

    // 1. Thủ thuật: Ẩn ảnh ghost mặc định của trình duyệt (cái ảnh tĩnh bị đơ) bằng 1 pixel trong suốt
    let emptyImg = new Image();
    emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.originalEvent.dataTransfer.setDragImage(emptyImg, 0, 0);

    // 2. Tạo một khối bóng (shadow) giống hệt để tự do điều khiển nhảy 15p
    $dragShadow = $(this).clone()
        .removeClass('opacity-50')
        .css({
            opacity: 0.9,
            pointerEvents: 'none', // Rất quan trọng: Bỏ qua click/hover để chuột có thể chạm xuống cột ngày bên dưới
            zIndex: 999,
            boxShadow: '0 8px 16px rgba(0,0,0,0.3)' // Thêm đổ bóng cho đẹp
        })
        .removeAttr('draggable data-id'); // Xóa thuộc tính thừa để tránh lỗi xung đột

    $(this).addClass('opacity-50'); // Làm mờ khối gốc đang nằm im
    e.originalEvent.dataTransfer.setData("text/plain", draggedEventId);
});

// Xóa khối shadow nếu drag bị hủy giữa chừng
$(document).on('dragend', '.appointment-block', function () {
    $(this).removeClass('opacity-50');
    if ($dragShadow) {
        $dragShadow.remove();
        $dragShadow = null;
    }
});

// Bắt sự kiện khi rê chuột qua các cột ngày
$(document).on('dragover', '.day-col', function (e) {
    e.preventDefault(); 
    
    if ($dragShadow && draggedEventId) {
        // Nếu chuột di chuyển sang cột ngày khác -> Dời shadow sang cột đó
        if ($dragShadow.parent()[0] !== this) {
            $(this).append($dragShadow);
        }

        let dropY = e.originalEvent.pageY - $(this).offset().top;
        let rawTopPx = dropY - dragOffsetY;
        
        // Ép mốc nhảy 15 phút
        let newTopPx = Math.max(0, Math.round(rawTopPx / 15) * 15);
        
        // Cập nhật vị trí bóng
        $dragShadow.css('top', newTopPx + 'px');
        
        // Tính và cập nhật text thời gian trực tiếp trên bóng
        let timeStr = formatTimeFromPixels(newTopPx, eventDurationMins);
        // Lấy lại địa điểm để không bị mất khi kéo
        let locRaw = $dragShadow.attr('data-location');
        let locHtml = locRaw ? `<br/>📍 ${locRaw}` : '';

        $dragShadow.find('.time-loc').html(timeStr + locHtml);
    }
});

$(document).on('drop', '.day-col', function (e) {
    e.preventDefault();

    if (!draggedEventId) return;

    let $col = $(this);
    let newDateStr = $col.data('date');

    let dropY = e.originalEvent.pageY - $col.offset().top;
    let rawTopPx = dropY - dragOffsetY;

    // Tính lại một lần nữa khi chính thức thả xuống
    let newTopPx = Math.max(0, Math.round(rawTopPx / 15) * 15);

    let startHour = Math.floor(newTopPx / 60);
    let startMin = Math.floor(newTopPx % 60);

    let endTopPx = newTopPx + eventDurationMins;
    let endHour = Math.floor(endTopPx / 60);
    let endMin = Math.floor(endTopPx % 60);

    let startTime = `${newDateStr}T${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}:00`;
    let endTime = `${newDateStr}T${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}:00`;

    $.ajax({
        url: '/api/Appointment/update-time',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            Id: draggedEventId,
            StartTime: startTime,
            EndTime: endTime
        }),
        success: function (res) {
            if (res.success) loadAppointments(); 
        },
        error: function () {
            alert("Lỗi kết nối server khi di chuyển lịch!");
            loadAppointments(); 
        }
    });

    // Dọn dẹp bóng
    if ($dragShadow) {
        $dragShadow.remove();
        $dragShadow = null;
    }
    draggedEventId = null; 
});

// Hàm gọi API cập nhật thời gian
function updateAppointmentMove(id, startTime, endTime) {
    $.ajax({
        url: '/api/Appointment/update-time', // Bạn cần tạo thêm Action này ở Controller
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            Id: id,
            StartTime: startTime,
            EndTime: endTime
        }),
        success: function (res) {
            if (res.success) {
                loadAppointments(); // Vẽ lại các cuộc hẹn sau khi cập nhật thành công
            } else {
                alert("Không thể cập nhật: " + res.message);
            }
        },
        error: function () {
            alert("Lỗi kết nối server!");
        }
    });
}

// ==========================================
// KÉO THẢ VÀ HIỂN THỊ POPOVER TẠO CUỘC HẸN
// ==========================================

let isCreating = false;
let startY = 0;
let $dragCol = null;
let $ghostEvent = null;

let isResizing = false;
let $resizeBlock = null;
let startResizeY = 0;
let startHeight = 0;

$(document).ready(function () {
    // 1. TẠO KHỐI XANH KHI KÉO THẢ (VÀ CLICK)
    $(document).on('mousedown', '.day-col', function (e) {
        if ($(e.target).closest('.appointment-block').length > 0) return;
        if ($(e.target).closest('#event-popover').length > 0) return;

        $('#event-popover').hide();
        if ($ghostEvent) { $ghostEvent.remove(); $ghostEvent = null; }

        isCreating = true;
        $dragCol = $(this);

        let rawStartY = e.pageY - $dragCol.offset().top;
        // Bắt đầu ép tròn giờ về 15 phút (vd: 12:12 thành 12:00, 12:16 thành 12:15)
        startY = Math.floor(rawStartY / 15) * 15;

        $ghostEvent = $('<div class="appointment-ghost"></div>').css({
            position: 'absolute', top: startY + 'px', left: '0', width: '95%', height: '30px',
            backgroundColor: 'rgba(3, 155, 229, 0.8)', border: '1px solid #039be5', zIndex: 5, borderRadius: '4px',
            padding: '4px', fontSize: '11px', color: '#fff', fontWeight: 'bold', overflow: 'hidden'
        });

        // Mặc định hiện luôn thời gian 30 phút
        $ghostEvent.html(formatTimeFromPixels(startY, 30));
        $dragCol.append($ghostEvent);
    });

    $(document).on('mousemove', function (e) {
        if (!isCreating || !$ghostEvent) return;

        let rawCurrentY = e.pageY - $dragCol.offset().top;
        // Ép nhảy 15 phút khi kéo chuột
        let currentY = Math.round(rawCurrentY / 15) * 15;

        let newTop = Math.min(startY, currentY);
        let newHeight = Math.abs(currentY - startY);

        if (newHeight < 15) newHeight = 15; // Tối thiểu kéo được 15p

        $ghostEvent.css({ top: newTop + 'px', height: newHeight + 'px' });
        // Cập nhật text thời gian đang kéo
        $ghostEvent.html(formatTimeFromPixels(newTop, newHeight));
    });

    $(document).on('mouseup', function (e) {
        if (!isCreating || !$ghostEvent) return;
        isCreating = false;

        let finalTop = parseFloat($ghostEvent.css('top'));
        let finalHeight = parseFloat($ghostEvent.css('height'));

        // NẾU CHỈ CLICK MÀ KHÔNG KÉO CHUỘT (hoặc kéo quá ngắn) -> MẶC ĐỊNH TẠO KHỐI 30 PHÚT
        if (finalHeight <= 15 && Math.abs(e.pageY - $dragCol.offset().top - startY) < 10) {
            finalHeight = 30;
            $ghostEvent.css('height', '30px');
            $ghostEvent.html(formatTimeFromPixels(finalTop, finalHeight));
        }

        let dateStr = $dragCol.data('date');
        let startHour = Math.floor(finalTop / 60), startMin = Math.floor(finalTop % 60);
        let endTop = finalTop + finalHeight;
        let endHour = Math.floor(endTop / 60), endMin = Math.floor(endTop % 60);

        $('#popover-title').val('');
        $('#popover-location').val('');
        $('#popover-description').val('');
        $('#popover-guests').val('');

        // color
        let categories = getCalendarCategories();
        let dropdownOptions = categories.map(c => {
            // Thêm icon cục màu tròn nhỏ bằng ký tự Unicode để dễ nhận diện
            return `<option value="${c.hex}" style="color: ${c.hex}; font-weight: bold;">
                &#9679; &nbsp; ${c.displayName}
            </option>`;
        }).join('');

        let $colorSelect = $('#popover-color-select');
        $colorSelect.html(dropdownOptions);
        $colorSelect.val('#039be5'); // Mặc định chọn màu Blue (#039be5)

        // Đổi màu font chữ của select cho khớp với màu đang chọn
        $colorSelect.css('color', '#039be5');
        $colorSelect.off('change').on('change', function () {
            $(this).css('color', $(this).val());
        });

        $('#popover-start-date').val(dateStr);
        $('#popover-start-time').val(`${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`);
        $('#popover-end-time').val(`${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`);

        // --- CĂN CHỈNH TỌA ĐỘ VÀ SQUISH POPOVER (Phần này giữ nguyên của bạn) ---
        let rect = $ghostEvent[0].getBoundingClientRect();
        let popoverLeft = rect.right + 10;
        if (popoverLeft + 440 > window.innerWidth) popoverLeft = rect.left - 450;

        let popoverTop = rect.top + window.scrollY;
        let windowBottom = window.scrollY + window.innerHeight;

        let availableHeight = windowBottom - popoverTop - 20;
        let maxBodyHeight = availableHeight - 120;

        if (maxBodyHeight < 100) {
            maxBodyHeight = 100;
            popoverTop = windowBottom - 120 - 100 - 20;
        }

        $('.popover-body-scroll').css('max-height', maxBodyHeight + 'px');
        $('#event-popover').css({ top: popoverTop + 'px', left: popoverLeft + 'px' }).show();
        $('#popover-title').focus();
    });

    // 2. CLICK RA NGOÀI ĐỂ TẮT FORM VÀ XÓA KHỐI XANH
    $(document).on('mousedown', function (e) {
        if (!$(e.target).closest('#event-popover').length && !$(e.target).closest('.day-col').length && !$(e.target).hasClass('btn-remove-guest')) {
            $('#event-popover').hide();
            $('.appointment-ghost').remove();
            $ghostEvent = null;
        }
        if (!$(e.target).closest('#event-detail-popover').length && !$(e.target).closest('.appointment-block').length) {
            if ($('#event-detail-popover').is(':visible')) {
                $('#event-detail-popover').hide();
                $('.calendar-body-scroll').css('overflow', 'auto');
            }
        }
    });

    $('#btn-close-popover').on('click', function () {
        $('#event-popover').hide();
        $('.appointment-ghost').remove();
        $ghostEvent = null;
    });

    // ==========================================
    // RESIZE (KÉO DÀI) VÀ XEM CHI TIẾT SỰ KIỆN
    // ==========================================

    // A. Kéo dài sự kiện
    $(document).on('mousedown', '.resize-handle', function (e) {
        e.stopPropagation();
        e.preventDefault(); // THÊM: Chặn sự kiện mặc định để không kích hoạt drag HTML5
        isResizing = true;
        $resizeBlock = $(this).closest('.appointment-block');
        $resizeBlock.attr('draggable', 'false');
        startResizeY = e.pageY;
        startHeight = parseFloat($resizeBlock.css('height'));
        $('body').css('cursor', 'ns-resize');
    });

    $(document).on('mousemove', function (e) {
        if (isResizing && $resizeBlock) {
            let diffY = e.pageY - startResizeY;
            let rawHeight = startHeight + diffY;

            // Ép mốc nhảy 15 phút (tối thiểu 15p)
            let newHeight = Math.max(15, Math.round(rawHeight / 15) * 15);
            $resizeBlock.css('height', newHeight + 'px');

            let topPx = parseFloat($resizeBlock.css('top'));
            let timeStr = formatTimeFromPixels(topPx, newHeight);

            // Lấy lại địa điểm để không bị mất khi kéo giãn
            let locRaw = $resizeBlock.attr('data-location');
            let locHtml = locRaw ? `<br/>📍 ${locRaw}` : '';

            // Tìm thẻ chứa text thời gian và ghi đè nội dung
            $resizeBlock.find('.time-loc').html(timeStr + locHtml);
        }
    });

    $(document).on('mouseup', function (e) {
        if (isResizing && $resizeBlock) {
            isResizing = false;
            $('body').css('cursor', '');

            $resizeBlock.attr('draggable', 'true');
            let finalHeight = parseFloat($resizeBlock.css('height'));
            let topPx = parseFloat($resizeBlock.css('top'));
            let dateStr = $resizeBlock.closest('.day-col').data('date');

            // Tính toán lại giờ
            let startHour = Math.floor(topPx / 60), startMin = Math.floor(topPx % 60);
            let endTop = topPx + finalHeight;
            let endHour = Math.floor(endTop / 60), endMin = Math.floor(endTop % 60);

            let finalStart = new Date(`${dateStr}T${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}:00`);
            let finalEnd = new Date(`${dateStr}T${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}:00`);

            // Gọi API Update thời gian
            $.ajax({
                url: '/api/Appointment/update-time', type: 'POST', contentType: 'application/json',
                data: JSON.stringify({ Id: $resizeBlock.data('id'), StartTime: toLocalISOString(finalStart), EndTime: toLocalISOString(finalEnd) }),
                success: function () { loadAppointments(); }
            });
            $resizeBlock = null;
        }
    });

    // B. Click để xem chi tiết
    $(document).on('click', '.appointment-block', function (e) {
        if ($(e.target).hasClass('resize-handle')) return;

        $('#event-popover').hide();

        let block = $(this);
        let title = block.attr('data-title') || "(No title)";
        let startStr = block.attr('data-start');
        let endStr = block.attr('data-end');
        let color = block.attr('data-color') || '#039be5';
        let id = block.attr('data-id');
        let location = block.attr('data-location');
        let description = block.attr('data-description');
        let notification = block.attr('data-notification') || "30 minutes before";

        // Giải mã JSON danh sách khách mời
        let guestsRaw = block.attr('data-guests');
        let guests = JSON.parse(decodeURIComponent(guestsRaw || '%5B%5D'));

        if (!startStr || !endStr) return;

        let start = new Date(startStr);
        let end = new Date(endStr);
        let dateOptions = { weekday: 'long', month: 'long', day: 'numeric' };
        let timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
        let timeStr = `${start.toLocaleDateString('en-US', dateOptions)} • ${start.toLocaleTimeString('en-US', timeOptions)} - ${end.toLocaleTimeString('en-US', timeOptions)}`;

        $('#detail-title').text(title);
        $('#detail-time').text(timeStr);
        $('#detail-color-dot').css('background-color', color);
        $('#btn-delete-event').data('id', id);
        $('#detail-notification').text(notification);

        // --- XỬ LÝ ẨN/HIỆN CÁC TRƯỜNG DỮ LIỆU ---

        // 1. Location
        if (location && location.trim() !== "") {
            $('#detail-location-row').removeClass('d-none').addClass('d-flex');
            $('#detail-location').text(location);
        } else {
            $('#detail-location-row').removeClass('d-flex').addClass('d-none');
        }

        // 2. Description
        if (description && description.trim() !== "") {
            $('#detail-description-row').removeClass('d-none').addClass('d-flex');
            $('#detail-description').text(description);
        } else {
            $('#detail-description-row').removeClass('d-flex').addClass('d-none');
        }

        // 3. Guests
        if (guests && guests.length > 0) {
            $('#detail-guests-row').removeClass('d-none').addClass('d-flex');
            $('#detail-guest-count').text(`${guests.length} guest${guests.length > 1 ? 's' : ''}`);

            let guestHtml = '';
            guests.forEach(email => {
                // Tạo một cái Avatar ảo từ chữ cái đầu của email
                let firstLetter = email.charAt(0).toUpperCase();
                guestHtml += `<div class="d-flex align-items-center mb-2"><div style="width: 28px; height: 28px; border-radius: 50%; background-color: #e8eaed; color: #5f6368; display: flex; justify-content: center; align-items: center; font-size: 12px; font-weight: bold; margin-right: 10px;">${firstLetter}</div><div style="font-size: 14px; color: #3c4043; word-break: break-all;">${email}</div></div>`;
            });
            $('#detail-guest-list').html(guestHtml);
        } else {
            $('#detail-guests-row').removeClass('d-flex').addClass('d-none');
        }

        // Ánh xạ Tên lịch
        // Lấy danh sách tên lịch hiện tại từ Sidebar (bao gồm cả tên bạn đã đổi)
        let categories = getCalendarCategories();

        // Tìm kiếm xem màu của sự kiện này tương ứng với Tên lịch nào
        let matchedCategory = categories.find(c => c.hex.toLowerCase() === (color || '').toLowerCase());

        // Nếu tìm thấy thì lấy tên đó, nếu không thì để mặc định
        let calendarName = matchedCategory ? matchedCategory.displayName : "Sự kiện cá nhân";

        // Gán tên vừa tìm được vào popover
        $('#detail-calendar-name').text(calendarName);

        // --- LOGIC TÍNH TỌA ĐỘ VÀ CHỐNG TRÀN MÀN HÌNH ---
        let $detailPopover = $('#event-detail-popover');
        $detailPopover.show(); // Hiện ra trước để lấy kích thước thật

        let rect = this.getBoundingClientRect();
        let popWidth = $detailPopover.outerWidth();
        let popHeight = $detailPopover.outerHeight();

        // 1. Căn trục X (Trái / Phải)
        let popLeft = rect.right + 10;
        if (popLeft + popWidth > window.innerWidth) popLeft = rect.left - popWidth - 10;

        // 2. Căn trục Y (Chống tràn đáy màn hình)
        let popTop = rect.top + window.scrollY;
        let windowBottom = window.scrollY + window.innerHeight;

        // Nếu mép dưới của popover lọt thỏm qua đáy màn hình -> Đẩy ngược lên trên
        if (popTop + popHeight > windowBottom - 15) {
            popTop = windowBottom - popHeight - 15; // 15px là khoảng cách an toàn so với mép dưới
        }

        // Nếu đẩy lên mà bị tràn qua thanh Header ở trên cùng -> Chặn lại
        if (popTop < window.scrollY + 10) {
            popTop = window.scrollY + 10;
        }

        // Áp dụng tọa độ an toàn vào Form
        $detailPopover.css({ top: popTop + 'px', left: popLeft + 'px' });

        // Khóa cuộn chuột màn hình ngoài
        $('.calendar-body-scroll').css('overflow', 'hidden');
    });

    // C. Đóng và Xóa chi tiết
    $('#btn-close-detail').on('click', function () {
        $('#event-detail-popover').hide();
        $('.calendar-body-scroll').css('overflow', 'auto');
    });

    $('#btn-delete-event').on('click', function () {
        let id = $(this).data('id');
        if (confirm('Bạn có chắc chắn muốn xóa cuộc hẹn này?')) {
            $.ajax({
                url: '/api/Appointment/delete/' + id, type: 'DELETE',
                success: function () {
                    $('#event-detail-popover').hide();
                    $('.calendar-body-scroll').css('overflow', 'auto'); // <--- THÊM DÒNG NÀY
                    loadAppointments();
                },
                error: function () { alert('Lỗi khi xóa!'); }
            });
        }
    });

    // 3. KÉO THẢ DI CHUYỂN FORM VÀ AUTO SQUISH
    let isDraggingPopover = false;
    let popoverOffset = { x: 0, y: 0 };

    $('#popover-header').on('mousedown', function (e) {
        isDraggingPopover = true;
        let popover = $('#event-popover');
        popoverOffset.x = e.pageX - popover.offset().left;
        popoverOffset.y = e.pageY - popover.offset().top;
    });

    $(document).on('mousemove', function (e) {
        if (isDraggingPopover) {
            let newTop = e.pageY - popoverOffset.y;
            let newLeft = e.pageX - popoverOffset.x;

            if (newTop < window.scrollY) newTop = window.scrollY;

            // --- LOGIC ÉP CHIỀU CAO KHI ĐANG KÉO (DRAGGING) ---
            let windowBottom = window.scrollY + window.innerHeight;
            let availableHeight = windowBottom - newTop - 20;
            let maxBodyHeight = availableHeight - 120; 

            // Ép tịt cỡ cũng phải chừa lại 100px cho body, chặn ko cho rớt form xuống nữa
            if (maxBodyHeight < 100) {
                maxBodyHeight = 100;
                newTop = windowBottom - 120 - 100 - 20;
            }

            $('.popover-body-scroll').css('max-height', maxBodyHeight + 'px');
            $('#event-popover').css({ top: newTop + 'px', left: newLeft + 'px' });
        }
    });

    $(document).on('mouseup', function () {
        isDraggingPopover = false;
    });

    // 4. QUẢN LÝ GUESTS (TÌM KIẾM VÀ ADD BẰNG NÚT ENTER)
    let guestEmails = [];

    $('#popover-guests').on('input', function () {
        let keyword = $(this).val();
        if (keyword.length > 2) {
            $.get('/api/Appointment/search-users?email=' + keyword, function (data) {
                let options = '';
                data.forEach(user => { options += `<option value="${user.email}">${user.username}</option>`; });
                $('#guest-suggestions').html(options);
            });
        }
    });

    $('#popover-guests').on('keypress', function (e) {
        if (e.which == 13) { // Khi bấm phím Enter
            e.preventDefault();
            let email = $(this).val().trim();
            if (email && !guestEmails.includes(email)) {
                $.get('/api/Appointment/search-users?email=' + email, function (data) {
                    let isExist = data.find(u => u.email.toLowerCase() === email.toLowerCase());
                    if (isExist) {
                        guestEmails.push(email);
                        let badge = `<span class="badge bg-secondary d-flex align-items-center me-1 mb-1" style="font-size: 12px; padding: 5px 8px;">
                                        ${email} 
                                        <i class="bi bi-x ms-1 btn-remove-guest" data-email="${email}" style="cursor: pointer; font-size: 14px;"></i>
                                     </span>`;
                        $('#guest-badges-container').append(badge);
                        $('#popover-guests').val('');
                    } else {
                        alert("Email này không tồn tại trong hệ thống. Vui lòng kiểm tra lại!");
                    }
                });
            } else {
                $(this).val('');
            }
        }
    });

    $(document).on('click', '.btn-remove-guest', function () {
        let emailToRemove = $(this).data('email');
        guestEmails = guestEmails.filter(e => e !== emailToRemove);
        $(this).parent().remove();
    });

    // 5. THÊM NHIỀU NOTIFICATION
    $('#btn-add-notification').on('click', function () {
        let newNotify = `
            <div class="d-flex gap-2 mb-2 notification-item align-items-center">
                <i class="bi bi-bell text-muted me-1"></i>
                <select class="form-select form-select-sm border-0 bg-light w-auto text-muted">
                    <option>10 minutes before</option>
                    <option>30 minutes before</option>
                    <option>1 hour before</option>
                </select>
                <button type="button" class="btn btn-sm text-muted btn-remove-notify"><i class="bi bi-x"></i></button>
            </div>
        `;
        $('#notification-list').append(newNotify);
    });

    $(document).on('click', '.btn-remove-notify', function () {
        $(this).closest('.notification-item').remove();
    });

    // 6. GỬI DỮ LIỆU XUỐNG DB
    $('#btn-save-event').off('click').on('click', function () {
        let title = $('#popover-title').val();
        
        // --- LOGIC AUTO (No title) ---
        if (!title || title.trim() === "") {
            title = "(No title)";
        }

        let startDateVal = $('#popover-start-date').val();
        let startTimeVal = $('#popover-start-time').val();
        let endTimeVal = $('#popover-end-time').val();

        let finalStart = new Date(`${startDateVal}T${startTimeVal}:00`);
        let finalEnd = new Date(`${startDateVal}T${endTimeVal}:00`);
        let selectedNotification = $('#notification-list select').first().val() || "30 minutes before";

        let appointmentData = {
            Title: title,
            StartTime: toLocalISOString(finalStart),
            EndTime: toLocalISOString(finalEnd),
            Location: $('#popover-location').val(),
            Description: $('#popover-description').val(),
            ColorCategory: $('#popover-color-select').val(),
            Visibility: parseInt($('#popover-visibility').val() || "0"),
            IsRecurring: false,
            RecurringRule: 0,
            GuestEmails: guestEmails,
            Notification: selectedNotification
        };

        $('#btn-save-event').prop('disabled', true).text('Đang lưu...');

        $.ajax({
            url: '/api/Appointment/create',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(appointmentData),
            success: function (res) {
                $('#event-popover').hide();
                $('.appointment-ghost').remove();
                $ghostEvent = null;
                guestEmails = []; 
                $('#guest-badges-container').empty(); 

                if (res.success) {
                    loadAppointments();
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



// HÀM HỖ TRỢ HIỂN THỊ THỜI GIAN THEO PIXEL (1px = 1 phút)
function formatTimeFromPixels(topPx, heightPx) {
    let startHour = Math.floor(topPx / 60);
    let startMin = Math.floor(topPx % 60);
    let endTopPx = topPx + heightPx;
    let endHour = Math.floor(endTopPx / 60);
    let endMin = Math.floor(endTopPx % 60);

    let sDate = new Date(); sDate.setHours(startHour, startMin, 0);
    let eDate = new Date(); eDate.setHours(endHour, endMin, 0);

    let timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
    return sDate.toLocaleTimeString('en-US', timeOptions) + " - " + eDate.toLocaleTimeString('en-US', timeOptions);
}

// ==========================================
// HÀM LỌC SỰ KIỆN THEO MÀU SẮC CHECKBOX
// ==========================================
function applyColorFilter() {
    // 1. Lấy danh sách các mã màu (hex) đang được tick chọn
    let checkedColors = $('.calendar-color-filter:checked').map(function () {
        return $(this).val().toLowerCase(); // Chuyển về chữ thường để so sánh không bị lỗi
    }).get();

    // 2. Duyệt qua tất cả các khối sự kiện trên lịch
    $('.appointment-block').each(function () {
        let eventColor = $(this).data('color');
        if (eventColor) eventColor = eventColor.toLowerCase();

        // 3. Nếu màu của sự kiện nằm trong danh sách checked -> Hiện, ngược lại -> Ẩn
        if (checkedColors.includes(eventColor)) {
            $(this).show();
        } else {
            $(this).hide();
        }
    });
}

// Lắng nghe thao tác click vào ô Checkbox màu ở Sidebar
$(document).on('change', '.calendar-color-filter', function () {
    applyColorFilter();
});



// ==========================================
// TÍNH NĂNG SHARE LINK & JOIN BẰNG CODE
// ==========================================

// 1. Mở modal Invite và Copy Link
$(document).on('click', '#btn-invite-link', function () {
    let currentEventId = $('#btn-delete-event').data('id'); // Lấy ID đang mở trong detail
    // Giả sử mã code được gen bằng ID hoặc một API nào đó. Ở đây mình làm mẫu link có code
    let mockCode = currentEventId.substring(0, 8); // Lấy 8 ký tự đầu của Guid làm code
    let fullUrl = window.location.origin + "/join?code=" + mockCode;

    $('#meetingLinkUrl').val(fullUrl);
    $('#event-detail-popover').css('z-index', '1040');
    $('#inviteModal').modal('show');
});

$('#btnCopyLink').on('click', function () {
    let linkInput = document.getElementById("meetingLinkUrl");
    linkInput.select();
    navigator.clipboard.writeText(linkInput.value).then(function () {
        // Tùy biến nút copy để có UX tốt hơn
        let originalText = $('#btnCopyLink').text();
        $('#btnCopyLink').text('Copied!').removeClass('btn-primary').addClass('btn-success');
        setTimeout(() => { $('#btnCopyLink').text(originalText).removeClass('btn-success').addClass('btn-primary'); }, 2000);
    });
});

// 2. Xử lý submit mã Code để Join
$('#btnSubmitJoinCode').on('click', function () {
    let code = $('#inputMeetingCode').val().trim();
    if (!code) return;

    $('#overlapWarning').addClass('d-none'); // Ẩn cảnh báo cũ

    $.ajax({
        url: '/api/Appointment/join-by-code',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(code),
        success: function (res) {
            if (res.isOverlap) {
                // Hiện cảnh báo trùng lịch đỏ chót
                $('#overlapWarning').removeClass('d-none').text(res.message);
            } else if (res.success) {
                $('#joinMeetingModal').modal('hide');
                let msg = res.requireApproval ? "Đã gửi yêu cầu tham gia. Chờ người tạo phê duyệt!" : "Đã tham gia thành công!";
                alert(msg);
                loadAppointments(); // Load lại lịch chính để hiện cục event mới
            } else {
                alert(res.message);
            }
        },
        error: function () {
            alert("Lỗi kết nối tới server!");
        }
    });
});