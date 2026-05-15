/**
 * FIXORA — fxr-search.js
 * JavaScript الخاص بصفحة البحث والفلترة
 */

'use strict';

/* بيانات الحرفيين الكاملة (Mock Data) */
const fxrAllProviders = [
  { id: 1, name: 'أحمد المصري', specialty: 'تكييف وأجهزة منزلية', category: 'تكييف', rating: 4.9, reviewCount: 112, governorate: 'عمّان', areas: ['الشميساني', 'عبدون'], priceMin: 15, priceMax: 30, available: true, avatar: '👨‍🔧', avatarClass: 'fxr-avatar-orange' },
  { id: 2, name: 'محمود الرفاعي', specialty: 'تكييف مركزي', category: 'تكييف', rating: 4.8, reviewCount: 87, governorate: 'عمّان', areas: ['الجبيهة', 'مرج الحمام'], priceMin: 20, priceMax: 50, available: true, avatar: '🧑‍🔧', avatarClass: 'fxr-avatar-blue' },
  { id: 3, name: 'نادر أبو خليل', specialty: 'تكييف وتبريد', category: 'تكييف', rating: 4.5, reviewCount: 54, governorate: 'عمّان', areas: ['مرج الحمام', 'شفا بدران'], priceMin: 10, priceMax: 25, available: false, avatar: '👷', avatarClass: 'fxr-avatar-orange' },
  { id: 4, name: 'سامر الطراونة', specialty: 'تكييف سبليت', category: 'تكييف', rating: 4.4, reviewCount: 38, governorate: 'عمّان', areas: ['ماركا', 'الجويدة'], priceMin: 12, priceMax: 28, available: true, avatar: '🧑‍🔧', avatarClass: 'fxr-avatar-green' },
  { id: 5, name: 'عمر الخطيب', specialty: 'كهرباء منزلية', category: 'كهرباء', rating: 4.7, reviewCount: 88, governorate: 'الزرقاء', areas: ['الزرقاء الجديدة', 'الرصيفة'], priceMin: 10, priceMax: 25, available: true, avatar: '👨‍🔧', avatarClass: 'fxr-avatar-blue' },
  { id: 6, name: 'يوسف العبادي', specialty: 'كهرباء وأنظمة إنارة', category: 'كهرباء', rating: 4.6, reviewCount: 65, governorate: 'عمّان', areas: ['عبدون', 'السابع'], priceMin: 15, priceMax: 35, available: true, avatar: '🧑‍🔧', avatarClass: 'fxr-avatar-orange' },
  { id: 7, name: 'خالد الحجايا', specialty: 'سباكة وصرف صحي', category: 'سباكة', rating: 4.6, reviewCount: 73, governorate: 'إربد', areas: ['وسط إربد', 'الحواره'], priceMin: 12, priceMax: 35, available: false, avatar: '👷', avatarClass: 'fxr-avatar-green' },
  { id: 8, name: 'رامي السعودي', specialty: 'سباكة منزلية', category: 'سباكة', rating: 4.3, reviewCount: 41, governorate: 'عمّان', areas: ['النزهة', 'الجاردنز'], priceMin: 10, priceMax: 30, available: true, avatar: '👨‍🔧', avatarClass: 'fxr-avatar-blue' },
  { id: 9, name: 'إبراهيم العوران', specialty: 'نجارة وأثاث', category: 'نجارة', rating: 4.8, reviewCount: 59, governorate: 'عمّان', areas: ['الطيونة', 'وادي السير'], priceMin: 20, priceMax: 60, available: true, avatar: '🧑‍🔧', avatarClass: 'fxr-avatar-orange' },
  { id: 10, name: 'طلال الزبون', specialty: 'دهانات داخلية وخارجية', category: 'دهانات', rating: 4.5, reviewCount: 47, governorate: 'عمّان', areas: ['الجبيهة', 'خلدا'], priceMin: 15, priceMax: 45, available: true, avatar: '👷', avatarClass: 'fxr-avatar-blue' },
  { id: 11, name: 'معاذ الحمود', specialty: 'أجهزة منزلية كبيرة', category: 'أجهزة منزلية', rating: 4.7, reviewCount: 95, governorate: 'عمّان', areas: ['الشميساني', 'الدوار الثالث'], priceMin: 15, priceMax: 40, available: true, avatar: '👨‍🔧', avatarClass: 'fxr-avatar-green' },
  { id: 12, name: 'حسام العتوم', specialty: 'تنظيف منازل واستوديوهات', category: 'تنظيف', rating: 4.4, reviewCount: 33, governorate: 'العقبة', areas: ['وسط العقبة', 'حي النخيل'], priceMin: 20, priceMax: 55, available: false, avatar: '🧑‍🔧', avatarClass: 'fxr-avatar-orange' }
];

/* حالة التطبيق */
var fxrState = {
  query: '',
  category: '',
  maxPrice: 50,
  sortBy: 'rating',
  page: 1,
  perPage: 6,
  filtered: []
};

/* بناء النجوم */
function fxrBuildStars(rating) {
  var full = Math.floor(rating);
  var empty = 5 - full;
  return '★'.repeat(full) + '☆'.repeat(empty);
}

/* بناء بطاقة الحرفي المفصلة */
function fxrBuildExtendedCard(p) {
  var stars = fxrBuildStars(p.rating);
  var avail = p.available
    ? '<span class="fxr-status fxr-status-available">متاح ✅</span>'
    : '<span class="fxr-status fxr-status-busy">مشغول</span>';

  var tags = [p.governorate]
    .concat(p.areas.slice(0, 1))
    .map(function (t) { return '<span class="fxr-tag">' + t + '</span>'; })
    .join('');

  return '<div class="fxr-provider-card-extended">' +
    '<div class="fxr-pcard-head">' +
      '<div class="fxr-avatar ' + p.avatarClass + '">' + p.avatar + '</div>' +
      '<div class="fxr-pcard-info">' +
        '<div class="fxr-pcard-name">' + p.name + '</div>' +
        '<div class="fxr-pcard-specialty">' + p.specialty + '</div>' +
      '</div>' +
      '<button class="fxr-pcard-fav" onclick="fxrToggleFav(this,' + p.id + ')">♡</button>' +
    '</div>' +
    '<div class="fxr-pcard-rating">' + stars + ' ' + p.rating +
      ' <span class="fxr-rating-count">(' + p.reviewCount + ')</span>' +
      ' &nbsp; ' + avail +
    '</div>' +
    '<div class="fxr-pcard-tags">' + tags +
      '<span class="fxr-tag">' + p.priceMin + '–' + p.priceMax + ' دينار</span>' +
    '</div>' +
    '<div class="fxr-pcard-actions">' +
      '<a href="privider.html?id=' + p.id + '" class="fxr-btn fxr-btn-primary fxr-btn-sm" style="flex:1;justify-content:center">عرض البروفايل</a>' +
      '<a href="booking.html?id=' + p.id + '" class="fxr-btn fxr-btn-outline-dark fxr-btn-sm">📅 احجز</a>' +
    '</div>' +
  '</div>';
}

/* تطبيق جميع الفلاتر */
function fxrApplyFilters() {
  var q = fxrState.query.toLowerCase();
  var cat = fxrState.category;
  var maxPrice = fxrState.maxPrice;
  var onlyNow = document.getElementById('fa-now') && document.getElementById('fa-now').checked;

  var govMap = {
    'fg-amman': 'عمّان', 'fg-irbid': 'إربد', 'fg-zarqa': 'الزرقاء',
    'fg-aqaba': 'العقبة', 'fg-salt': 'السلط', 'fg-mafraq': 'المفرق',
    'fg-karak': 'الكرك', 'fg-maan': 'معان', 'fg-tafilah': 'الطفيلة',
    'fg-ajloun': 'عجلون', 'fg-jarash': 'جرش', 'fg-madaba': 'مادبا'
  };

  var selectedGovs = [];
  Object.keys(govMap).forEach(function (id) {
    var el = document.getElementById(id);
    if (el && el.checked) selectedGovs.push(govMap[id]);
  });

  fxrState.filtered = fxrAllProviders.filter(function (p) {
    if (q && !(p.name.includes(q) || p.specialty.includes(q) || p.category.includes(q))) return false;
    if (cat && p.category !== cat && !p.specialty.includes(cat)) return false;
    if (p.priceMin > maxPrice) return false;
    if (selectedGovs.length > 0 && !selectedGovs.includes(p.governorate)) return false;
    if (onlyNow && !p.available) return false;
    return true;
  });

  fxrSortResults();
}

/* الترتيب */
function fxrSortResults() {
  var sel = document.getElementById('fxrSortSelect');
  var by = sel ? sel.value : 'rating';
  fxrState.sortBy = by;

  fxrState.filtered.sort(function (a, b) {
    if (by === 'rating') return b.rating - a.rating;
    if (by === 'price_asc') return a.priceMin - b.priceMin;
    if (by === 'price_desc') return b.priceMax - a.priceMax;
    if (by === 'reviews') return b.reviewCount - a.reviewCount;
    return 0;
  });

  fxrRenderResults();
}

/* رسم النتائج */
function fxrRenderResults() {
  var grid = document.getElementById('fxrResultsGrid');
  var cntEl = document.getElementById('fxrResultsNum');
  if (!grid) return;

  var total = fxrState.filtered.length;
  var perPage = fxrState.perPage;
  var page = fxrState.page;
  var start = (page - 1) * perPage;
  var slice = fxrState.filtered.slice(start, start + perPage);

  if (cntEl) cntEl.textContent = total;

  if (total === 0) {
    grid.innerHTML = '<div class="fxr-empty-state">' +
      '<div class="fxr-empty-icon">🔍</div>' +
      '<div class="fxr-empty-title">لا توجد نتائج</div>' +
      '<div class="fxr-empty-sub">حاول تغيير كلمة البحث أو الفلاتر</div>' +
      '</div>';
    return;
  }

  grid.innerHTML = slice.map(fxrBuildExtendedCard).join('');
  fxrUpdatePagination(total, perPage, page);
}

/* تحديث Pagination */
function fxrUpdatePagination(total, perPage, current) {
  var pages = Math.ceil(total / perPage);
  var pEl = document.getElementById('fxrPagination');
  if (!pEl) return;

  var html = '<button class="fxr-page-btn" onclick="fxrChangePage(-1)">→</button>';
  for (var i = 1; i <= Math.min(pages, 5); i++) {
    var active = i === current ? ' fxr-page-active' : '';
    html += '<button class="fxr-page-btn' + active + '" onclick="fxrSetPage(' + i + ')">' + i + '</button>';
  }
  html += '<button class="fxr-page-btn" onclick="fxrChangePage(1)">←</button>';
  pEl.innerHTML = html;
}

function fxrSetPage(n) {
  var pages = Math.ceil(fxrState.filtered.length / fxrState.perPage);
  if (n < 1 || n > pages) return;
  fxrState.page = n;
  fxrRenderResults();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function fxrChangePage(dir) {
  fxrSetPage(fxrState.page + dir);
}

/* البحث بالنص */
function fxrRunSearch() {
  var inp = document.getElementById('fxrSearchInput');
  fxrState.query = inp ? inp.value.trim() : '';
  fxrState.page = 1;
  fxrApplyFilters();
}

/* الفلتر السريع */
function fxrQuickFilter(el, cat) {
  document.querySelectorAll('.fxr-qf-chip').forEach(function (c) {
    c.classList.remove('fxr-qf-active');
  });
  el.classList.add('fxr-qf-active');
  fxrState.category = cat;
  fxrState.page = 1;
  fxrApplyFilters();
}

/* تحديث قيمة السعر */
function fxrUpdatePrice(val) {
  fxrState.maxPrice = parseInt(val, 10);
  var lbl = document.getElementById('fxrPriceVal');
  if (lbl) lbl.textContent = 'حتى ' + val + ' دينار';
  fxrApplyFilters();
}

/* إعادة تعيين الفلاتر */
function fxrResetFilters() {
  document.querySelectorAll('.fxr-filter-panel input[type="checkbox"]').forEach(function (c) {
    c.checked = false;
  });
  var pr = document.getElementById('fxrPriceRange');
  if (pr) { pr.value = 50; fxrUpdatePrice(50); }
  document.querySelectorAll('.fxr-qf-chip').forEach(function (c) {
    c.classList.remove('fxr-qf-active');
  });
  var allChip = document.querySelector('[data-cat=""]');
  if (allChip) allChip.classList.add('fxr-qf-active');
  fxrState.category = '';
  fxrState.page = 1;
  fxrApplyFilters();
  fxrShowToast('🔄 تم إعادة تعيين الفلاتر');
}

/* المفضلة */
function fxrToggleFav(btn, id) {
  btn.classList.toggle('fxr-fav-active');
  var isFav = btn.classList.contains('fxr-fav-active');
  btn.textContent = isFav ? '♥' : '♡';
  fxrShowToast(isFav ? '❤️ أُضيف إلى المفضلة' : '🗑️ حُذف من المفضلة');
}

/* Toast */
function fxrShowToast(msg, duration) {
  duration = duration || 2600;
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
  var params = new URLSearchParams(window.location.search);
  if (params.get('q')) fxrState.query = params.get('q');
  if (params.get('cat')) fxrState.category = params.get('cat');

  if (fxrState.query) {
    var inp = document.getElementById('fxrSearchInput');
    if (inp) inp.value = fxrState.query;
  }

  if (fxrState.category) {
    var chips = document.querySelectorAll('.fxr-qf-chip');
    chips.forEach(function (c) {
      c.classList.remove('fxr-qf-active');
      if (c.getAttribute('data-cat') === fxrState.category) {
        c.classList.add('fxr-qf-active');
      }
    });
  }

  var si = document.getElementById('fxrSearchInput');
  if (si) {
    si.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') fxrRunSearch();
    });
  }

  var pr = document.getElementById('fxrPriceRange');
  if (pr) {
    pr.addEventListener('change', fxrApplyFilters);
  }

  fxrApplyFilters();
});