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

        // Ràng buộc giờ kết thúc phải sau giờ bắt đầu
        function syncEndTimeMin() {
            // Cho Mini Popover
            let popStartDate = $('#popover-start-date').val();
            let popStartTime = $('#popover-start-time').val();
            let popEndTime = $('#popover-end-time').val();

            if (popStartTime && popEndTime) {
                let [startH] = popStartTime.split(':').map(Number);
                let [endH] = popEndTime.split(':').map(Number);

                // Logic PM -> AM sáng hôm sau
                if (startH >= 12 && endH < 12) {
                    let d = new Date(popStartDate);
                    d.setDate(d.getDate() + 1);
                    let edStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
                    $('#popover-end-date').val(edStr).show();
                } else {
                    // Nếu không rơi vào case đêm, kiểm tra Start > End cùng ngày
                    if (popStartTime > popEndTime) {
                        let [h, m] = popStartTime.split(':').map(Number);
                        let d = new Date();
                        d.setHours(h, m + 90);
                        $('#popover-end-time').val(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);

                        if (d.getHours() < h) { // Wrap qua ngày mới
                            let ed = new Date(popStartDate); ed.setDate(ed.getDate() + 1);
                            $('#popover-end-date').val(ed.toISOString().split('T')[0]).show();
                        } else {
                            $('#popover-end-date').val(popStartDate).hide();
                        }
                    } else {
                        $('#popover-end-date').val(popStartDate).hide();
                    }
                }
            }

            // Cho Full Screen Modal
            let fsStartDate = $('#fs-start-date').val();
            let fsEndDate = $('#fs-end-date').val();
            let fsStartTime = $('#fs-start-time').val();
            let fsEndTime = $('#fs-end-time').val();

            if (fsStartTime && fsEndTime) {
                let [startH] = fsStartTime.split(':').map(Number);
                let [endH] = fsEndTime.split(':').map(Number);

                if (fsStartDate === fsEndDate && startH >= 12 && endH < 12) {
                    let d = new Date(fsStartDate);
                    d.setDate(d.getDate() + 1);
                    $('#fs-end-date').val(d.toISOString().split('T')[0]);
                } else if (fsStartDate === fsEndDate && fsStartTime > fsEndTime) {
                    let [h, m] = fsStartTime.split(':').map(Number);
                    let d = new Date();
                    d.setHours(h, m + 90);
                    $('#fs-end-time').val(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
                    if (d.getHours() < h) {
                        let ed = new Date(fsStartDate); ed.setDate(ed.getDate() + 1);
                        $('#fs-end-date').val(ed.toISOString().split('T')[0]);
                    }
                }
            }

            // Luôn cập nhật min attribute cho HTML5 picker
            if (fsStartDate === fsEndDate) $('#fs-end-time').attr('min', fsStartTime);
            else $('#fs-end-time').removeAttr('min');

            if ($('#popover-start-date').val() === $('#popover-end-date').val()) $('#popover-end-time').attr('min', popStartTime);
            else $('#popover-end-time').removeAttr('min');
        }

        $(document).on('change', '#popover-start-time, #popover-end-time', syncEndTimeMin);
        $(document).on('change', '#fs-start-time, #fs-start-date, #fs-end-date, #fs-end-time', syncEndTimeMin);

        // Kiểm tra trực tiếp khi người dùng thay đổi ô Giờ kết thúc
        $(document).on('change', '#popover-end-time, #fs-end-time', function () {
            let isFs = $(this).attr('id').startsWith('fs');
            let startId = isFs ? '#fs-start-time' : '#popover-start-time';
            let startTime = $(startId).val();
            let endTime = $(this).val();

            // Nếu là Full Screen, chỉ kiểm tra nếu cùng ngày
            if (isFs && $('#fs-start-date').val() !== $('#fs-end-date').val()) return;

            if (startTime && endTime && startTime > endTime) {
                let [startH] = startTime.split(':').map(Number);
                let [endH] = endTime.split(':').map(Number);

                // Nếu không phải trường hợp PM -> AM (qua đêm), thì mới ép cộng 90p
                if (!(startH >= 12 && endH < 12)) {
                    let [h, m] = startTime.split(':').map(Number);
                    let d = new Date();
                    d.setHours(h, m + 90);
                    $(this).val(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
                }
            }
            syncEndTimeMin();
        });

        // Xuất hàm ra global để dùng trong các handler khác nếu cần
        window.syncEndTimeMin = syncEndTimeMin;
    });

    // ==========================================
    // HÀM VẼ LƯỚI LỊCH CHÍNH (MAIN CALENDAR)
    // ==========================================
    function renderMainCalendar() {
        const $headerGrid = $('.calendar-header-grid');
        const $calendarGrid = $('.calendar-grid');
        const viewMode = parseInt($('#viewSelector').val() || 7);

        // Xóa sạch nội dung cũ trong cả header và body
        $headerGrid.empty().removeClass('multi-row').show();
        $calendarGrid.empty().removeClass('multi-row year-view');

        $headerGrid.css('grid-template-columns', '');
        $calendarGrid.css('grid-template-columns', '');
        $('.time-col').show();

        let startDate = new Date(currDate);

        // --- CHẾ ĐỘ 1: XEM THEO CỘT (Day/Week - <= 7 ngày) ---
        if (viewMode <= 7) {
            document.documentElement.style.setProperty('--col-count', viewMode);

            $headerGrid.append(`
            <div class="time-header" 
                 style="width:60px; font-size:10px; display:flex; align-items:flex-end; justify-content:center; color:#70757a; padding-bottom:5px;">
                GMT+07
            </div>
        `);

            let $timeCol = $('<div class="time-col"></div>');
            for (let h = 0; h < 24; h++) {
                $timeCol.append(`
                <div class="time-slot">
                    <span>${formatHour12(h)}</span>
                </div>
            `);
            }
            $calendarGrid.append($timeCol);

            if (viewMode === 7) {
                let day = startDate.getDay();
                startDate.setDate(startDate.getDate() - (day === 0 ? 6 : day - 1));
            }

            for (let i = 0; i < viewMode; i++) {
                let d = new Date(startDate);
                d.setDate(startDate.getDate() + i);

                renderColumnHeader($headerGrid, d);

                let $col = $(`<div class="day-col" data-date="${d.toISOString().split('T')[0]}" style="position: relative; border-right: 1px solid #ddd;"></div>`);

                for (let h = 0; h < 24; h++) {
                    $col.append(`<div class="hour-marker" style="height: 60px; border-bottom: 1px solid #eee; box-sizing: border-box;"></div>`);
                }

                $calendarGrid.append($col);
            }
        }

        // --- CHẾ ĐỘ 2: XEM THEO HÀNG (Month/2-3 Weeks) ---
        else if (viewMode > 7 && viewMode <= 31) {
            $headerGrid.addClass('multi-row');
            $calendarGrid.addClass('multi-row');
            $('.time-col').hide();

            const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
            dayNames.forEach(name => $headerGrid.append(`<div class="day-header" style="padding:10px 0;">${name}</div>`));

            let firstOfMonth = new Date(currDate.getFullYear(), currDate.getMonth(), 1);
            let startDay = firstOfMonth.getDay();
            let diff = firstOfMonth.getDate() - startDay + (startDay === 0 ? -6 : 1);
            startDate = new Date(firstOfMonth.setDate(diff));

            for (let i = 0; i < 35; i++) {
                let d = new Date(startDate);
                d.setDate(startDate.getDate() + i);
                $calendarGrid.append(`
                <div class="day-col box-view" data-date="${d.toISOString().split('T')[0]}" style="border-right:1px solid #dadce0; border-bottom:1px solid #dadce0; min-height:120px;">
                    <span class="m-1 d-block ${d.getMonth() !== currDate.getMonth() ? 'text-muted' : ''}" style="font-size:12px; font-weight:500;">${d.getDate()}</span>
                </div>`);
            }
        }

        // --- CHẾ ĐỘ 3: XEM NĂM (Year View) ---
        else {
            $headerGrid.hide();
            $('.time-col').hide();
            $calendarGrid.addClass('year-view');

            for (let m = 0; m < 12; m++) {
                let monthDate = new Date(currDate.getFullYear(), m, 1);
                let $monthBox = $(`
                <div class="year-month-box" style="padding:10px;">
                    <div class="year-month-title" style="color:#1a73e8; font-weight:bold; font-size:14px; margin-bottom:8px;">
                        Tháng ${m + 1}
                    </div>
                    <div class="mini-calendar-render-target" id="year-m-${m}"></div>
                </div>`);

                $calendarGrid.append($monthBox);
                renderMonthInYearView(monthDate, `#year-m-${m}`);
            }
        }

        if (typeof loadAppointments === "function") loadAppointments();
        if (typeof updateCurrentTimeIndicator === "function") updateCurrentTimeIndicator();
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
                globalAppointments = data;
                updateNotificationBell();

                $('.appointment-block').remove();

                // ====== PHẦN BỔ SUNG CHO MONTH VIEW TỪ BẢN 2 ======
                const isBoxView = $('.calendar-grid').hasClass('multi-row');
                if (isBoxView) {
                    data.forEach(function (evt) {
                        let start = new Date(evt.start);
                        let dateStr = start.getFullYear() + '-' + String(start.getMonth() + 1).padStart(2, '0') + '-' + String(start.getDate()).padStart(2, '0');
                        let $column = $(`.day-col[data-date='${dateStr}']`);

                        if ($column.length > 0) {
                            // Tích hợp dữ liệu của Bản 1 để Popup bấm vào không bị lỗi
                            let guestsJson = evt.guests ? encodeURIComponent(JSON.stringify(evt.guests)) : '%5B%5D';
                            let descStr = evt.description ? evt.description.replace(/"/g, '&quot;') : '';
                            let locHtmlStr = evt.location ? evt.location.replace(/"/g, '&quot;') : '';

                            let isOwner = evt.isCurrentUserOwner;
                            let hasOtherParticipants = (evt.guests && evt.guests.some(g => g !== evt.ownerEmail));
                            let isLocked = !isOwner || (evt.visibility == 1 && hasOtherParticipants);
                            let opacityStyle = evt.guestStatus === 0 ? 'opacity: 0.5;' : '';

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
                                 data-visibility="${evt.visibility}"
                                 data-teamid="${evt.teamId || ''}"
                                 data-teamname="${evt.teamName || ''}"
                                 data-owneremail="${evt.ownerEmail || ''}"
                                 data-isowner="${evt.isCurrentUserOwner}"
                                 data-locked="${isLocked}"
                                 data-gueststatus="${evt.guestStatus}"
                                 draggable="false" 
                                 style="background-color: ${evt.color}; margin-bottom: 2px; position: relative; width: 100%; font-size: 11px; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; ${opacityStyle}">
                                <span class="title" style="font-weight: 600;">
                                    ${start.getHours()}:${String(start.getMinutes()).padStart(2, '0')} ${evt.title || '(No title)'}
                                </span>
                            </div>
                        `;
                            $column.append(blockHtml);
                        }
                    });
                    applyColorFilter();
                    return; // Thoát sớm, bỏ qua logic cắt lane phức tạp của Bản 1
                }
                // ====== KẾT THÚC PHẦN BỔ SUNG ======

                // 1. Thu thập tất cả các phân đoạn (segments) của cuộc hẹn theo từng cột ngày
                let segmentsByColumn = {};

                data.forEach(function (evt) {
                    let start = new Date(evt.start);
                    let end = new Date(evt.end);

                    let currentDay = new Date(start);
                    currentDay.setHours(0, 0, 0, 0);
                    let endDay = new Date(end);
                    endDay.setHours(0, 0, 0, 0);

                    while (currentDay <= endDay) {
                        let dateStr = currentDay.getFullYear() + '-' + String(currentDay.getMonth() + 1).padStart(2, '0') + '-' + String(currentDay.getDate()).padStart(2, '0');

                        let topPx = 0;
                        let heightPx = 1440;

                        if (currentDay.toDateString() === start.toDateString()) {
                            topPx = (start.getHours() * 60) + start.getMinutes();
                            heightPx = 1440 - topPx;
                        }

                        if (currentDay.toDateString() === end.toDateString()) {
                            let endMins = (end.getHours() * 60) + end.getMinutes();
                            if (currentDay.toDateString() === start.toDateString()) {
                                heightPx = endMins - topPx;
                            } else {
                                topPx = 0;
                                heightPx = endMins;
                            }
                        }

                        if (heightPx > 0) {
                            if (!segmentsByColumn[dateStr]) segmentsByColumn[dateStr] = [];
                            segmentsByColumn[dateStr].push({
                                evt: evt,
                                topPx: topPx,
                                heightPx: heightPx,
                                startTime: start,
                                endTime: end
                            });
                        }
                        currentDay.setDate(currentDay.getDate() + 1);
                    }
                });

                // 2. Xử lý hiển thị từng cột (xử lý chồng lấn)
                Object.keys(segmentsByColumn).forEach(dateStr => {
                    let $column = $(`.day-col[data-date='${dateStr}']`);
                    if ($column.length === 0) return;

                    let segments = segmentsByColumn[dateStr];
                    // Sắp xếp theo thời gian bắt đầu, sau đó theo chiều cao giảm dần
                    segments.sort((a, b) => a.topPx - b.topPx || b.heightPx - a.heightPx);

                    // Gom nhóm các sự kiện có khả năng chồng lấn (clusters)
                    let clusters = [];
                    let currentCluster = null;
                    let maxEndInCluster = -1;

                    segments.forEach(seg => {
                        if (!currentCluster || seg.topPx >= maxEndInCluster) {
                            currentCluster = [];
                            clusters.push(currentCluster);
                            maxEndInCluster = seg.topPx + seg.heightPx;
                        } else {
                            maxEndInCluster = Math.max(maxEndInCluster, seg.topPx + seg.heightPx);
                        }
                        currentCluster.push(seg);
                    });

                    // Phân bổ lane (cột dọc) cho từng cluster
                    clusters.forEach(cluster => {
                        let lanes = [];
                        cluster.forEach(seg => {
                            let placed = false;
                            for (let i = 0; i < lanes.length; i++) {
                                let lastInLane = lanes[i][lanes[i].length - 1];
                                if (seg.topPx >= lastInLane.topPx + lastInLane.heightPx) {
                                    lanes[i].push(seg);
                                    seg.laneIndex = i;
                                    placed = true;
                                    break;
                                }
                            }
                            if (!placed) {
                                seg.laneIndex = lanes.length;
                                lanes.push([seg]);
                            }
                        });

                        let laneCount = lanes.length;
                        cluster.forEach(seg => {
                            let widthPercent = 100 / laneCount;
                            let leftPercent = seg.laneIndex * widthPercent;

                            // Render HTML
                            let evt = seg.evt;
                            let timeString = seg.startTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) +
                                " - " + seg.endTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

                            let locString = evt.location ? `<br/>📍 ${evt.location}` : '';
                            let guestsJson = evt.guests ? encodeURIComponent(JSON.stringify(evt.guests)) : '%5B%5D';
                            let descStr = evt.description ? evt.description.replace(/"/g, '&quot;') : '';
                            let locHtmlStr = evt.location ? evt.location.replace(/"/g, '&quot;') : '';

                            let isOwner = evt.isCurrentUserOwner;
                            let hasOtherParticipants = (evt.guests && evt.guests.some(g => g !== evt.ownerEmail));

                            let isLocked = false;
                            if (!isOwner) {
                                isLocked = true;
                            } else if (evt.visibility == 1 && hasOtherParticipants) {
                                isLocked = true;
                            }

                            let draggableAttr = isLocked ? 'false' : 'true';
                            let resizeHandleHtml = isLocked ? '' : '<div class="resize-handle"></div>';
                            let opacityStyle = evt.guestStatus === 0 ? 'opacity: 0.5;' : '';

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
                                 data-visibility="${evt.visibility}"
                                 data-teamid="${evt.teamId || ''}"
                                 data-teamname="${evt.teamName || ''}"
                                 data-owneremail="${evt.ownerEmail || ''}"
                                 data-isowner="${evt.isCurrentUserOwner}"
                                 data-locked="${isLocked}"
                                 data-gueststatus="${evt.guestStatus}"
                                 draggable="${draggableAttr}" 
                                 style="position: absolute; top: ${seg.topPx}px; height: ${seg.heightPx}px; width: ${widthPercent - 1}%; left: ${leftPercent}%; z-index: 10; background-color: ${evt.color}; border: 1px solid white; overflow: hidden; ${opacityStyle}">
                                <div class="title" style="font-weight: 600; font-size: 13px; line-height: 1.2;">${evt.title || '(No title)'}</div>
                                <div class="time-loc" style="font-size: 11px; line-height: 1.2; margin-top: 2px;">
                                    ${timeString} ${locString}
                                </div>
                                ${resizeHandleHtml}
                            </div>
                        `;
                            $column.append(blockHtml);
                        });
                    });
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

        let currentId = draggedEventId; // Lưu lại ID vào biến cục bộ

        $.ajax({
            url: '/api/Appointment/update-time',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                Id: currentId,
                StartTime: startTime,
                EndTime: endTime
            }),
            success: function (res) {
                // 1. Check trùng lịch Team (Group Meeting)
                if (res.suggestTeamJoin) {
                    if (confirm(res.message)) {
                        $.post(`/api/Appointment/join/${res.appointmentId}`, function (joinRes) {
                            if (joinRes.success) {
                                // Người dùng đồng ý tham gia -> Xóa lịch cũ đang kéo để tránh rác dữ liệu
                                $.ajax({
                                    url: '/api/Appointment/delete/' + currentId,
                                    type: 'DELETE',
                                    success: function () {
                                        alert("Đã tham gia cuộc họp nhóm thành công!");
                                        loadAppointments();
                                    }
                                });
                            } else {
                                alert("Tham gia thất bại: " + joinRes.message);
                                loadAppointments(); // Reset lịch về vị trí cũ
                            }
                        });
                    } else {
                        // Người dùng Cancel
                        alert("Vui lòng đổi Tên sự kiện, chọn Giờ khác không chồng lấn, hoặc set quyền về Private để tiếp tục dời lịch.");
                        loadAppointments(); // Reset lịch về vị trí cũ
                    }
                    return;
                }

                // 2. Check trùng lịch thông thường (isOverlap)
                if (res.isOverlap) {
                    if (confirm(res.message)) {
                        $.ajax({
                            url: '/api/Appointment/update-time',
                            type: 'POST',
                            contentType: 'application/json',
                            data: JSON.stringify({
                                Id: currentId,
                                StartTime: startTime,
                                EndTime: endTime,
                                OverwriteOverlap: true
                            }),
                            success: function (res2) {
                                if (res2.success) loadAppointments();
                                else alert("Lưu thất bại: " + res2.message);
                            }
                        });
                    } else {
                        loadAppointments();
                    }
                    return;
                }

                // 3. Không có lỗi gì
                if (res.success) loadAppointments();
                else {
                    alert(res.message || "Lưu thất bại!");
                    loadAppointments();
                }
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
            $('#popover-end-date').val(dateStr).hide();
            $('#popover-start-time').val(`${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`);
            $('#popover-end-time').val(`${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`);
            syncEndTimeMin();

            // Reset visibility dropdown
            $('#popover-visibility').val('0');
            $('#team-selection-row').addClass('d-none');
            $('#team-dropdown').empty().append('<option value="">-- Select Team --</option>');

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

                let resizeId = $resizeBlock.data('id'); // Lưu lại ID trước khi AJAX chạy

                // Gọi API Update thời gian
                $.ajax({
                    url: '/api/Appointment/update-time', type: 'POST', contentType: 'application/json',
                    data: JSON.stringify({ Id: resizeId, StartTime: toLocalISOString(finalStart), EndTime: toLocalISOString(finalEnd) }),
                    success: function (res) {
                        // Check trùng lịch Team
                        if (res.suggestTeamJoin) {
                            if (confirm(res.message)) {
                                $.post(`/api/Appointment/join/${res.appointmentId}`, function (joinRes) {
                                    if (joinRes.success) {
                                        // Xóa lịch bị kéo giãn để tránh rác
                                        $.ajax({
                                            url: '/api/Appointment/delete/' + resizeId,
                                            type: 'DELETE',
                                            success: function () {
                                                alert("Đã tham gia cuộc họp nhóm thành công!");
                                                loadAppointments();
                                            }
                                        });
                                    } else {
                                        alert("Tham gia thất bại: " + joinRes.message);
                                        loadAppointments();
                                    }
                                });
                            } else {
                                alert("Vui lòng đổi Tên sự kiện, chọn Giờ khác không chồng lấn, hoặc set quyền về Private để tiếp tục dời lịch.");
                                loadAppointments(); // Trả lại kích thước cũ
                            }
                            return;
                        }

                        if (res.success) loadAppointments();
                        else {
                            alert(res.message || "Cập nhật thất bại!");
                            loadAppointments();
                        }
                    }
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

            let visibility = block.attr('data-visibility');
            let teamName = block.attr('data-teamname');
            let isOwner = block.attr('data-isowner') === 'true';

            if (!startStr || !endStr) return;

            let start = new Date(startStr);
            let end = new Date(endStr);
            let dateOptions = { weekday: 'long', month: 'long', day: 'numeric' };
            let timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };

            let timeStr = `${start.toLocaleDateString('en-US', dateOptions)} • ${start.toLocaleTimeString('en-US', timeOptions)}`;
            if (start.toDateString() === end.toDateString()) {
                timeStr += ` - ${end.toLocaleTimeString('en-US', timeOptions)}`;
            } else {
                timeStr += ` - ${end.toLocaleDateString('en-US', dateOptions)} • ${end.toLocaleTimeString('en-US', timeOptions)}`;
            }

            $('#detail-title').text(title);
            $('#detail-time').text(timeStr);
            $('#detail-color-dot').css('background-color', color);
            $('#btn-delete-event').data('id', id);
            $('#detail-notification').text(notification);

            // Truyền data vào nút xóa
            $('#btn-delete-event').data('id', id);
            $('#btn-delete-event').data('isowner', isOwner);
            $('#btn-delete-event').data('visibility', visibility);

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

            // 3. Guests & Organizer
            let ownerEmail = block.attr('data-owneremail');
            let allParticipants = [];
            if (ownerEmail) allParticipants.push({ email: ownerEmail, isOwner: true });
            if (guests && guests.length > 0) {
                guests.forEach(g => {
                    if (g !== ownerEmail) allParticipants.push({ email: g, isOwner: false });
                });
            }

            if (allParticipants.length > 0) {
                $('#detail-guests-row').removeClass('d-none').addClass('d-flex');
                $('#detail-guest-count').text(`${allParticipants.length} participant${allParticipants.length > 1 ? 's' : ''}`);

                let guestHtml = '';
                allParticipants.forEach(p => {
                    let firstLetter = p.email.charAt(0).toUpperCase();
                    let roleTag = p.isOwner ? ' <span class="text-muted small">(Organizer)</span>' : '';
                    guestHtml += `
                    <div class="d-flex align-items-center mb-2">
                        <div style="width: 28px; height: 28px; border-radius: 50%; background-color: #e8eaed; color: #5f6368; display: flex; justify-content: center; align-items: center; font-size: 12px; font-weight: bold; margin-right: 10px;">
                            ${firstLetter}
                        </div>
                        <div style="font-size: 14px; color: #3c4043; word-break: break-all;">
                            ${p.email}${roleTag}
                        </div>
                    </div>`;
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

            // --- XỬ LÝ VISIBILITY ---
            if (visibility === "1" && teamName && teamName.trim() !== "") {
                $('#detail-visibility-row').removeClass('d-none').addClass('d-flex');
                $('#detail-visibility-text').text(`Group Meeting for: ${teamName}`);
            } else {
                $('#detail-visibility-row').removeClass('d-flex').addClass('d-none');
            }

            // --- ẨN/HIỆN NÚT EDIT VÀ TRASH ---
            let guestStatus = parseInt(block.attr('data-gueststatus'));

            // Nếu không phải chủ sở hữu (là Guest) -> Không cho sửa bất cứ gì (cả Private và Group Meeting)
            if (!isOwner) {
                $('#btn-edit-event').hide();
                if (guestStatus === 0) {
                    $('#btn-delete-event').hide(); // Hide top trash, use Deny instead
                } else {
                    $('#btn-delete-event').show();
                }
            } else {
                $('#btn-edit-event').show();
                $('#btn-delete-event').show();
            }

            // --- ACCEPT/DENY CHO GUEST ---
            if (!isOwner && guestStatus === 0) {
                $('#detail-action-row').removeClass('d-none');
                $('#btn-accept-invite').data('id', id);
                $('#btn-deny-invite').data('id', id);
            } else {
                $('#detail-action-row').addClass('d-none');
            }

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

        function acceptInvitation(id, overwriteOverlap = false) {
            $.post('/api/Appointment/accept/' + id + '?overwriteOverlap=' + overwriteOverlap, function (res) {
                if (res.isOverlap) {
                    if (confirm(res.message)) {
                        acceptInvitation(id, true);
                    }
                } else if (res.success) {
                    $('#event-detail-popover').hide();
                    $('.calendar-body-scroll').css('overflow', 'auto');
                    loadAppointments();
                } else {
                    alert("Lỗi: " + res.message);
                }
            });
        }

        $('#btn-accept-invite').on('click', function () {
            let id = $(this).data('id');
            acceptInvitation(id);
        });

        $('#btn-deny-invite').on('click', function () {
            let id = $(this).data('id');
            $.post('/api/Appointment/unjoin/' + id, function (res) {
                if (res.success) {
                    $('#event-detail-popover').hide();
                    $('.calendar-body-scroll').css('overflow', 'auto');
                    loadAppointments();
                } else {
                    alert("Lỗi: " + res.message);
                }
            });
        });

        $('#btn-delete-event').on('click', function () {
            let id = $(this).data('id');
            let isOwner = $(this).data('isowner');
            // Ép kiểu về string để so sánh cho an toàn
            let visibility = String($(this).data('visibility'));

            // Cấu hình mặc định cho Owner (Xóa sự kiện)
            let confirmMessage = 'Bạn có chắc chắn muốn xóa cuộc hẹn này?';
            let apiUrl = '/api/Appointment/delete/' + id;
            let httpMethod = 'DELETE';

            // Nếu không phải chủ sở hữu (là Guest) -> Đổi sang chế độ Rời khỏi (Unjoin) bất kể Private hay Group Meeting
            if (!isOwner) {
                confirmMessage = 'Bạn có chắc muốn rời khỏi cuộc hẹn này không?';
                apiUrl = '/api/Appointment/unjoin/' + id;
                httpMethod = 'POST';
            }

            if (confirm(confirmMessage)) {
                $.ajax({
                    url: apiUrl,
                    type: httpMethod,
                    success: function (res) {
                        if (res.success) {
                            $('#event-detail-popover').hide();
                            $('.calendar-body-scroll').css('overflow', 'auto');
                            loadAppointments();
                        } else {
                            alert("Thao tác thất bại: " + (res.message || "Lỗi không xác định"));
                        }
                    },
                    error: function (xhr) {
                        // Bắt lỗi chi tiết từ server gửi về nếu có
                        let msg = "Lỗi khi xử lý thao tác!";
                        if (xhr.responseJSON && xhr.responseJSON.message) {
                            msg = xhr.responseJSON.message;
                        }
                        alert(msg);
                    }
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
                                         <i class="fas fa-times ms-2 btn-remove-guest" data-email="${email}" style="cursor: pointer; font-size: 14px;"></i>
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
            let finalEnd = new Date(`${$('#popover-end-date').val()}T${endTimeVal}:00`);
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
                Notification: selectedNotification,
                TeamId: (parseInt($('#popover-visibility').val()) === 1) ? ($('#team-dropdown').val() || null) : null
            };

            $('#btn-save-event').prop('disabled', true).text('Đang lưu...');

            $.ajax({
                url: '/api/Appointment/create',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(appointmentData),
                success: function (res) {
                    if (res.suggestTeamJoin) {
                        if (confirm(res.message)) {
                            $.post(`/api/Appointment/join/${res.appointmentId}`, function (joinRes) {
                                if (joinRes.success) {
                                    $('#event-popover').hide();
                                    $('.appointment-ghost').remove();
                                    $ghostEvent = null;
                                    alert("Đã tham gia cuộc họp nhóm thành công!");
                                    loadAppointments();
                                } else {
                                    alert("Tham gia thất bại: " + joinRes.message);
                                }
                            });
                        } else {
                            // Người dùng nhấn Cancel từ chối Join
                            alert("Vui lòng đổi Tên sự kiện, chọn Giờ khác không chồng lấn, hoặc set quyền về Private để tiếp tục tạo cuộc họp mới.");
                        }
                        $('#btn-save-event').prop('disabled', false).text('Save');
                        return;
                    }

                    if (res.isOverlap) {
                        if (confirm(res.message)) {
                            appointmentData.OverwriteOverlap = true;
                            $.ajax({
                                url: '/api/Appointment/create',
                                type: 'POST',
                                contentType: 'application/json',
                                data: JSON.stringify(appointmentData),
                                success: function (retryRes) {
                                    if (retryRes.success) {
                                        $('#event-popover').hide();
                                        $('.appointment-ghost').remove();
                                        $ghostEvent = null;
                                        loadAppointments();
                                    } else {
                                        alert("Lưu thất bại sau khi thay thế: " + retryRes.message);
                                    }
                                }
                            });
                        }
                        $('#btn-save-event').prop('disabled', false).text('Save');
                        return;
                    }

                    if (res.success) {
                        $('#event-popover').hide();
                        $('.appointment-ghost').remove();
                        $ghostEvent = null;
                        guestEmails = [];
                        $('#guest-badges-container').empty();
                        loadAppointments();
                    } else {
                        alert("Lưu thất bại: " + res.message);
                        $('#btn-save-event').prop('disabled', false).text('Save');
                    }
                },
                error: function (xhr) {
                    let msg = "Lỗi kết nối server!";
                    if (xhr.responseJSON && xhr.responseJSON.message) msg = xhr.responseJSON.message;
                    alert(msg);
                    $('#btn-save-event').prop('disabled', false).text('Save');
                },
                complete: function () {
                    $('#btn-save-event').prop('disabled', false).text('Save');
                }
            });
        });

        // Dùng Event Delegation để đảm bảo sự kiện luôn bắt được
        $(document).on('change', '#popover-visibility', function () {
            const visibility = $(this).val();
            const $row = $('#team-selection-row');
            const $dropdown = $('#team-dropdown');

            if (visibility === "1") { // Nếu chọn Group Meeting
                // Gọi API lấy danh sách Team của user
                $.get('/api/Appointment/get-user-teams', function (teams) {
                    if (teams && teams.length > 0) {
                        let html = '<option value="">-- Select Team --</option>';
                        teams.forEach(team => {
                            html += `<option value="${team.id}">${team.name}</option>`;
                        });
                        $dropdown.html(html);
                        $row.removeClass('d-none').addClass('d-flex');
                    } else {
                        $dropdown.html('<option value="">No teams found</option>');
                        $row.removeClass('d-none').addClass('d-flex');
                    }
                }).fail(function () {
                    console.error("Failed to load teams");
                });
            } else {
                $row.addClass('d-none').removeClass('d-flex');
                $dropdown.empty().append('<option value="">-- Select Team --</option>');
            }
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
    // TÍNH NĂNG JOIN BẰNG CODE
    // ==========================================

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

    // ==========================================
    // MỞ POPOVER KHI BẤM NÚT "CREATE EVENT" Ở SIDEBAR
    // ==========================================
    $(document).on('click', '#btn-create-event', function (e) {
        e.preventDefault();

        // 1. Lấy ngày giờ hiện tại làm mặc định (thời lượng 30 phút)
        let now = new Date();
        // Chỉnh giờ về Local để tránh lệch múi giờ khi gọi toISOString()
        let localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
        let dateStr = localDate.toISOString().split('T')[0];

        let startHour = now.getHours();
        let startMin = Math.floor(now.getMinutes() / 15) * 15; // Làm tròn về mốc 15p gần nhất
        let endHour = startHour;
        let endMin = startMin + 30;

        if (endMin >= 60) {
            endHour += 1;
            endMin -= 60;
        }

        // 2. Làm sạch dữ liệu form cũ
        $('#popover-title').val('');
        $('#popover-location').val('');
        $('#popover-description').val('');
        $('#popover-guests').val('');
        $('#guest-badges-container').empty();
        guestEmails = []; // Reset mảng khách mời toàn cục

        // 3. Đổ dữ liệu thời gian vào các ô input
        $('#popover-start-date').val(dateStr);
        $('#popover-end-date').val(dateStr).hide(); // Mặc định ẩn ngày kết thúc
        $('#popover-start-time').val(`${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`);
        $('#popover-end-time').val(`${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`);

        // 4. Reset dropdown màu sắc giống logic kéo thả
        let categories = getCalendarCategories();
        let dropdownOptions = categories.map(c => {
            return `<option value="${c.hex}" style="color: ${c.hex}; font-weight: bold;">&#9679; &nbsp; ${c.displayName}</option>`;
        }).join('');

        let $colorSelect = $('#popover-color-select');
        $colorSelect.html(dropdownOptions);
        $colorSelect.val('#039be5').css('color', '#039be5'); // Mặc định màu Blue
        $colorSelect.off('change').on('change', function () {
            $(this).css('color', $(this).val());
        });
        syncEndTimeMin();

        // 5. Căn chỉnh vị trí popover (hiển thị chếch sang phải nút Create của sidebar)
        let $container = $(this).closest('.create-button-container');
        let btnOffset = $container.offset();
        let popTop = btnOffset.top;
        let popLeft = btnOffset.left + $container.outerWidth() + 15; // Cách ra 15px cho đẹp

        // Khôi phục chiều cao tối đa của form đề phòng trường hợp trước đó bị ép ngắn do kéo xuống cuối màn hình
        $('.popover-body-scroll').css('max-height', '400px');

        // Hiện popover và focus vào ô nhập Title
        $('#event-popover').css({ top: popTop + 'px', left: popLeft + 'px' }).show();
        $('#popover-title').focus();
    });


    // ==========================================
    // XỬ LÝ FORM FULL SCREEN (SỬA & MORE OPTIONS)
    // ==========================================
    let fsGuestEmails = [];
    let currentEditEventId = null; // Lưu ID nếu đang sửa, null nếu tạo mới

    // 1. Hàm dùng chung: Render dropdown màu cho Full Screen
    function setupFsColorDropdown(selectedColor) {
        let categories = getCalendarCategories();
        let options = categories.map(c =>
            `<option value="${c.hex}" style="color: ${c.hex}; font-weight: bold;">&#9679; &nbsp; ${c.displayName}</option>`
        ).join('');

        $('#fs-color-select').html(options);
        let initColor = selectedColor || '#039be5';
        $('#fs-color-select').val(initColor).css('color', initColor);
        $('#fs-color-select').off('change').on('change', function () {
            $(this).css('color', $(this).val());
        });
    }

    // 2. Hàm dùng chung: Render Guest List cho Full Screen
    function renderFsGuests() {
        let html = '';
        fsGuestEmails.forEach(email => {
            let firstLetter = email.charAt(0).toUpperCase();
            html += `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <div class="d-flex align-items-center">
                    <div style="width: 28px; height: 28px; border-radius: 50%; background-color: #e8eaed; color: #5f6368; display: flex; justify-content: center; align-items: center; font-size: 12px; font-weight: bold; margin-right: 10px;">${firstLetter}</div>
                    <div style="font-size: 14px; color: #3c4043; word-break: break-all;">${email}</div>
                </div>
                <!-- Đổi thành fas fa-times của FontAwesome -->
                <i class="fas fa-times fs-5 text-muted btn-remove-fs-guest" data-email="${email}" style="cursor: pointer;"></i>
            </div>`;
        });
        $('#fs-guest-list-container').html(html);
    }

    // Xóa guest trong Full Screen
    $(document).on('click', '.btn-remove-fs-guest', function () {
        let email = $(this).data('email');
        fsGuestEmails = fsGuestEmails.filter(e => e !== email);
        renderFsGuests();
    });

    // Thêm guest bằng Enter trong Full Screen (Đã thêm check DB)
    $('#fs-guests-input').on('keypress', function (e) {
        if (e.which === 13) {
            e.preventDefault();
            let email = $(this).val().trim();

            if (email && !fsGuestEmails.includes(email)) {
                // Gọi API kiểm tra email có tồn tại không
                $.get('/api/Appointment/search-users?email=' + email, function (data) {
                    // Kiểm tra xem email nhập vào có nằm trong kết quả trả về không
                    let isExist = data.find(u => u.email.toLowerCase() === email.toLowerCase());

                    if (isExist) {
                        // Nếu tồn tại -> Thêm vào mảng và vẽ lại giao diện
                        fsGuestEmails.push(email);
                        renderFsGuests();
                        $('#fs-guests-input').val(''); // Xóa ô nhập sau khi thêm thành công
                    } else {
                        // Nếu không tồn tại -> Báo lỗi
                        alert("Email này không tồn tại trong hệ thống. Vui lòng kiểm tra lại!");
                    }
                });
            } else {
                $(this).val(''); // Xóa text nếu input rỗng hoặc email đã được thêm từ trước
            }
        }
    });

    // (Tùy chọn) Gợi ý email khi đang gõ giống form mini
    $('#fs-guests-input').on('input', function () {
        let keyword = $(this).val();
        if (keyword.length > 2) {
            $.get('/api/Appointment/search-users?email=' + keyword, function (data) {
                let options = '';
                data.forEach(user => { options += `<option value="${user.email}">${user.username}</option>`; });

                // Nếu bạn muốn dùng gợi ý, nhớ thêm thẻ <datalist id="fs-guest-suggestions"></datalist>
                // ngay dưới thẻ input #fs-guests-input trong file HTML nhé.
                if ($('#fs-guest-suggestions').length === 0) {
                    $('#fs-guests-input').after('<datalist id="fs-guest-suggestions"></datalist>');
                    $('#fs-guests-input').attr('list', 'fs-guest-suggestions');
                }
                $('#fs-guest-suggestions').html(options);
            });
        }
    });

    // 3. MỞ FULL SCREEN TỪ "MORE OPTIONS" CỦA FORM TẠO (Mini Popover)
    $(document).on('click', '#btn-more-options', function (e) {
        e.preventDefault();
        currentEditEventId = null; // Đang tạo mới

        // Reset disabled fields
        $('#fs-start-date, #fs-start-time, #fs-end-date, #fs-end-time, #fs-team-dropdown, #fs-visibility').prop('disabled', false);

        // Bê dữ liệu từ mini popover sang
        $('#fs-title').val($('#popover-title').val());
        $('#fs-start-date').val($('#popover-start-date').val());
        $('#fs-end-date').val($('#popover-start-date').val()); // Cùng ngày
        $('#fs-start-time').val($('#popover-start-time').val());
        $('#fs-end-time').val($('#popover-end-time').val());
        $('#fs-location').val($('#popover-location').val());
        $('#fs-description').val($('#popover-description').val());
        $('#fs-notification').val($('#notification-list select').first().val() || "30 minutes before");
        $('#fs-visibility').val($('#popover-visibility').val());

        // Chuyển TeamId sang Full Screen
        if ($('#popover-visibility').val() === "1") {
            let teamId = $('#team-dropdown').val();
            let teamHtml = $('#team-dropdown').html();
            $('#fs-team-dropdown').html(teamHtml).val(teamId);
            $('#fs-team-selection-row').removeClass('d-none').addClass('d-flex');
        } else {
            $('#fs-team-selection-row').addClass('d-none').removeClass('d-flex');
        }

        setupFsColorDropdown($('#popover-color-select').val());

        fsGuestEmails = [...guestEmails]; // Copy array guest
        renderFsGuests();

        $('#event-popover').hide();
        syncEndTimeMin();
        $('#fullScreenEventModal').modal('show');
    });

    // 4. MỞ FULL SCREEN TỪ "CÂY BÚT" CỦA FORM CHI TIẾT SỰ KIỆN ĐÃ CÓ
    $(document).on('click', '#btn-edit-event', function (e) {
        e.preventDefault();
        currentEditEventId = $('#btn-delete-event').data('id');

        // Tìm event block trên UI để lấy data
        let $block = $(`.appointment-block[data-id='${currentEditEventId}']`);
        let isLocked = $block.attr('data-locked') === 'true';

        // Reset disabled fields before applying lock
        $('#fs-start-date, #fs-start-time, #fs-end-date, #fs-end-time, #fs-team-dropdown, #fs-visibility').prop('disabled', false);

        if (isLocked) {
            $('#fs-start-date, #fs-start-time, #fs-end-date, #fs-end-time, #fs-team-dropdown, #fs-visibility').prop('disabled', true);
        }

        let start = new Date($block.data('start'));
        let end = new Date($block.data('end'));

        let title = $block.data('title');
        $('#fs-title').val(title === '(No title)' ? '' : title);

        $('#fs-start-date').val(start.getFullYear() + '-' + String(start.getMonth() + 1).padStart(2, '0') + '-' + String(start.getDate()).padStart(2, '0'));
        $('#fs-end-date').val(end.getFullYear() + '-' + String(end.getMonth() + 1).padStart(2, '0') + '-' + String(end.getDate()).padStart(2, '0'));
        $('#fs-start-time').val(`${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`);
        $('#fs-end-time').val(`${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`);

        $('#fs-location').val($block.data('location'));
        $('#fs-description').val($block.data('description'));
        $('#fs-notification').val($block.data('notification') || "30 minutes before");

        setupFsColorDropdown($block.data('color'));

        let guestsRaw = $block.attr('data-guests');
        fsGuestEmails = JSON.parse(decodeURIComponent(guestsRaw || '%5B%5D'));
        renderFsGuests();

        // Xử lý Team khi Edit
        let visibility = $block.attr('data-visibility');
        $('#fs-visibility').val(visibility);
        if (visibility === "1") {
            let teamId = $block.attr('data-teamid') || $block.data('teamid');
            // Lưu ý: data-teamid có thể chưa được nhét vào blockHtml ở hàm loadAppointments.
            // Tôi sẽ bổ sung nó vào blockHtml sau.

            $.get('/api/Appointment/get-user-teams', function (teams) {
                let html = '<option value="">-- Select Team --</option>';
                if (teams && teams.length > 0) {
                    teams.forEach(team => {
                        html += `<option value="${team.id}">${team.name}</option>`;
                    });
                }
                $('#fs-team-dropdown').html(html).val(teamId);
                $('#fs-team-selection-row').removeClass('d-none').addClass('d-flex');
            });
        } else {
            $('#fs-team-selection-row').addClass('d-none');
        }

        // Ẩn Popover detail và mở modal
        $('#event-detail-popover').hide();
        $('.calendar-body-scroll').css('overflow', 'auto');
        syncEndTimeMin();
        $('#fullScreenEventModal').modal('show');
    });

    // 5. NÚT LƯU CỦA FULL SCREEN MODAL
    $('#btn-save-fs-event').on('click', function () {
        let hiddenId = $('#fs-edit-event-id').val();
        let activeEventId = hiddenId ? hiddenId : (typeof currentEditEventId !== 'undefined' ? currentEditEventId : null);
        if (activeEventId === "") activeEventId = null;
        let title = $('#fs-title').val() || "(No title)";
        let finalStart = new Date(`${$('#fs-start-date').val()}T${$('#fs-start-time').val()}:00`);
        let finalEnd = new Date(`${$('#fs-end-date').val()}T${$('#fs-end-time').val()}:00`);

        // Thu thập thêm permissions nếu bạn có lưu trong DB
        let guestPermissions = {
            modify: $('#perm-modify').is(':checked'),
            invite: $('#perm-invite').is(':checked'),
            seeList: $('#perm-see-list').is(':checked')
        };

        let appointmentData = {
            Id: activeEventId, // Nếu null thì API sẽ hiểu là Create mới
            Title: title,
            StartTime: toLocalISOString(finalStart),
            EndTime: toLocalISOString(finalEnd),
            Location: $('#fs-location').val(),
            Description: $('#fs-description').val(),
            ColorCategory: $('#fs-color-select').val(),
            Visibility: parseInt($('#fs-visibility').val() || "0"),
            Notification: $('#fs-notification').val(),
            GuestEmails: fsGuestEmails,
            TeamId: (parseInt($('#fs-visibility').val()) === 1) ? ($('#fs-team-dropdown').val() || null) : null
            // GuestPermissions: guestPermissions // Tùy chọn mở rộng cho DB của bạn
        };

        let apiUrl = activeEventId ? '/api/Appointment/update' : '/api/Appointment/create'; // Thay đổi URL Update nếu cần
        let httpMethod = 'POST'; // Thay đổi nếu API Update dùng PUT

        $(this).prop('disabled', true).text('Đang lưu...');

        $.ajax({
            url: apiUrl,
            type: httpMethod,
            contentType: 'application/json',
            data: JSON.stringify(appointmentData),
            success: function (res) {
                if (res.suggestTeamJoin) {
                    if (confirm(res.message)) {
                        $.post(`/api/Appointment/join/${res.appointmentId}`, function (joinRes) {
                            if (joinRes.success) {
                                $('#fullScreenEventModal').modal('hide');
                                alert("Đã tham gia cuộc họp nhóm thành công!");
                                loadAppointments();
                            } else {
                                alert("Tham gia thất bại: " + joinRes.message);
                            }
                        });
                    } else {
                        // Người dùng nhấn Cancel từ chối Join
                        alert("Vui lòng đổi Tên sự kiện, chọn Giờ khác không chồng lấn, hoặc set quyền về Private để tiếp tục tạo cuộc họp mới.");
                    }
                    $(this).prop('disabled', false).text('Save');
                    return;
                }

                if (res.suggestOverlapReplacement) {
                    if (confirm(res.message)) {
                        $.post(`/api/Appointment/delete/${res.oldApptId}`, function (delRes) {
                            if (delRes.success) {
                                $.ajax({
                                    url: '/api/Appointment/create',
                                    type: 'POST',
                                    contentType: 'application/json',
                                    data: JSON.stringify(appointmentData),
                                    success: function (retryRes) {
                                        if (retryRes.success) {
                                            $('#fullScreenEventModal').modal('hide');
                                            loadAppointments();
                                        } else {
                                            alert("Lưu thất bại sau khi thay thế: " + retryRes.message);
                                        }
                                    }
                                });
                            } else {
                                alert("Xóa lịch cũ thất bại: " + delRes.message);
                            }
                        });
                    }
                    $(this).prop('disabled', false).text('Save');
                    return;
                }

                if (res.isOverlap) {
                    if (confirm(res.message)) {
                        appointmentData.OverwriteOverlap = true;
                        $.ajax({
                            url: '/api/Appointment/update',
                            type: 'POST',
                            contentType: 'application/json',
                            data: JSON.stringify(appointmentData),
                            success: function (retryRes) {
                                if (retryRes.success) {
                                    $('#fullScreenEventModal').modal('hide');
                                    loadAppointments();
                                } else {
                                    alert("Lưu thất bại sau khi thay thế: " + retryRes.message);
                                }
                            }
                        });
                    }
                    $(this).prop('disabled', false).text('Save');
                    return;
                }

                if (res.success) {
                    $('#fullScreenEventModal').modal('hide');
                    loadAppointments();
                } else {
                    alert("Lưu thất bại: " + (res.message || "Lỗi không xác định"));
                }
            }.bind(this),
            error: function (xhr) {
                let msg = "Lỗi kết nối server!";
                if (xhr.responseJSON && xhr.responseJSON.message) msg = xhr.responseJSON.message;
                alert(msg);
            },
            complete: () => {
                $(this).prop('disabled', false).text('Save');
            }
        });
    });

    // Thêm listener cho fs-visibility
    $(document).on('change', '#fs-visibility', function () {
        const visibility = $(this).val();
        const $row = $('#fs-team-selection-row');
        const $dropdown = $('#fs-team-dropdown');

        if (visibility === "1") {
            $.get('/api/Appointment/get-user-teams', function (teams) {
                if (teams && teams.length > 0) {
                    let html = '<option value="">-- Select Team --</option>';
                    teams.forEach(team => {
                        html += `<option value="${team.id}">${team.name}</option>`;
                    });
                    $dropdown.html(html);
                    $row.removeClass('d-none').addClass('d-flex');
                } else {
                    $dropdown.html('<option value="">No teams found</option>');
                    $row.removeClass('d-none').addClass('d-flex');
                }
            });
        } else {
            $row.addClass('d-none').removeClass('d-flex');
            $dropdown.empty().append('<option value="">-- Select Team --</option>');
        }
    });

    // ==========================================
    // HIỂN THỊ THANH THỜI GIAN THỰC (CURRENT TIME INDICATOR)
    // ==========================================
    function updateCurrentTimeIndicator() {
        let now = new Date();
        // Chuyển đổi ngày hiện tại thành chuỗi YYYY-MM-DD để tìm cột
        let dateStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

        // Tìm cột của ngày hôm nay trong lưới lịch
        let $todayCol = $(`.day-col[data-date='${dateStr}']`);

        // Xóa thanh đỏ cũ nếu đang tồn tại (để reset vị trí hoặc tự động nhảy khi qua ngày mới)
        $('.current-time-indicator').remove();

        // Nếu cột của ngày hôm nay đang hiển thị trên màn hình
        if ($todayCol.length > 0) {
            // Tính toán tọa độ Y: 1 giờ = 60px, 1 phút = 1px
            let topPx = (now.getHours() * 60) + now.getMinutes();

            // Vẽ thanh đỏ
            let $indicator = $('<div class="current-time-indicator"></div>').css('top', topPx + 'px');
            $todayCol.append($indicator);
        }
    }

    // Gọi hàm cập nhật ngay lập tức khi load xong JS
    updateCurrentTimeIndicator();

    // Thiết lập tự động chạy lại hàm này mỗi 60 giây (60000 ms) mà không cần reload trang
    setInterval(updateCurrentTimeIndicator, 60000);

    // ==========================================
    // LOGIC CHUÔNG THÔNG BÁO (NOTIFICATION BELL)
    // ==========================================
    let globalAppointments = [];
    let dismissedNotifications = new Set();
    let currentNewNotifs = [];

    function getNotifyMinutes(notifyStr) {
        if (!notifyStr) return 0;
        if (notifyStr.includes("10 minutes")) return 10;
        if (notifyStr.includes("30 minutes")) return 30;
        if (notifyStr.includes("1 hour")) return 60;
        return 0;
    }

    function updateNotificationBell() {
        let now = new Date();
        let hasNew = false;
        let html = '';
        currentNewNotifs = []; // Reset danh sách new hiện tại

        // Sắp xếp các cuộc hẹn có thời gian bắt đầu gần nhất lên đầu
        let sortedAppts = [...globalAppointments].sort((a, b) => new Date(b.start) - new Date(a.start));

        let count = 0;
        sortedAppts.forEach(evt => {
            let mins = getNotifyMinutes(evt.notification);
            if (mins > 0) {
                count++;
                let startDt = new Date(evt.start);
                let notifyTime = new Date(startDt.getTime() - mins * 60000);

                // Hiện chấm đỏ nếu đã đến giờ thông báo và cuộc hẹn chưa bắt đầu (còn đang đếm ngược)
                let isNew = false;
                if (now >= notifyTime && now <= startDt) {
                    isNew = true;
                    if (!dismissedNotifications.has(evt.id)) {
                        hasNew = true;
                        currentNewNotifs.push(evt.id);
                    }
                }

                let typeStr = evt.visibility == 1 ? `Group Meeting${evt.teamName ? ' - ' + evt.teamName : ''}` : 'Private';
                let iconClass = evt.visibility == 1 ? 'fa-users' : 'fa-lock';

                html += `
                <li class="p-2 border-bottom" style="background-color: ${isNew && !dismissedNotifications.has(evt.id) ? '#f8f9fa' : '#fff'};">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="ms-2 me-auto">
                            <div class="fw-bold" style="font-size: 14px; color: ${evt.color};">
                                ${isNew && !dismissedNotifications.has(evt.id) ? '<span class="badge bg-danger me-1">New</span>' : ''}
                                ${evt.title || '(No title)'}
                            </div>
                            <div class="text-muted" style="font-size: 12px;">
                                <i class="fas ${iconClass} me-1"></i> ${typeStr}
                            </div>
                            <div class="text-muted mt-1" style="font-size: 12px;">
                                <i class="fas fa-clock me-1"></i> Bắt đầu: ${startDt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${startDt.toLocaleDateString()})
                            </div>
                        </div>
                        <span class="badge bg-light text-dark border ms-2" style="font-size: 11px; white-space: nowrap;">${evt.notification}</span>
                    </div>
                </li>
            `;
            }
        });

        if (count === 0) {
            html = '<li class="p-3 text-center text-muted">No notifications</li>';
        }

        $('#notification-list-container').html(html);

        if (hasNew) {
            $('#notification-badge').removeClass('d-none');
        } else {
            $('#notification-badge').addClass('d-none');
        }
    }

    // Kiểm tra định kỳ mỗi phút
    setInterval(function () {
        if (globalAppointments.length > 0) {
            updateNotificationBell();
        }
    }, 60000);

    // Khi click vào chuông thì ẩn dấu chấm đỏ và đánh dấu đã đọc
    $(document).on('click', '#notificationDropdown', function () {
        $('#notification-badge').addClass('d-none');
        currentNewNotifs.forEach(id => dismissedNotifications.add(id));
        // Xóa chữ "New" trên giao diện ngay lập tức
        $('#notification-list-container .badge.bg-danger').remove();
        // Bỏ màu nền
        $('#notification-list-container li').css('background-color', '#fff');
    });


    // ==========================================
    // CÁC HÀM HỖ TRỢ GIAO DIỆN TỪ BẢN 2
    // ==========================================
    function formatHour12(h) {
        if (h === 0) return "12AM";
        if (h === 12) return "12 PM";
        return h > 12 ? (h - 12) + " PM" : h + " AM";
    }

    function renderMonthInYearView(date, containerId) {
        const $container = $(containerId);
        $container.empty();

        const year = date.getFullYear();
        const month = date.getMonth();

        let firstDay = new Date(year, month, 1).getDay();
        let shiftIndex = (firstDay === 0) ? 6 : firstDay - 1;

        const lastDay = new Date(year, month + 1, 0).getDate();
        const prevLastDay = new Date(year, month, 0).getDate();

        let html = '<table class="mini-calendar-table w-100" style="text-align: center; border-collapse: separate; border-spacing: 0 2px;">';
        html += '<thead><tr><th>M</th><th>T</th><th>W</th><th>T</th><th>F</th><th>S</th><th>S</th></tr></thead>';
        html += '<tbody>';

        let days = [];
        for (let i = shiftIndex; i > 0; i--) days.push({ d: prevLastDay - i + 1, m: 'muted' });
        for (let i = 1; i <= lastDay; i++) days.push({ d: i, m: 'current' });
        while (days.length < 42) days.push({ d: days.length - lastDay - shiftIndex + 1, m: 'muted' });

        const today = new Date();

        for (let i = 0; i < days.length; i += 7) {
            html += '<tr>';
            days.slice(i, i + 7).forEach(dayObj => {
                let cls = dayObj.m === 'muted' ? 'text-muted' : '';
                let stateClass = '';

                if (dayObj.m === 'current') {
                    const isToday = (dayObj.d === today.getDate() && month === today.getMonth() && year === today.getFullYear());
                    const isSelected = (dayObj.d === currDate.getDate() && month === currDate.getMonth() && year === currDate.getFullYear());

                    if (isToday) {
                        stateClass = "current-day-circle";
                    } else if (isSelected) {
                        stateClass = "selected-day-light";
                    }
                }

                html += `<td style="padding: 0;">
                        <div class="year-day-cell ${cls} ${stateClass}" 
                             data-day="${dayObj.d}" 
                             data-month="${month}" 
                             data-year="${year}"
                             data-type="${dayObj.m}">
                            ${dayObj.d}
                        </div>
                    </td>`;
            });
            html += '</tr>';
        }
        html += '</tbody></table>';
        $container.append(html);
    }

    function renderColumnHeader($container, date) {
        let isToday = new Date().toDateString() === date.toDateString();
        $container.append(`
        <div class="day-header ${isToday ? 'active' : ''}">
            <div class="day-name">${date.toLocaleString('en-US', { weekday: 'short' }).toUpperCase()}</div>
            <div class="day-num">${date.getDate()}</div>
        </div>`);
    }

    $(document).on('click', '.year-day-cell, [data-date]', function () {
        const $this = $(this);
        let dateStr = $this.attr('data-date');
        let d, m, y;

        if (dateStr) {
            const parts = dateStr.split('-');
            y = parseInt(parts[0]);
            m = parseInt(parts[1]) - 1;
            d = parseInt(parts[2]);
        } else {
            d = $this.data('day');
            m = $this.data('month');
            y = $this.data('year');
        }

        if (!d || m === undefined || !y) return;
        currDate = new Date(y, m, d);

        if ($('#viewSelector').val() == 365) {
            $('#viewSelector').val(7);
        }

        if (typeof renderMainCalendar === "function") renderMainCalendar();
        if (typeof renderSidebarCalendar === "function") renderSidebarCalendar();
        else if (typeof updateMiniCalendar === "function") updateMiniCalendar();
    });
