// ==========================================
// THEO DÕI CHUỘT CHO HIỆU ỨNG VIRTUAL (SPOTLIGHT)
// ==========================================
document.body.onpointermove = event => {
    const { clientX, clientY } = event;
    const blob = document.getElementById("glow-blob");
    if(blob) {
        blob.animate({ left: `${clientX}px`, top: `${clientY}px` }, { duration: 3000, fill: "forwards" });
    }
    const cards = document.getElementsByClassName("magic-card");
    for(const card of cards) {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mouse-x", `${clientX - rect.left}px`);
        card.style.setProperty("--mouse-y", `${clientY - rect.top}px`);
    }
};

// ==========================================
// DỮ LIỆU MÔ PHỎNG & CẤU HÌNH LOCAL STORAGE
// ==========================================
const defaultTickets = [
    { id: "TKT-01", name: "Trần Dần", issue: "Lỗi thanh toán Momo", priority: 5, status: "New" },
    { id: "TKT-02", name: "Trần Huấn Hoa Hồng", issue: "Quên mật khẩu cấp 2", priority: 1, status: "New" },
    { id: "TKT-03", name: "Phạm Chi Dân", issue: "Sập server chi nhánh", priority: 99, status: "New" },
    { id: "TKT-04", name: "NPC Trần Bình", issue: "Hỏi về gói cước 4G", priority: 5, status: "New" }, 
    { id: "TKT-05", name: "Miêu Lê", issue: "Không nhận được mã OTP", priority: 4, status: "New" }
];

let tickets = JSON.parse(localStorage.getItem('dasa_tickets')) || defaultTickets;

function saveTicketsToStorage() {
    localStorage.setItem('dasa_tickets', JSON.stringify(tickets));
}

const spamKeywords = ["khuyến mãi", "trúng thưởng", "lừa đảo", "spam"];

let templates = [
    { key: "vui", text: "Vui lòng cung cấp mã đơn hàng/SĐT để chúng tôi kiểm tra." },
    { key: "vui lòng", text: "Vui lòng chờ trong giây lát, nhân viên đang xử lý." },
    { key: "xin c", text: "Xin chào, chúng tôi đã tiếp nhận yêu cầu hỗ trợ." },
    { key: "lỗi t", text: "Lỗi thanh toán đang được khắc phục, vui lòng thử lại sau." },
    { key: "lỗi t", text: "Lỗi thẻ ngân hàng, vui lòng liên hệ ngân hàng phát hành." }
];

let prevHash = localStorage.getItem('dasa_prevHash') || "0X0000"; 

// ==========================================
// NHẬP TICKET & LỌC TỪ KHÓA/TRÙNG LẶP
// ==========================================
function submitNewTicket() {
    let id = document.getElementById("newId").value.trim().toUpperCase();
    let name = document.getElementById("newName").value.trim();
    let issue = document.getElementById("newIssue").value.trim();
    let priority = parseInt(document.getElementById("newPriority").value);

    if(!id || !name || !issue) {
        showAlert("THIẾU DỮ LIỆU", "Vui lòng nhập đầy đủ thông tin Ticket.");
        return;
    }

    let issueLower = issue.toLowerCase();

    for (let word of spamKeywords) {
        if (issueLower.includes(word)) {
            addLog(`TỪ CHỐI TICKET: Chứa từ khóa cấm [${word}]`, "BỘ_LỌC_TỪ_KHÓA");
            showAlert("TỪ CHỐI TIẾP NHẬN", `Nội dung chứa từ khóa cấm: "${word}". Yêu cầu đã bị hủy bỏ!`);
            return;
        }
    }

    let isDuplicate = tickets.some(t => t.status !== "Solved" && t.issue.toLowerCase() === issueLower);
    if (isDuplicate) {
        addLog(`TỪ CHỐI TICKET: Phát hiện nội dung trùng lặp`, "BỘ_LỌC_TRÙNG_LẶP");
        showAlert("PHÁT HIỆN TRÙNG LẶP", "Sự cố này đang nằm trong hàng chờ rồi. Vui lòng không spam nhiều lần!");
        return;
    }

    if (tickets.some(t => t.id === id)) {
        showAlert("LỖI MÃ TICKET", "Mã Ticket ID này đã tồn tại trong lịch sử. Vui lòng chọn ID khác.");
        return;
    }

    tickets.push({ id, name, issue, priority, status: "New" });
    saveTicketsToStorage(); 
    
    document.getElementById("newId").value = "";
    document.getElementById("newName").value = "";
    document.getElementById("newIssue").value = "";
    document.getElementById("newPriority").value = "1";

    addLog(`THÊM MỚI TICKET: Đã lưu ${id} thành công`, "HỆ_THỐNG");
    renderHeap();
}

function showAlert(title, message) {
    document.getElementById("alertTitle").innerText = title;
    document.getElementById("alertMessage").innerText = message;
    
    let modal = document.getElementById("alertModal");
    modal.classList.remove("hidden");
    setTimeout(() => { modal.classList.add("modal-active"); }, 10);
}

function closeAlert() {
    let modal = document.getElementById("alertModal");
    modal.classList.remove("modal-active");
    setTimeout(() => { modal.classList.add("hidden"); }, 300);
}

// ==========================================
// TRA CỨU TICKET, LEO THANG & SỬA LÉN DỮ LIỆU
// ==========================================
function searchTicket() {
    let searchId = document.getElementById("searchInput").value.trim().toUpperCase();
    let resultBox = document.getElementById("searchResult");
    let found = tickets.find(t => t.id === searchId);
    
    resultBox.classList.remove("hidden", "fade-in");
    void resultBox.offsetWidth; 
    resultBox.classList.add("fade-in");
    
    if (found) {
        let isSolved = (found.status === "Solved");
        let statusColor = isSolved ? "text-emerald-400" : "text-amber-400";
        
        let escalateBtnHTML = isSolved 
            ? `<button disabled class="cyber-btn bg-slate-800 text-slate-500 border border-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-not-allowed" title="Ticket này đã xử lý xong">
                   <i class="fas fa-ban mr-1"></i> ĐÃ XỬ LÝ
               </button>`
            : `<button onclick="escalateTicket('${found.id}')" class="cyber-btn bg-amber-950 text-amber-400 border border-amber-500/50 hover:bg-amber-900 text-[10px] font-bold px-3 py-1.5 rounded-lg transition" title="Đẩy lên mức ưu tiên cao nhất">
                   <i class="fas fa-arrow-up mr-1"></i> LEO THANG
               </button>`;
        
        resultBox.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <div class="text-cyan-400 font-mono mb-2 font-bold"><i class="fas fa-check-square mr-1"></i> [ ĐÃ TÌM THẤY ]</div>
                    <div class="mb-1 text-slate-300"><span class="w-20 inline-block font-mono text-slate-500">Khách:</span> <span class="font-bold text-white">${found.name}</span></div>
                    <div class="mb-1 text-slate-300"><span class="w-20 inline-block font-mono text-slate-500">Sự cố:</span> <span class="truncate inline-block w-32 align-bottom" title="${found.issue}">${found.issue}</span></div>
                    <div class="mb-1 text-slate-300"><span class="w-20 inline-block font-mono text-slate-500">Trạng thái:</span> <span class="font-bold ${statusColor} uppercase">${found.status}</span></div>
                    <div class="mb-1"><span class="w-20 inline-block font-mono text-slate-500">Ưu tiên:</span> <span class="bg-rose-900/50 text-rose-400 border border-rose-500/50 px-2 py-0.5 rounded text-xs font-bold font-mono">Mức ${found.priority}</span></div>
                </div>
                <div class="flex flex-col gap-2">
                    ${escalateBtnHTML}
                    <button onclick="tamperTicket('${found.id}')" class="cyber-btn bg-red-950 text-red-400 border border-red-500/50 hover:bg-red-900 text-[10px] font-bold px-3 py-1.5 rounded-lg transition" title="Giả lập nhân viên sửa lén trạng thái Ticket">
                        <i class="fas fa-bug mr-1"></i> SỬA DỮ LIỆU
                    </button>
                </div>
            </div>
        `;
        addLog(`TRA CỨU MÃ TICKET: ${searchId}`, "NHÂN_VIÊN_01");
    } else {
        resultBox.innerHTML = `<div class="text-rose-500 font-mono"><i class="fas fa-exclamation-triangle mr-1"></i> [ LỖI: KHÔNG TÌM THẤY ]</div>`;
    }
}

function escalateTicket(id) {
    let target = tickets.find(t => t.id === id);
    if(target && target.status !== "Solved") {
        target.priority = 999; 
        saveTicketsToStorage(); 

        addLog(`NÂNG CẤP ƯU TIÊN MÃ ${id} LÊN MỨC 999`, "QUẢN_TRỊ_VIÊN");
        renderHeap(); 
        searchTicket(); 
    }
}

function tamperTicket(id) {
    let target = tickets.find(t => t.id === id);
    if(target) {
        let fakeStatus = prompt(`[GIẢ LẬP GIAN LẬN] Bạn đang hack vào bộ nhớ để sửa lén trạng thái của Ticket ${id}.\nNhập trạng thái giả mạo (Ví dụ: Solved hoặc New):`, target.status);
        
        if (fakeStatus && fakeStatus !== target.status) {
            target.status = fakeStatus; 
            saveTicketsToStorage(); 
            
            showAlert("CẢNH BÁO XÂM NHẬP HỆ THỐNG", `Phát hiện dữ liệu của ${id} bị sửa đổi trái phép thành "${fakeStatus}".\nChuỗi Hash không khớp, xác nhận có gian lận SLA!`);
            addLog(`CẢNH BÁO: PHÁT HIỆN DỮ LIỆU TICKET ${id} BỊ CAN THIỆP!`, "KẺ_TẤN_CÔNG", true);
            
            searchTicket(); 
            renderHeap(); 
        }
    }
}

// ==========================================
// HÀNG CHỜ XỬ LÝ (MÔ PHỎNG MAX-HEAP MC2)
// ==========================================
function renderHeap() {
    let activeTickets = tickets.filter(t => t.status !== "Solved");

    activeTickets.sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return a.id.localeCompare(b.id);
    });

    document.getElementById("ticketCount").innerText = `Đang chờ: ${activeTickets.length}`;
    let queueBox = document.getElementById("heapQueue");
    queueBox.innerHTML = "";
    
    if(activeTickets.length === 0) {
        queueBox.innerHTML = '<div class="text-slate-600 font-mono text-center py-10"><i class="fas fa-hdd text-4xl mb-3 block opacity-50"></i>[ HÀNG CHỜ TRỐNG ]</div>';
        return;
    }

    activeTickets.forEach((t, index) => {
        let isTop = index === 0;
        let borderClass = isTop ? "border-l-4 border-rose-500 bg-rose-950/30" : "border-l-4 border-slate-700 bg-slate-900/50";
        let iconClass = isTop ? "text-rose-500 animate-pulse" : "text-slate-500";
        let textGlow = isTop ? "text-white neon-text" : "text-slate-300";
        
        queueBox.innerHTML += `
            <div class="${borderClass} p-3 rounded-xl flex justify-between items-center slide-up border border-slate-800 backdrop-blur-sm relative z-20 hover:bg-slate-800 transition">
                <div class="overflow-hidden">
                    <div class="font-bold font-mono ${textGlow}">
                        ${t.id} <span class="text-[10px] bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded-sm ml-1 text-slate-400 whitespace-nowrap">${t.name}</span>
                    </div>
                    <div class="text-xs text-slate-400 mt-1 truncate w-40 lg:w-56" title="${t.issue}">${t.issue}</div>
                </div>
                <div class="text-center bg-slate-950 border border-slate-800 px-2 py-1 rounded-lg shrink-0 ml-2">
                    <i class="fas fa-fire ${iconClass}"></i>
                    <div class="text-[10px] font-bold mt-1 text-slate-400 font-mono">Mức ${t.priority}</div>
                </div>
            </div>
        `;
    });
}

function extractMax() {
    let activeTickets = tickets.filter(t => t.status !== "Solved");
    if (activeTickets.length === 0) return;
    
    activeTickets.sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return a.id.localeCompare(b.id);
    });

    let extracted = activeTickets[0]; 
    extracted.status = "Solved"; 
    saveTicketsToStorage(); 
    
    addLog(`CHUYỂN TRẠNG THÁI TICKET ${extracted.id} THÀNH SOLVED`, "HỆ_THỐNG");
    
    renderHeap(); 
    
    let searchId = document.getElementById("searchInput").value.trim().toUpperCase();
    if(searchId === extracted.id) {
        searchTicket();
    }
}

// ==========================================
// GỢI Ý MẪU TRẢ LỜI (YC3)
// ==========================================
function suggestWords() {
    let input = document.getElementById("replyInput").value.toLowerCase();
    let box = document.getElementById("suggestBox");
    box.innerHTML = "";
    if (input.length < 2) return;

    let matches = templates.filter(t => t.key.startsWith(input));
    matches.forEach(m => {
        box.innerHTML += `
            <div class="text-[11px] lg:text-xs bg-fuchsia-950/30 text-fuchsia-300 p-2.5 rounded-lg cursor-pointer hover:bg-fuchsia-900/50 border border-fuchsia-900/50 transition slide-up relative z-20 leading-tight"
                 onclick="insertText('${m.text}')">
                <i class="fas fa-terminal mr-2 opacity-70"></i>${m.text}
            </div>
        `;
    });
}

function insertText(text) {
    document.getElementById("replyInput").value = text;
    document.getElementById("suggestBox").innerHTML = "";
    addLog("SỬ DỤNG GỢI Ý MẪU CÂU TỰ ĐỘNG", "NHÂN_VIÊN_01");
}

// ==========================================
// NHẬT KÝ HỆ THỐNG & GIẢ LẬP TẤN CÔNG (YC1)
// ==========================================
function addLog(action, user, isHack = false) {
    let logBox = document.getElementById("auditLog");
    let now = new Date();
    let time = now.getHours().toString().padStart(2, '0') + ":" + 
               now.getMinutes().toString().padStart(2, '0') + ":" + 
               now.getSeconds().toString().padStart(2, '0');
               
    let currHash = '0X' + Math.random().toString(16).substring(2, 8).toUpperCase();

    let bgClass = isHack ? "bg-red-950/80 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]" : "bg-slate-900/80 border-amber-900/50 shadow-[0_0_15px_rgba(245,158,11,0.05)]";
    let textClass = isHack ? "text-red-400" : "text-amber-500";
    let lineClass = isHack ? "border-red-900" : "border-slate-800";
    let chainColor = isHack ? "#ef4444" : "#f59e0b"; 

    let nodeHTML = `
        <div class="${bgClass} p-4 rounded-xl slide-up relative border backdrop-blur-sm z-20" style="margin-top: 16px;">
            <div class="absolute -top-4 left-4 h-4 w-0.5" style="background-color: ${chainColor}; box-shadow: 0 0 5px ${chainColor}; opacity: 0.7;"></div>
            
            <div class="text-[10px] ${textClass} mb-1.5 font-mono flex items-center">
                <i class="fas fa-link mr-1"></i> Previous Hash: ${prevHash}
            </div>
            <div class="text-[13px] font-bold ${isHack ? 'text-red-300' : 'text-slate-200'} mb-2 font-mono tracking-wide leading-tight">${action}</div>
            <div class="text-[11px] text-slate-400 flex justify-between border-t ${lineClass} pt-2 font-mono">
                <span>> ${user}</span>
                <span>[${time}]</span>
            </div>
            <div class="text-[10px] ${textClass} mt-2 font-mono text-right ${isHack ? 'bg-red-950 border-red-900' : 'bg-slate-950 border-amber-900/50'} border p-1.5 rounded">
                Current Hash: ${currHash}
            </div>
        </div>
    `;
    
    logBox.insertAdjacentHTML('afterbegin', nodeHTML);
    logBox.firstElementChild.querySelector('.absolute').style.display = 'none';
    
    prevHash = currHash; 
    
    localStorage.setItem('dasa_logs', logBox.innerHTML);
    localStorage.setItem('dasa_prevHash', prevHash);
}

function simulateHack() {
    showAlert("CẢNH BÁO XÂM NHẬP", "Phát hiện có hành vi can thiệp từ bên ngoài vào Cơ sở dữ liệu.");
    addLog("CẢNH BÁO: PHÁT HIỆN THAY ĐỔI DỮ LIỆU TRÁI PHÉP TẠI KHỐI 0XF9E2A!", "KẺ_TẤN_CÔNG", true);
}

// ==========================================
// HÀM RESET HỆ THỐNG
// ==========================================
function resetSystem() {
    let confirmReset = confirm("⚠️ XÁC NHẬN HỦY DỮ LIỆU\nBạn có chắc chắn muốn xóa toàn bộ Ticket và Nhật ký để quay về trạng thái dữ liệu mẫu ban đầu không?");
    if (confirmReset) {
        localStorage.clear();
        window.location.reload();
    }
}

// ==========================================
// KHỞI CHẠY LÚC LOAD TRANG
// ==========================================
window.onload = function() {
    let savedLogs = localStorage.getItem('dasa_logs');
    if (savedLogs) {
        document.getElementById("auditLog").innerHTML = savedLogs;
    } else {
        addLog("KHỞI ĐỘNG HỆ THỐNG THÀNH CÔNG", "ROOT");
    }
    renderHeap();
};
