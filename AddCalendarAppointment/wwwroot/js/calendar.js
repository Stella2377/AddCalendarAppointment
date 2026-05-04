// wwwroot/js/calendar.js

$(document).ready(function () {
    // --- KHỞI TẠO BIẾN TOÀN CỤC ---
    let clipboard = null; // Lưu trữ trạng thái copy/cut: { eventId, action: 'copy'|'cut', $element }
    let $selectedEvent = null; // Block event đang được focus
    let targetDropTime = null; // Lưu thời gian/vị trí trên grid khi click để chuẩn bị Paste
    loadAppointments();
    // Khởi tạo Bootstrap Tooltips (Hiển thị Tooltip khi Hover)
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

    // ==========================================
    // 1. TƯƠNG TÁC KÉO THẢ (DRAG & DROP)
    // ==========================================

    // Gắn thuộc tính draggable cho các appointment blocks
    $('.appointment-block').attr('draggable', 'true');

    // Bắt sự kiện bắt đầu kéo
    $(document).on('dragstart', '.appointment-block', function (e) {
        const eventId = $(this).data('id');
        e.originalEvent.dataTransfer.setData('text/plain', eventId);
        e.originalEvent.dataTransfer.effectAllowed = 'move';
        $(this).css('opacity', '0.5'); // Làm mờ block đang kéo
    });

    $(document).on('dragend', '.appointment-block', function (e) {
        $(this).css('opacity', '1'); // Khôi phục UI sau khi thả
    });

    // Cho phép thả vào các cột ngày (day-col)
    $('.day-col').on('dragover', function (e) {
        e.preventDefault(); // Cần thiết để cho phép drop
        e.originalEvent.dataTransfer.dropEffect = 'move';
    });

    // Xử lý khi thả block (Drop)
    $('.day-col').on('drop', function (e) {
        e.preventDefault();
        const eventId = e.originalEvent.dataTransfer.getData('text/plain');
        const $draggedEvent = $(`.appointment-block[data-id='${eventId}']`);

        // Tính toán thời gian thả dựa vào tọa độ Y (offsetY)
        // Quy ước: 1 giờ = 60px. Vị trí thả chia cho 60 ra số giờ.
        const offsetY = e.offsetY;
        const startHour = Math.floor(offsetY / 60);
        const startMinute = (offsetY % 60) < 30 ? 0 : 30; // Làm tròn mỗi 30 phút
        const targetDate = $(this).data('date'); // Thuộc tính data-date của cột

        // Gọi AJAX cập nhật Backend
        updateAppointmentTime(eventId, targetDate, startHour, startMinute, function (success) {
            if (success) {
                // Di chuyển UI
                $draggedEvent.appendTo(e.currentTarget);
                $draggedEvent.css('top', `${(startHour * 60) + startMinute}px`);
            } else {
                alert("Lỗi: Không được phép tạo lịch chồng lấn!");
            }
        });
    });

    // ==========================================
    // 2. PHÍM TẮT (CTRL + C, CTRL + X, CTRL + V)
    // ==========================================

    // Chọn event khi click
    $(document).on('click', '.appointment-block', function (e) {
        e.stopPropagation();
        $('.appointment-block').removeClass('border border-dark shadow-lg'); // Xóa focus cũ
        $selectedEvent = $(this);
        $selectedEvent.addClass('border border-dark shadow-lg'); // Highlight event được chọn
    });

    // Chọn ô grid để set target Paste
    $(document).on('click', '.day-col', function (e) {
        const offsetY = e.offsetY;
        targetDropTime = {
            date: $(this).data('date'),
            hour: Math.floor(offsetY / 60),
            minute: (offsetY % 60) < 30 ? 0 : 30,
            $column: $(this)
        };
        // Bỏ focus event
        $('.appointment-block').removeClass('border border-dark shadow-lg');
        $selectedEvent = null;
    });

    // Bắt phím tắt
    $(document).on('keydown', function (e) {
        // Nếu không focus vào thẻ input/textarea nào
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

        if (e.ctrlKey) {
            const key = e.key.toLowerCase();

            // Ctrl + C (Copy)
            if (key === 'c' && $selectedEvent) {
                clipboard = { eventId: $selectedEvent.data('id'), action: 'copy', $el: $selectedEvent };
                $('.appointment-block').css('opacity', '1'); // reset opacity
                console.log("Copied event: " + clipboard.eventId);
            }
            // Ctrl + X (Cut)
            else if (key === 'x' && $selectedEvent) {
                clipboard = { eventId: $selectedEvent.data('id'), action: 'cut', $el: $selectedEvent };
                $('.appointment-block').css('opacity', '1');
                $selectedEvent.css('opacity', '0.4'); // Làm mờ event bị cut
                console.log("Cut event: " + clipboard.eventId);
            }
            // Ctrl + V (Paste)
            else if (key === 'v' && clipboard && targetDropTime) {
                if (clipboard.action === 'copy') {
                    // Gọi API duplicate
                    duplicateAppointment(clipboard.eventId, targetDropTime, function (newId) {
                        if (newId) {
                            let $clone = clipboard.$el.clone();
                            $clone.attr('data-id', newId);
                            $clone.css('top', `${(targetDropTime.hour * 60) + targetDropTime.minute}px`);
                            targetDropTime.$column.append($clone);
                        }
                    });
                } else if (clipboard.action === 'cut') {
                    // Gọi API update (move)
                    updateAppointmentTime(clipboard.eventId, targetDropTime.date, targetDropTime.hour, targetDropTime.minute, function (success) {
                        if (success) {
                            clipboard.$el.css('top', `${(targetDropTime.hour * 60) + targetDropTime.minute}px`);
                            targetDropTime.$column.append(clipboard.$el);
                            clipboard.$el.css('opacity', '1'); // Khôi phục mờ
                            clipboard = null; // Xóa clipboard sau khi move
                        }
                    });
                }
            }
        }
    });

    // ==========================================
    // 3. CHI TIẾT SỰ KIỆN (DOUBLE CLICK & 3-DOT DUPLICATE)
    // ==========================================

    $(document).on('dblclick', '.appointment-block', function (e) {
        const eventId = $(this).data('id');
        openDetailsModal(eventId);
    });

    // Giả lập nút 3 chấm Duplicate trong Modal
    $('#btnDuplicateEvent').on('click', function () {
        const eventId = $('#detailModal').data('current-id');
        // Duplicate mặc định sang ngày hôm sau
        let tmr = new Date(); tmr.setDate(tmr.getDate() + 1);
        let dropT = { date: tmr.toISOString().split('T')[0], hour: 9, minute: 0 };
        duplicateAppointment(eventId, dropT, function () {
            alert("Đã Duplicate sự kiện!");
            location.reload(); // Reload lịch để thấy event mới
        });
    });

    // ==========================================
    // 4. PHẢN HỒI GUEST (PENDING / MAYBE / ACCEPT)
    // ==========================================

    $(document).on('click', '.event-pending, .event-maybe', function (e) {
        e.stopPropagation();
        const $event = $(this);
        const eventId = $event.data('id');

        // Tạo context menu (popup mini) tại vị trí click
        $('.guest-action-popup').remove(); // Xóa popup cũ

        const popupHtml = `
            <div class="guest-action-popup shadow rounded bg-white p-2" style="position:absolute; top:${e.pageY}px; left:${e.pageX}px; z-index:1000; display:flex; gap:5px;">
                <button class="btn btn-sm btn-success btn-accept" data-id="${eventId}">Accept</button>
                <button class="btn btn-sm btn-secondary btn-maybe" data-id="${eventId}">Maybe</button>
                <button class="btn btn-sm btn-danger btn-deny" data-id="${eventId}">Deny</button>
            </div>
        `;
        $('body').append(popupHtml);

        // Xử lý logic click trên popup
        $('.guest-action-popup button').on('click', function () {
            const status = $(this).text(); // Accept, Maybe, Deny
            const id = $(this).data('id');

            updateGuestStatus(id, status, function () {
                // UI Update ngay lập tức
                if (status === 'Accept') {
                    $event.removeClass('event-pending event-maybe');
                    $event.css({ 'border': 'none', 'opacity': '1' });
                } else if (status === 'Maybe') {
                    $event.removeClass('event-pending').addClass('event-maybe');
                    $event.css({ 'border': 'none', 'opacity': '0.5' });
                } else if (status === 'Deny') {
                    $event.remove(); // Xóa khỏi UI
                }
                $('.guest-action-popup').remove();
            });
        });
    });

    // Xóa popup khi click ra ngoài
    $(document).on('click', function () {
        $('.guest-action-popup').remove();
    });

});

// ==========================================
// CÁC HÀM GỌI AJAX (BACKEND GIAO TIẾP)
// ==========================================

function loadAppointments() {
    $.ajax({
        url: '/api/Appointment/GetAppointments', // Đường dẫn API ta vừa tạo ở Controller
        type: 'GET',
        success: function (data) {
            // Xóa hết các event giả lập tĩnh (hardcode HTML) trên giao diện trước khi render
            $('.appointment-block').remove();

            data.forEach(function (evt) {
                let dateStr = evt.start.split('T')[0]; // Lấy phần ngày "YYYY-MM-DD"
                let startDate = new Date(evt.start);

                // Tính toán vị trí Y trên lưới (1 giờ = 60px)
                let topPx = (startDate.getHours() * 60) + startDate.getMinutes();

                // Tìm cột ngày tương ứng với event
                let $column = $(`.day-col[data-date='${dateStr}']`);

                if ($column.length > 0) {
                    // Render block HTML và nhúng thuộc tính draggable để tương thích với Drag & Drop hiện tại
                    let blockHtml = `
                        <div class="appointment-block p-1 bg-primary text-white rounded shadow-sm" 
                             data-id="${evt.id}" 
                             draggable="true" 
                             style="position: absolute; top: ${topPx}px; width: 95%; z-index: 10; cursor: grab;">
                            <small>${evt.title}</small>
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

function updateGuestStatus(appointmentId, status, callback) {
    // Ánh xạ chuỗi sang Enum
    let statusCode = status === 'Accept' ? 1 : (status === 'Deny' ? 2 : 3);

    $.ajax({
        url: `/api/appointment/${appointmentId}/guest-status`,
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({ Status: statusCode }),
        success: function () {
            callback();
        },
        error: function () {
            alert('Không thể cập nhật trạng thái');
        }
    });
}