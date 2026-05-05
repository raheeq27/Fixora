/**
 * FIXORA Provider Profile Edit - إدارة البروفايل
 * JavaScript كامل لصفحة إدارة البروفايل
 */

// ========== بيانات الحرفي ==========
let providerData = {
  firstName: "محمد",
  lastName: "أبو خالد",
  fullName: "محمد أبو خالد",
  phone: "0791234567",
  email: "mohammad@fixora.jo",
  bio: "فني تكييف وتبريد بخبرة 8 سنوات في الأردن. متخصص في جميع أنواع التكييف والأجهزة المنزلية. أقدم خدمة ممتازة بأسعار منافسة.",
  spec: "ac",
  gov: "amman",
  areas: "الشميساني، عبدون، الجبيهة، الدوار السابع، مرج الحمام",
  priceMin: 15,
  priceMax: 30,
  rating: 4.9,
  reviewsCount: 112,
  avatar: "👨‍🔧"
};

// ========== الخدمات الفرعية ==========
let subServices = [
  { id: 1, name: "تكييف سبليت", checked: true },
  { id: 2, name: "تكييف مركزي", checked: true },
  { id: 3, name: "ثلاجات", checked: true },
  { id: 4, name: "غسالات", checked: true },
  { id: 5, name: "سخانات مياه", checked: false },
  { id: 6, name: "مجففات", checked: false },
  { id: 7, name: "شفاطات مطبخ", checked: false },
  { id: 8, name: "أفران كهربائية", checked: false }
];

// ========== الجدول الأسبوعي ==========
let weeklyScheduleData = [
  { day: "الأحد", from: "08:00", to: "20:00", enabled: true },
  { day: "الاثنين", from: "08:00", to: "20:00", enabled: true },
  { day: "الثلاثاء", from: "08:00", to: "20:00", enabled: true },
  { day: "الأربعاء", from: "08:00", to: "20:00", enabled: true },
  { day: "الخميس", from: "08:00", to: "20:00", enabled: true },
  { day: "الجمعة", from: "09:00", to: "16:00", enabled: false },
  { day: "السبت", from: "09:00", to: "16:00", enabled: true }
];

// ========== معرض الصور ==========
let galleryImagesData = [
  { id: 1, emoji: "❄️" },
  { id: 2, emoji: "🔧" },
  { id: 3, emoji: "⚙️" },
  { id: 4, emoji: "🌀" },
  { id: 5, emoji: "📱" }
];

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

// ========== تبديل التبويبات ==========
function initProfileTabs() {
  const tabs = document.querySelectorAll(".fxr-ptab");
  const panels = document.querySelectorAll(".fxr-ppanel");
  
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const tabId = tab.getAttribute("data-tab");
      tabs.forEach(t => t.classList.remove("fxr-ptab--active"));
      tab.classList.add("fxr-ptab--active");
      panels.forEach(panel => panel.classList.add("fxr-ppanel--hidden"));
      const activePanel = document.getElementById(`tab-${tabId}`);
      if (activePanel) activePanel.classList.remove("fxr-ppanel--hidden");
    });
  });
}

// ========== تحميل البيانات الأساسية ==========
function loadBasicData() {
  document.getElementById("firstName").value = providerData.firstName;
  document.getElementById("lastName").value = providerData.lastName;
  document.getElementById("phoneNum").value = providerData.phone;
  document.getElementById("emailAddr").value = providerData.email;
  document.getElementById("bioText").value = providerData.bio;
  
  document.getElementById("pavEmoji").textContent = providerData.avatar;
  document.getElementById("pavName").textContent = providerData.fullName;
  document.getElementById("sidebarName").textContent = providerData.fullName;
  document.getElementById("topbarName").textContent = providerData.fullName;
  document.getElementById("sidebarAv").textContent = providerData.avatar;
  
  // تحديث عداد الحروف
  const bioLength = providerData.bio.length;
  document.getElementById("bioCount").textContent = `${bioLength} / 300 حرف`;
  
  // إضافة حدث لعداد الحروف
  document.getElementById("bioText").addEventListener("input", function() {
    const len = this.value.length;
    document.getElementById("bioCount").textContent = `${len} / 300 حرف`;
    if (len > 300) {
      document.getElementById("bioCount").style.color = "var(--fxr-error)";
    } else {
      document.getElementById("bioCount").style.color = "var(--fxr-muted)";
    }
  });
}

// ========== حفظ البيانات الأساسية ==========
function fxrSaveBasic() {
  providerData.firstName = document.getElementById("firstName").value;
  providerData.lastName = document.getElementById("lastName").value;
  providerData.fullName = `${providerData.firstName} ${providerData.lastName}`;
  providerData.phone = document.getElementById("phoneNum").value;
  providerData.email = document.getElementById("emailAddr").value;
  providerData.bio = document.getElementById("bioText").value;
  
  // تحديث الواجهة
  document.getElementById("pavName").textContent = providerData.fullName;
  document.getElementById("sidebarName").textContent = providerData.fullName;
  document.getElementById("topbarName").textContent = providerData.fullName;
  
  showToast("تم حفظ المعلومات الأساسية بنجاح ✅", "success");
}

function fxrResetBasic() {
  loadBasicData();
  showToast("تم إعادة تعيين البيانات", "info");
}

// ========== تحميل البيانات المهنية ==========
function loadProfessionalData() {
  document.getElementById("mainSpec").value = providerData.spec;
  document.getElementById("govSelect").value = providerData.gov;
  document.getElementById("serviceAreas").value = providerData.areas;
  document.getElementById("priceMin").value = providerData.priceMin;
  document.getElementById("priceMax").value = providerData.priceMax;
  
  // تحميل الخدمات الفرعية
  const subServGrid = document.getElementById("subServGrid");
  if (subServGrid) {
    subServGrid.innerHTML = subServices.map(service => `
      <label class="fxr-chk-item">
        <input type="checkbox" value="${service.id}" ${service.checked ? "checked" : ""}>
        <span>${service.name}</span>
      </label>
    `).join("");
  }
}

// ========== حفظ البيانات المهنية ==========
function fxrSaveProfessional() {
  providerData.spec = document.getElementById("mainSpec").value;
  providerData.gov = document.getElementById("govSelect").value;
  providerData.areas = document.getElementById("serviceAreas").value;
  providerData.priceMin = parseInt(document.getElementById("priceMin").value);
  providerData.priceMax = parseInt(document.getElementById("priceMax").value);
  
  // حفظ الخدمات الفرعية
  const checkboxes = document.querySelectorAll("#subServGrid input");
  subServices.forEach((service, index) => {
    if (checkboxes[index]) {
      service.checked = checkboxes[index].checked;
    }
  });
  
  // تحديث التخصص في السايدبار
  const specText = document.getElementById("mainSpec").options[document.getElementById("mainSpec").selectedIndex]?.text;
  document.getElementById("sidebarSpec").textContent = specText || "تكييف وتبريد";
  
  showToast("تم حفظ المعلومات المهنية بنجاح ✅", "success");
}

// ========== تحميل الجدول الأسبوعي ==========
function loadScheduleData() {
  const schRows = document.getElementById("schRows");
  if (!schRows) return;
  
  schRows.innerHTML = weeklyScheduleData.map(day => `
    <div class="fxr-schedule-row">
      <div class="fxr-schedule-day">${day.day}</div>
      <div class="fxr-schedule-hours">
        <input type="time" value="${day.from}" id="from-${day.day}" ${!day.enabled ? "disabled" : ""}>
        <span>إلى</span>
        <input type="time" value="${day.to}" id="to-${day.day}" ${!day.enabled ? "disabled" : ""}>
      </div>
      <label style="display:flex;align-items:center;gap:5px">
        <input type="checkbox" ${day.enabled ? "checked" : ""} onchange="toggleDay('${day.day}', this.checked)">
        <span style="font-size:11px">فعّال</span>
      </label>
    </div>
  `).join("");
}

function toggleDay(day, enabled) {
  const dayData = weeklyScheduleData.find(d => d.day === day);
  if (dayData) dayData.enabled = enabled;
  loadScheduleData();
}

function fxrSaveSch() {
  weeklyScheduleData.forEach(day => {
    const fromInput = document.getElementById(`from-${day.day}`);
    const toInput = document.getElementById(`to-${day.day}`);
    if (fromInput && day.enabled) day.from = fromInput.value;
    if (toInput && day.enabled) day.to = toInput.value;
  });
  showToast("تم حفظ جدول أوقات العمل ✅", "success");
}

// ========== تحميل معرض الأعمال ==========
function loadGalleryData() {
  const galGrid = document.getElementById("galGrid");
  const galCount = document.getElementById("galCount");
  
  if (!galGrid) return;
  
  galGrid.innerHTML = galleryImagesData.map(img => `
    <div class="fxr-gal-item">
      <span style="font-size:28px">${img.emoji}</span>
      <button class="fxr-gal-delete" onclick="deleteGalleryImage(${img.id})">✕</button>
    </div>
  `).join("");
  
  if (galCount) galCount.textContent = `${galleryImagesData.length} / 20 صورة`;
}

function deleteGalleryImage(id) {
  if (confirm("هل تريد حذف هذه الصورة؟")) {
    galleryImagesData = galleryImagesData.filter(img => img.id !== id);
    loadGalleryData();
    showToast("تم حذف الصورة", "success");
  }
}

// ========== حفظ كلمة المرور ==========
function fxrSavePassword() {
  const oldPass = document.getElementById("oldPass")?.value;
  const newPass = document.getElementById("newPass")?.value;
  const confirmPass = document.getElementById("confirmPass")?.value;
  
  if (!oldPass) {
    showToast("الرجاء إدخال كلمة المرور الحالية", "error");
    return;
  }
  
  if (!newPass || newPass.length < 6) {
    showToast("كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل", "error");
    return;
  }
  
  if (newPass !== confirmPass) {
    showToast("كلمة المرور الجديدة غير متطابقة", "error");
    return;
  }
  
  showToast("تم تغيير كلمة المرور بنجاح ✅", "success");
  
  // تنظيف الحقول
  document.getElementById("oldPass").value = "";
  document.getElementById("newPass").value = "";
  document.getElementById("confirmPass").value = "";
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
  const logoutBtn = document.querySelector(".fxr-nav-link--logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      showToast("تم تسجيل الخروج بنجاح 👋", "success");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1000);
    });
  }
  
  // زر الإشعارات
  const notifBtn = document.querySelector(".fxr-notif-btn");
  if (notifBtn) {
    notifBtn.addEventListener("click", () => showToast("🔔 ليس لديك إشعارات جديدة", "info"));
  }
}

// ========== بدء التطبيق ==========
document.addEventListener("DOMContentLoaded", () => {
  initSidebar();
  initProfileTabs();
  loadBasicData();
  loadProfessionalData();
  loadScheduleData();
  loadGalleryData();
});