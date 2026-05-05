/**
 * FIXORA — fxr-home.js
 * JavaScript الخاص بالصفحة الرئيسية
 */

'use strict';

/* بيانات الحرفيين (Mock Data) */
const fxrTopProviders = [
  {
    id: 1,
    name: 'أحمد المصري',
    specialty: 'تكييف وأجهزة منزلية',
    rating: 4.9,
    reviewCount: 112,
    governorate: 'عمّان',
    areas: ['الشميساني', 'عبدون', 'الجبيهة'],
    priceMin: 15,
    priceMax: 30,
    available: true,
    avatar: '👨‍🔧',
    avatarClass: 'fxr-avatar-orange',
    category: 'تكييف'
  },
  {
    id: 2,
    name: 'محمد العزام',
    specialty: 'كهرباء منزلية',
    rating: 4.7,
    reviewCount: 88,
    governorate: 'الزرقاء',
    areas: ['الزرقاء الجديدة', 'الرصيفة'],
    priceMin: 10,
    priceMax: 25,
    available: true,
    avatar: '👨‍🔧',
    avatarClass: 'fxr-avatar-blue',
    category: 'كهرباء'
  },
  {
    id: 3,
    name: 'خالد الحجايا',
    specialty: 'سباكة',
    rating: 4.6,
    reviewCount: 73,
    governorate: 'إربد',
    areas: ['وسط إربد', 'الحواره'],
    priceMin: 12,
    priceMax: 35,
    available: false,
    avatar: '👷',
    avatarClass: 'fxr-avatar-green',
    category: 'سباكة'
  }
];

/* بناء النجوم */
function fxrBuildStars(rating) {
  const full = Math.floor(rating);
  const empty = 5 - full;
  return '★'.repeat(full) + '☆'.repeat(empty);
}

/* بناء بطاقة الحرفي */
function fxrBuildProviderCard(p) {
  const stars = fxrBuildStars(p.rating);
  const availLabel = p.available
    ? '<span class="fxr-status fxr-status-available">متاح ✅</span>'
    : '<span class="fxr-status fxr-status-busy">مشغول</span>';

  const tagsHtml = [p.governorate, ...p.areas.slice(0, 2)]
    .map(t => `<span class="fxr-tag">${t}</span>`)
    .join('');

  return `
    <div class="fxr-provider-card">
      <div class="fxr-provider-card-head">
        <div class="fxr-avatar ${p.avatarClass}">${p.avatar}</div>
        <div>
          <div class="fxr-provider-name">${p.name}</div>
          <div class="fxr-provider-specialty">${p.specialty}</div>
        </div>
      </div>
      <div class="fxr-provider-rating">
        ${stars}
        <span>${p.rating} <span>(${p.reviewCount} تقييم)</span></span>
        &nbsp; ${availLabel}
      </div>
      <div class="fxr-provider-tags">
        ${tagsHtml}
      </div>
      <a href="privider.html?id=${p.id}" class="fxr-btn fxr-btn-outline" style="flex:1; text-align:center;">
        عرض البروفايل
      </a>
    </div>
  `;
}

/* رسم قسم أفضل الحرفيين */
function fxrRenderTopProviders() {
  const grid = document.getElementById('fxrTopProviders');
  if (!grid) return;
  grid.innerHTML = fxrTopProviders.map(fxrBuildProviderCard).join('');
}

/* الانتقال لصفحة البحث */
function fxrGoSearch() {
  const q = document.getElementById('fxrMainSearchInput').value.trim();
  const url = 'search.html' + (q ? '?q=' + encodeURIComponent(q) : '');
  window.location.href = url;
}

/* الضغط على فئة الخدمة */
function fxrCatClick(el) {
  document.querySelectorAll('.fxr-cat-item').forEach(function (c) {
    c.classList.remove('fxr-cat-active');
  });
  el.classList.add('fxr-cat-active');

  const cat = el.getAttribute('data-cat');
  window.location.href = 'search.html?cat=' + encodeURIComponent(cat);
}

/* Toast الإشعارات */
function fxrShowToast(msg, duration) {
  duration = duration || 2800;
  var t = document.getElementById('fxrToast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('fxr-toast-show');
  setTimeout(function () {
    t.classList.remove('fxr-toast-show');
  }, duration);
}

/* DOM Ready */
document.addEventListener('DOMContentLoaded', function () {
  const inp = document.getElementById('fxrMainSearchInput');
  if (inp) {
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') fxrGoSearch();
    });
  }
  fxrRenderTopProviders();
});

/* إظهار وإخفاء الشريط الجانبي في الصفحة الرئيسية */
function fxrToggleSidebar() {
  const sidebar = document.getElementById('fxrMainSidebar');
  const overlay = document.getElementById('fxrSidebarOverlay');
  if (sidebar && overlay) {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
  }
}