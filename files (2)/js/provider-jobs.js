/**
 * FIXORA Provider Jobs - طلبات العمل
 * JavaScript كامل لصفحة طلبات العمل
 */

// ========== بيانات الحرفي ==========
let providerData = {
  name: "محمد أبو خالد",
  spec: "تكييف وأجهزة منزلية",
  isAvailable: true
};

// ========== بيانات الطلبات ==========
let jobsData = [
  { 
    id: 1, 
    title: "تصليح تكييف سبليت", 
    customer: "أحمد الكيلاني", 
    phone: "0791234567",
    area: "الشميساني، عمّان", 
    date: "اليوم 3:00 م", 
    price: 20, 
    status: "pending", 
    icon: "❄️",
    description: "المكيف لا يبرد بشكل جيد، يخرج هواء عادي فقط، ويعمل بشكل متقطع",
    address: "شارع المدينة المنورة، عمارة 15، طابق 3، شقة 5",
    serviceType: "تكييف وتبريد"
  },
  { 
    id: 2, 
    title: "تنظيف وصيانة تكييف", 
    customer: "رنا الشرايري", 
    phone: "0798765432",
    area: "عبدون، عمّان", 
    date: "غداً 10:00 ص", 
    price: 15, 
    status: "pending", 
    icon: "🌀",
    description: "تنظيف شامل للفلاتر، شحن غاز، وفحص عام للوحدة الخارجية",
    address: "عبدون الدوار الرابع، مجمع الشرايري التجاري، طابق 2",
    serviceType: "تكييف وتبريد"
  },
  { 
    id: 3, 
    title: "تصليح غسالة أتوماتيك", 
    customer: "سامر البطاينة", 
    phone: "0791122334",
    area: "الجبيهة، عمّان", 
    date: "غداً 2:00 م", 
    price: 25, 
    status: "pending", 
    icon: "🔌",
    description: "الغسالة لا تصرف الماء، وتصدر صوت غريب أثناء الدوران، وتتوقف فجأة",
    address: "الجبيهة - شارع الجامعة الأردنية، بناية 42",
    serviceType: "أجهزة منزلية"
  },
  { 
    id: 4, 
    title: "تصليح ثلاجة", 
    customer: "ليلى المصري", 
    phone: "0799988776",
    area: "ماركا، عمّان", 
    date: "بعد غد 11:00 ص", 
    price: 30, 
    status: "accepted", 
    icon: "🧊",
    description: "الثلاجة لا تبرد بشكل كافي، الثلج يتراكم في الفريزر",
    address: "ماركا الشمالية - شارع الأمير حمزة، عمارة 8",
    serviceType: "أجهزة منزلية"
  },
  { 
    id: 5, 
    title: "تركيب مكيف جديد", 
    customer: "عمر الزعبي", 
    phone: "0795544332",
    area: "طبربور، عمّان", 
    date: "الجمعة 9:00 ص", 
    price: 50, 
    status: "rejected", 
    icon: "❄️",
    description: "تركيب مكيف سبليت 18 وحدة مع توصيلات الكهرباء",
    address: "طبربور - دوار السعادة، شارع الاستقلال",
    serviceType: "تكييف وتبريد"
  }
];

let currentFilter = "all";
let pendingRejectId = null;

// ========== دالة عرض رسالة Toast ==========
function showToast(message, type = "success") {
  const toast = document.getElementById("fxrToast");
  if (!toast) return;
  toast.textContent = message;
  toast.className = `fxr-toast ${type} show`;
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// ========== إغلاق المودال ==========
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("show");
}

function closeDetailModal() {
  closeModal("detailModal");
}

function closeRejectModal() {
  closeModal("rejectModal");
  pendingRejectId = null;
}

// ========== تبديل حالة التوفر ==========
function toggleAvailability() {
  providerData.isAvailable = !providerData.isAvailable;
  const dotElements = document.querySelectorAll(".fxr-avail-dot");
  const labelElements = document.querySelectorAll("#topbarAvailLabel, #sidebarAvailLabel");
  
  dotElements.forEach(dot => {
    dot.style.background = providerData.isAvailable ? "#28c840" : "#7a8f96";
  });
  labelElements.forEach(label => {
    label.textContent = providerData.isAvailable ? "متاح الآن" : "غير متاح";
  });
  showToast(providerData.isAvailable ? "تم تغيير الحالة إلى متاح ✅" : "تم تغيير الحالة إلى غير متاح ⛔", "info");
}

// ========== الحصول على نص الحالة ==========
function getStatusText(status) {
  switch(status) {
    case "pending": return "⏳ بانتظار الرد";
    case "accepted": return "✅ مقبولة";
    case "rejected": return "❌ مرفوضة";
    default: return "";
  }
}

// ========== عرض قائمة الطلبات ==========
function renderJobsList() {
  let filteredJobs = jobsData;
  
  if (currentFilter === "pending") {
    filteredJobs = jobsData.filter(job => job.status === "pending");
  } else if (currentFilter === "accepted") {
    filteredJobs = jobsData.filter(job => job.status === "accepted");
  } else if (currentFilter === "rejected") {
    filteredJobs = jobsData.filter(job => job.status === "rejected");
  }
  
  const jobsContainer = document.getElementById("jobsListContainer");
  const jobsEmpty = document.getElementById("jobsEmpty");
  
  if (!jobsContainer) return;
  
  if (filteredJobs.length === 0) {
    jobsContainer.innerHTML = "";
    jobsEmpty.style.display = "block";
    return;
  }
  
  jobsEmpty.style.display = "none";
  
  const jobsHtml = filteredJobs.map(job => `
    <div class="fxr-job-card ${job.status}">
      <div class="fxr-job-icon">${job.icon}</div>
      <div class="fxr-job-info">
        <div class="fxr-job-title">${job.title}</div>
        <div class="fxr-job-details">${job.customer} · ${job.area} · ${job.date}</div>
        <div class="fxr-job-meta">
          <span class="fxr-job-price">${job.price} د.أ</span>
          <span class="fxr-job-status ${job.status}">${getStatusText(job.status)}</span>
        </div>
      </div>
      <div class="fxr-job-actions">
        ${job.status === "pending" ? `
          <button class="fxr-job-btn fxr-job-btn--accept" onclick="acceptJob(${job.id})">✅ قبول</button>
          <button class="fxr-job-btn fxr-job-btn--reject" onclick="openRejectModal(${job.id})">✗ رفض</button>
        ` : ''}
        <button class="fxr-job-btn fxr-job-btn--view" onclick="viewJobDetails(${job.id})">🔍 تفاصيل</button>
      </div>
    </div>
  `).join("");
  
  jobsContainer.innerHTML = jobsHtml;
  
  // تحديث العداد
  updateCounters();
}

// ========== تحديث العدادات ==========
function updateCounters() {
  const pendingCount = jobsData.filter(job => job.status === "pending").length;
  const acceptedCount = jobsData.filter(job => job.status === "accepted").length;
  const rejectedCount = jobsData.filter(job => job.status === "rejected").length;
  const totalCount = jobsData.length;
  
  const pendingBadge = document.getElementById("pendingBadge");
  const tabPendingBadge = document.getElementById("tabPendingBadge");
  const jobsSubtitle = document.getElementById("jobsSubtitle");
  const notifDot = document.getElementById("notifDot");
  
  if (pendingBadge) pendingBadge.textContent = pendingCount;
  if (tabPendingBadge) tabPendingBadge.textContent = pendingCount;
  if (notifDot) notifDot.textContent = pendingCount > 0 ? pendingCount : "";
  if (jobsSubtitle) {
    jobsSubtitle.textContent = pendingCount > 0 
      ? `📢 لديك ${pendingCount} طلبات جديدة تنتظر ردك` 
      : "✅ لا توجد طلبات جديدة";
  }
}

// ========== قبول الطلب ==========
function acceptJob(jobId) {
  const job = jobsData.find(j => j.id === jobId);
  if (job && job.status === "pending") {
    job.status = "accepted";
    renderJobsList();
    showToast(`✅ تم قبول طلب "${job.title}" بنجاح`, "success");
  }
}

// ========== فتح مودال الرفض ==========
function openRejectModal(jobId) {
  pendingRejectId = jobId;
  document.getElementById("rejectModal").classList.add("show");
}

// ========== تأكيد الرفض ==========
function confirmReject() {
  if (pendingRejectId) {
    const job = jobsData.find(j => j.id === pendingRejectId);
    if (job && job.status === "pending") {
      job.status = "rejected";
      renderJobsList();
      showToast(`❌ تم رفض طلب "${job.title}"`, "info");
    }
    pendingRejectId = null;
  }
  closeRejectModal();
}

// ========== عرض تفاصيل الطلب ==========
function viewJobDetails(jobId) {
  const job = jobsData.find(j => j.id === jobId);
  if (!job) return;
  
  const detailTitle = document.getElementById("detailTitle");
  const detailBody = document.getElementById("detailBody");
  const detailFoot = document.getElementById("detailFoot");
  
  if (detailTitle) detailTitle.textContent = `📋 ${job.title}`;
  
  detailBody.innerHTML = `
    <div class="fxr-detail-row">
      <span class="fxr-detail-label">👤 اسم العميل:</span>
      <span class="fxr-detail-value">${job.customer}</span>
    </div>
    <div class="fxr-detail-row">
      <span class="fxr-detail-label">📞 رقم الجوال:</span>
      <span class="fxr-detail-value">${job.phone}</span>
    </div>
    <div class="fxr-detail-row">
      <span class="fxr-detail-label">📍 المنطقة:</span>
      <span class="fxr-detail-value">${job.area}</span>
    </div>
    <div class="fxr-detail-row">
      <span class="fxr-detail-label">🏠 العنوان التفصيلي:</span>
      <span class="fxr-detail-value">${job.address || "غير محدد"}</span>
    </div>
    <div class="fxr-detail-row">
      <span class="fxr-detail-label">📅 الموعد المطلوب:</span>
      <span class="fxr-detail-value">${job.date}</span>
    </div>
    <div class="fxr-detail-row">
      <span class="fxr-detail-label">💰 السعر المقترح:</span>
      <span class="fxr-detail-value">${job.price} دينار أردني</span>
    </div>
    <div class="fxr-detail-row">
      <span class="fxr-detail-label">🔧 نوع الخدمة:</span>
      <span class="fxr-detail-value">${job.serviceType || "غير محدد"}</span>
    </div>
    <div class="fxr-detail-row">
      <span class="fxr-detail-label">📝 وصف المشكلة:</span>
      <span class="fxr-detail-value">${job.description || "لا يوجد وصف"}</span>
    </div>
    <div class="fxr-detail-row">
      <span class="fxr-detail-label">📊 حالة الطلب:</span>
      <span class="fxr-detail-value">${getStatusText(job.status)}</span>
    </div>
  `;
  
  if (job.status === "pending") {
    detailFoot.innerHTML = `
      <button class="fxr-btn fxr-btn--outline" onclick="closeDetailModal()">إغلاق</button>
      <button class="fxr-btn fxr-btn--primary" onclick="acceptJob(${job.id}); closeDetailModal();">✅ قبول الطلب</button>
      <button class="fxr-btn fxr-btn--danger" onclick="openRejectModal(${job.id}); closeDetailModal();">✗ رفض الطلب</button>
    `;
  } else {
    detailFoot.innerHTML = `
      <button class="fxr-btn fxr-btn--outline" onclick="closeDetailModal()">إغلاق</button>
      ${job.status === "accepted" ? '<button class="fxr-btn fxr-btn--primary" onclick="showToast(\'سيتم التواصل مع العميل قريباً\',\'info\'); closeDetailModal();">📞 تواصل مع العميل</button>' : ''}
    `;
  }
  
  document.getElementById("detailModal").classList.add("show");
}

// ========== تبديل الفلتر ==========
function setFilter(filter) {
  currentFilter = filter;
  
  // تحديث التبويبات
  document.querySelectorAll(".fxr-jtab").forEach(tab => {
    tab.classList.remove("fxr-jtab--active");
    if (tab.getAttribute("data-filter") === filter) {
      tab.classList.add("fxr-jtab--active");
    }
  });
  
  renderJobsList();
}

// ========== تهيئة القائمة الجانبية ==========
function initSidebar() {
  const hamburger = document.getElementById("hamburgerBtn");
  const sidebar = document.getElementById("fxrSidebar");
  
  if (hamburger && sidebar) {
    hamburger.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });
  }
  
  // إغلاق السايدبار عند النقر على رابط (للموبايل)
  document.querySelectorAll(".fxr-nav-link").forEach(link => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 768) {
        sidebar.classList.remove("open");
      }
    });
  });
  
  // زر الخروج
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      showToast("👋 تم تسجيل الخروج بنجاح", "success");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1000);
    });
  }
  
  // زر الإشعارات
  const notifBtn = document.getElementById("notifBtn");
  if (notifBtn) {
    notifBtn.addEventListener("click", () => {
      const pendingCount = jobsData.filter(job => job.status === "pending").length;
      if (pendingCount > 0) {
        showToast(`🔔 لديك ${pendingCount} طلبات جديدة تنتظر ردك`, "info");
        setFilter("pending");
      } else {
        showToast("🔔 لا توجد إشعارات جديدة", "info");
      }
    });
  }
}

// ========== تحديث أسماء الحرفي ==========
function updateProviderNames() {
  const nameElements = [
    "sidebarName", "topbarName"
  ];
  
  nameElements.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = providerData.name;
  });
  
  const specEl = document.getElementById("sidebarSpec");
  if (specEl) specEl.textContent = providerData.spec;
}

// ========== ربط أحداث التبويبات ==========
function bindTabEvents() {
  document.querySelectorAll(".fxr-jtab").forEach(tab => {
    tab.addEventListener("click", () => {
      const filter = tab.getAttribute("data-filter");
      setFilter(filter);
    });
  });
  
  // زر تأكيد الرفض
  const confirmRejectBtn = document.getElementById("confirmRejectBtn");
  if (confirmRejectBtn) {
    confirmRejectBtn.addEventListener("click", confirmReject);
  }
}

// ========== بدء التطبيق ==========
document.addEventListener("DOMContentLoaded", () => {
  initSidebar();
  updateProviderNames();
  bindTabEvents();
  renderJobsList();
});