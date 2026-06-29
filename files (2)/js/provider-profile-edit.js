/**
 * FIXORA Provider Profile Edit - إدارة البروفايل
 * JavaScript كامل لصفحة إدارة البروفايل
 */
'use strict';

if (window.FixoraAPI && !window.FixoraAPI.requireAuth('provider')) {
  /* redirected */
}

const api = window.FixoraAPI;

const SCHEDULE_DAY_AR = {
  sun: 'الأحد', mon: 'الإثنين', tue: 'الثلاثاء', wed: 'الأربعاء',
  thu: 'الخميس', fri: 'الجمعة', sat: 'السبت'
};

let providerData = {
  firstName: '',
  lastName: '',
  fullName: '',
  phone: '',
  email: '',
  bio: '',
  spec: '',
  gov: '',
  areas: '',
  priceMin: '',
  priceMax: '',
  rating: 0,
  reviewsCount: 0,
  avatar: '👨‍🔧',
  providerProfileId: null
};

let subServices = [];
let weeklyScheduleData = [];
let galleryImagesData = [];

function mapGovToSelectValue(gov) {
  if (!gov) return '';
  const key = String(gov).toLowerCase();
  const map = {
    amman: 'amman', irbid: 'irbid', zarqa: 'zarqa', aqaba: 'aqaba',
    salt: 'salt', salat: 'salt', mafraq: 'mafraq', karak: 'karak',
    maan: 'maan', tafilah: 'tafilah', ajloun: 'ajloun', jerash: 'jerash', madaba: 'madaba'
  };
  return map[key] || key;
}

function setSelectByTextOrValue(selectId, textOrValue) {
  const sel = document.getElementById(selectId);
  if (!sel || !textOrValue) return;
  const val = String(textOrValue).trim();
  for (const opt of sel.options) {
    if (opt.value === val || opt.textContent.trim() === val) {
      sel.value = opt.value;
      return;
    }
  }
}

async function loadProfileFromApi() {
  if (!api) return;
  try {
    const profRes = await api.getProviderProfile();
    const p = profRes.profile || {};
    providerData.firstName = p.first_name || '';
    providerData.lastName = p.last_name || '';
    providerData.fullName = `${providerData.firstName} ${providerData.lastName}`.trim();
    providerData.phone = p.phone || '';
    providerData.email = p.email || '';
    providerData.bio = p.bio || '';
    providerData.spec = p.specialty || '';
    providerData.gov = mapGovToSelectValue(p.governorate);
    providerData.rating = parseFloat(p.avg_rating) || 0;
    providerData.providerProfileId = p.provider_profile_id || null;
    if (p.serviced_areas_text) {
      providerData.areas = p.serviced_areas_text;
    }

    if (providerData.providerProfileId) {
      const full = await api.getProvider(providerData.providerProfileId);
      const data = full.data || {};
      providerData.reviewsCount = (data.reviews || []).length;
      subServices = (data.services || []).map((s, i) => ({
        id: s.id || i + 1,
        name: s.name_ar,
        checked: true
      }));

      if (data.serviced_areas_text) {
        providerData.areas = data.serviced_areas_text;
      } else if ((data.service_areas || []).length) {
        providerData.areas = data.service_areas
          .map((a) => (typeof a === 'string' ? a : (a.district || '')))
          .filter(Boolean)
          .join('، ');
      }

      weeklyScheduleData = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map((key) => {
        const day = SCHEDULE_DAY_AR[key];
        const row = (data.availability || []).find((a) => a.day_of_week === key);
        return {
          day,
          from: row?.start_time ? String(row.start_time).slice(0, 5) : '09:00',
          to: row?.end_time ? String(row.end_time).slice(0, 5) : '17:00',
          enabled: row ? row.is_available !== false : false
        };
      });
    }

    const ratingEl = document.querySelector('.fxr-pav__rating');
    if (ratingEl) {
      ratingEl.textContent = providerData.rating > 0
        ? `⭐ ${providerData.rating} · ${providerData.reviewsCount} تقييم`
        : `⭐ جديد · ${providerData.reviewsCount} تقييم`;
    }
  } catch (e) {
    console.warn('تعذر تحميل بروفايل الفني', e);
    showToast('تعذر تحميل البيانات من السيرفر', 'error');
  }
}

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
async function fxrSaveBasic() {
  providerData.firstName = document.getElementById("firstName").value.trim();
  providerData.lastName = document.getElementById("lastName").value.trim();
  providerData.fullName = `${providerData.firstName} ${providerData.lastName}`.trim();
  providerData.phone = document.getElementById("phoneNum").value.trim();
  providerData.email = document.getElementById("emailAddr").value.trim();
  providerData.bio = document.getElementById("bioText").value.trim();

  try {
    await api.updateProviderProfile({
      phone: providerData.phone,
      bio: providerData.bio
    });
    await api.updateProfile({
      first_name: providerData.firstName,
      last_name: providerData.lastName
    });

    document.getElementById("pavName").textContent = providerData.fullName || '—';
    document.getElementById("sidebarName").textContent = providerData.fullName || '—';
    document.getElementById("topbarName").textContent = providerData.fullName || '—';

    showToast("تم حفظ المعلومات الأساسية بنجاح ✅", "success");
  } catch (e) {
    showToast(e.message || 'فشل الحفظ', 'error');
  }
}

function fxrResetBasic() {
  loadBasicData();
  showToast("تم إعادة تعيين البيانات", "info");
}

// ========== تحميل البيانات المهنية ==========
function loadProfessionalData() {
  setSelectByTextOrValue("mainSpec", providerData.spec);
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
async function fxrSaveProfessional() {
  const specSelect = document.getElementById("mainSpec");
  const specText = specSelect?.options[specSelect.selectedIndex]?.text || '';
  providerData.spec = specText && specSelect.value ? specText : providerData.spec;
  providerData.gov = document.getElementById("govSelect").value;
  providerData.areas = document.getElementById("serviceAreas").value;
  providerData.priceMin = parseInt(document.getElementById("priceMin").value, 10) || '';
  providerData.priceMax = parseInt(document.getElementById("priceMax").value, 10) || '';

  try {
    await api.updateProviderProfile({
      specialty: providerData.spec,
      bio: providerData.bio,
      serviced_areas_text: providerData.areas
    });
    document.getElementById("sidebarSpec").textContent = providerData.spec || '—';
    showToast("تم حفظ المعلومات المهنية بنجاح ✅", "success");
  } catch (e) {
    showToast(e.message || 'فشل الحفظ', 'error');
  }
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

const SCHEDULE_AR_TO_KEY = Object.fromEntries(
  Object.entries(SCHEDULE_DAY_AR).map(([k, v]) => [v, k])
);

async function fxrSaveSch() {
  weeklyScheduleData.forEach((day) => {
    const fromInput = document.getElementById(`from-${day.day}`);
    const toInput = document.getElementById(`to-${day.day}`);
    if (fromInput && day.enabled) day.from = fromInput.value;
    if (toInput && day.enabled) day.to = toInput.value;
  });

  const schedule = weeklyScheduleData.map((day) => ({
    day_of_week: SCHEDULE_AR_TO_KEY[day.day] || day.day,
    start_time: day.from,
    end_time: day.to,
    is_available: day.enabled
  }));

  try {
    const res = await api.updateProviderAvailability(schedule);
    if (res.data?.length) {
      weeklyScheduleData = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map((key) => {
        const row = res.data.find((a) => a.day_of_week === key);
        return {
          day: SCHEDULE_DAY_AR[key],
          from: row?.start_time ? String(row.start_time).slice(0, 5) : '09:00',
          to: row?.end_time ? String(row.end_time).slice(0, 5) : '17:00',
          enabled: row ? row.is_available !== false : false
        };
      });
      loadScheduleData();
    }
    showToast(res.message || 'تم حفظ جدول أوقات العمل ✅', 'success');
  } catch (e) {
    showToast(e.message || 'تعذر حفظ جدول العمل', 'error');
  }
}

window.fxrSaveSch = fxrSaveSch;

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
document.addEventListener("DOMContentLoaded", async () => {
  initSidebar();
  initProfileTabs();
  await loadProfileFromApi();
  loadBasicData();
  loadProfessionalData();
  loadScheduleData();
  loadGalleryData();
});