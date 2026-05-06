/**
 * FIXORA — search.js
 * JavaScript الخاص بصفحة البحث والفلترة
 */

'use strict';

// ========================================
// DATA - الحرفيين في الأردن (Mock Data)
// ========================================
const fxrProviders = [
  { id: 1, name: 'محمد أبو خالد', specialty: 'تكييف وأجهزة منزلية', category: 'تكييف', rating: 4.9, reviews: 112, governorate: 'عمّان', areas: ['الشميساني', 'عبدون'], price: 25, available: true, avatar: '👨‍🔧', avatarClass: 'fxr-avatar-orange' },
  { id: 2, name: 'عمر الرواشدة', specialty: 'تكييف مركزي', category: 'تكييف', rating: 4.8, reviews: 87, governorate: 'عمّان', areas: ['الجبيهة', 'مرج الحمام'], price: 35, available: true, avatar: '🧑‍🔧', avatarClass: 'fxr-avatar-blue' },
  { id: 3, name: 'فراس الزيادات', specialty: 'تكييف وتبريد', category: 'تكييف', rating: 4.5, reviews: 54, governorate: 'عمّان', areas: ['مرج الحمام', 'شفا بدران'], price: 18, available: false, avatar: '👷', avatarClass: 'fxr-avatar-orange' },
  { id: 4, name: 'باسل المومني', specialty: 'تكييف سبليت', category: 'تكييف', rating: 4.4, reviews: 38, governorate: 'عمّان', areas: ['ماركا', 'الجويدة'], price: 20, available: true, avatar: '🧑‍🔧', avatarClass: 'fxr-avatar-green' },
  { id: 5, name: 'خالد النابلسي', specialty: 'كهرباء منزلية', category: 'كهرباء', rating: 4.7, reviews: 88, governorate: 'الزرقاء', areas: ['الزرقاء الجديدة', 'الرصيفة'], price: 18, available: true, avatar: '👨‍🔧', avatarClass: 'fxr-avatar-blue' },
  { id: 6, name: 'أيمن القضاة', specialty: 'كهرباء وأنظمة إنارة', category: 'كهرباء', rating: 4.6, reviews: 65, governorate: 'عمّان', areas: ['عبدون', 'السابع'], price: 25, available: true, avatar: '🧑‍🔧', avatarClass: 'fxr-avatar-orange' },
  { id: 7, name: 'يوسف الحوراني', specialty: 'سباكة وصرف صحي', category: 'سباكة', rating: 4.6, reviews: 73, governorate: 'إربد', areas: ['وسط إربد', 'الحواره'], price: 22, available: false, avatar: '👷', avatarClass: 'fxr-avatar-green' },
  { id: 8, name: 'رامي السعودي', specialty: 'سباكة منزلية', category: 'سباكة', rating: 4.3, reviews: 41, governorate: 'عمّان', areas: ['النزهة', 'الجاردنز'], price: 20, available: true, avatar: '👨‍🔧', avatarClass: 'fxr-avatar-blue' },
  { id: 9, name: 'إبراهيم العوران', specialty: 'نجارة وأثاث', category: 'نجارة', rating: 4.8, reviews: 59, governorate: 'عمّان', areas: ['الطيونة', 'وادي السير'], price: 40, available: true, avatar: '🧑‍🔧', avatarClass: 'fxr-avatar-orange' },
  { id: 10, name: 'طلال الزبون', specialty: 'دهانات داخلية وخارجية', category: 'دهانات', rating: 4.5, reviews: 47, governorate: 'عمّان', areas: ['الجبيهة', 'خلدا'], price: 30, available: true, avatar: '👷', avatarClass: 'fxr-avatar-blue' },
  { id: 11, name: 'معاذ الحمود', specialty: 'أجهزة منزلية كبيرة', category: 'أجهزة منزلية', rating: 4.7, reviews: 95, governorate: 'عمّان', areas: ['الشميساني', 'الدوار الثالث'], price: 28, available: true, avatar: '👨‍🔧', avatarClass: 'fxr-avatar-green' },
  { id: 12, name: 'حسام العتوم', specialty: 'تنظيف منازل', category: 'تنظيف', rating: 4.4, reviews: 33, governorate: 'العقبة', areas: ['وسط العقبة', 'حي النخيل'], price: 38, available: false, avatar: '🧑‍🔧', avatarClass: 'fxr-avatar-orange' },
  { id: 13, name: 'نضال البطاينة', specialty: 'بناء وترميم', category: 'بناء', rating: 4.7, reviews: 62, governorate: 'عمّان', areas: ['خلدا', 'الرابية'], price: 50, available: true, avatar: '👷', avatarClass: 'fxr-avatar-blue' },
  { id: 14, name: 'محمود الشياب', specialty: 'دهانات خارجية', category: 'دهانات', rating: 4.2, reviews: 29, governorate: 'الزرقاء', areas: ['حي الأمير حسن'], price: 25, available: true, avatar: '👨‍🔧', avatarClass: 'fxr-avatar-orange' },
  { id: 15, name: 'عاطف عبيدات', specialty: 'سباكة وصيانة', category: 'سباكة', rating: 4.5, reviews: 52, governorate: 'إربد', areas: ['حي إيدون'], price: 18, available: true, avatar: '🧑‍🔧', avatarClass: 'fxr-avatar-green' },
  { id: 16, name: 'شادي الكساسبة', specialty: 'كهرباء سيارات', category: 'كهرباء', rating: 4.3, reviews: 44, governorate: 'الكرك', areas: ['وسط الكرك'], price: 15, available: true, avatar: '👷', avatarClass: 'fxr-avatar-blue' },
  { id: 17, name: 'هاني الطوالبة', specialty: 'تكييف سيارات', category: 'تكييف', rating: 4.6, reviews: 48, governorate: 'معان', areas: ['وسط معان'], price: 30, available: false, avatar: '👨‍🔧', avatarClass: 'fxr-avatar-orange' },
  { id: 18, name: 'ربيع الجازي', specialty: 'نجارة مطابخ', category: 'نجارة', rating: 4.9, reviews: 73, governorate: 'السلط', areas: ['وسط السلط'], price: 45, available: true, avatar: '🧑‍🔧', avatarClass: 'fxr-avatar-green' },
  { id: 19, name: 'سمير العدوان', specialty: 'كهرباء منازل', category: 'كهرباء', rating: 4.2, reviews: 35, governorate: 'المفرق', areas: ['وسط المفرق'], price: 12, available: true, avatar: '👨‍🔧', avatarClass: 'fxr-avatar-orange' },
  { id: 20, name: 'جمال الطراونة', specialty: 'سباكة منازل', category: 'سباكة', rating: 4.1, reviews: 28, governorate: 'الكرك', areas: ['وسط الكرك'], price: 15, available: true, avatar: '👷', avatarClass: 'fxr-avatar-blue' }
];

// ========================================
// STATE
// ========================================
let fxrState = {
  query: '',
  category: '',
  selectedGovs: ['عمّان'],
  ratingFilter: 'all',
  availableOnly: false,
  sortBy: 'rating',
  page: 1,
  perPage: 6,
  filteredResults: []
};

// ========================================
// UTILITY FUNCTIONS
// ========================================
function fxrBuildStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  
  let stars = '★'.repeat(full);
  if (half) stars += '½';
  stars += '☆'.repeat(empty);
  
  return stars;
}

function fxrBuildProviderCard(p) {
  const stars = fxrBuildStars(p.rating);
  const availLabel = p.available
    ? '<span class="fxr-status fxr-status-available">متاح ✅</span>'
    : '<span class="fxr-status fxr-status-busy">مشغول</span>';

  const tagsHtml = [p.governorate, ...p.areas.slice(0, 1)]
    .map(t => `<span class="fxr-tag">${t}</span>`)
    .join('');

  return `
    <div class="fxr-provider-card">
      <div class="fxr-card-head">
        <div class="fxr-avatar ${p.avatarClass}">${p.avatar}</div>
        <div>
          <div class="fxr-provider-name">${p.name}</div>
          <div class="fxr-provider-specialty">${p.specialty}</div>
        </div>
      </div>
      <div class="fxr-provider-rating">
        ${stars}
        <span>${p.rating} <span>(${p.reviews} تقييم)</span></span>
        &nbsp; ${availLabel}
      </div>
      <div class="fxr-provider-tags">
        ${tagsHtml}
      </div>
      <a href="privider.html?id=${p.id}" class="fxr-btn fxr-btn-primary fxr-btn-block">
        عرض البروفايل
      </a>
    </div>
  `;
}

function fxrShowToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2600);
}

// ========================================
// FILTER FUNCTIONS
// ========================================
function fxrGetSelectedGovernorates() {
  const govMap = {
    'gov-amman': 'عمّان', 'gov-irbid': 'إربد', 'gov-zarqa': 'الزرقاء',
    'gov-aqaba': 'العقبة', 'gov-salt': 'السلط', 'gov-mafraq': 'المفرق',
    'gov-karak': 'الكرك', 'gov-maan': 'معان', 'gov-tafilah': 'الطفيلة',
    'gov-ajloun': 'عجلون', 'gov-jarash': 'جرش', 'gov-madaba': 'مادبا'
  };
  
  const selected = [];
  for (const [id, name] of Object.entries(govMap)) {
    const checkbox = document.getElementById(id);
    if (checkbox && checkbox.checked) {
      selected.push(name);
    }
  }
  return selected;
}

function fxrGetSelectedRating() {
  const radios = document.querySelectorAll('input[name="ratingFilter"]');
  for (const radio of radios) {
    if (radio.checked) {
      return radio.value;
    }
  }
  return 'all';
}

function fxrApplyFilters() {
  const query = fxrState.query.toLowerCase();
  const category = fxrState.category;
  const selectedGovs = fxrGetSelectedGovernorates();
  const ratingFilter = fxrGetSelectedRating();
  const availableOnly = document.getElementById('availableOnly')?.checked || false;

  fxrState.selectedGovs = selectedGovs;
  fxrState.ratingFilter = ratingFilter;
  fxrState.availableOnly = availableOnly;

  let results = fxrProviders.filter(p => {
    // Search query filter
    if (query && !(p.name.toLowerCase().includes(query) || 
                   p.specialty.toLowerCase().includes(query) || 
                   p.category.toLowerCase().includes(query))) {
      return false;
    }
    
    // Category filter
    if (category && p.category !== category && !p.specialty.includes(category)) {
      return false;
    }
    
    // Governorate filter
    if (selectedGovs.length > 0 && !selectedGovs.includes(p.governorate)) {
      return false;
    }
    
    // Rating filter
    if (ratingFilter !== 'all') {
      const minRating = parseFloat(ratingFilter);
      if (p.rating < minRating) return false;
    }
    
    // Availability filter
    if (availableOnly && !p.available) return false;
    
    return true;
  });

  fxrState.filteredResults = results;
  fxrSortResults();
}

// ========================================
// SORT FUNCTIONS
// ========================================
function fxrSortResults() {
  const sortBy = fxrState.sortBy;
  
  fxrState.filteredResults.sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'reviews') return b.reviews - a.reviews;
    return 0;
  });

  fxrRenderResults();
}

// ========================================
// RENDER FUNCTIONS
// ========================================
function fxrRenderResults() {
  const grid = document.getElementById('resultsGrid');
  const countEl = document.getElementById('resultsCount');
  if (!grid) return;
  
  const total = fxrState.filteredResults.length;
  const start = (fxrState.page - 1) * fxrState.perPage;
  const paginatedResults = fxrState.filteredResults.slice(start, start + fxrState.perPage);

  countEl.textContent = total;

  if (total === 0) {
    grid.innerHTML = `
      <div class="fxr-empty-state">
        <div class="fxr-empty-icon">🔍</div>
        <div class="fxr-empty-title">لا توجد نتائج</div>
        <div class="fxr-empty-sub">حاول تغيير كلمة البحث أو الفلاتر</div>
      </div>
    `;
  } else {
    grid.innerHTML = paginatedResults.map(fxrBuildProviderCard).join('');
  }

  fxrRenderPagination(total);
}

function fxrRenderPagination(total) {
  const pages = Math.ceil(total / fxrState.perPage);
  const paginationEl = document.getElementById('pagination');
  if (!paginationEl) return;
  
  if (pages <= 1) {
    paginationEl.innerHTML = '';
    return;
  }

  let html = `<button class="fxr-page-btn" onclick="fxrChangePage(-1)">→</button>`;
  
  for (let i = 1; i <= Math.min(pages, 5); i++) {
    const active = i === fxrState.page ? 'active' : '';
    html += `<button class="fxr-page-btn ${active}" onclick="fxrSetPage(${i})">${i}</button>`;
  }
  
  html += `<button class="fxr-page-btn" onclick="fxrChangePage(1)">←</button>`;
  paginationEl.innerHTML = html;
}

// ========================================
// PAGINATION FUNCTIONS
// ========================================
function fxrSetPage(page) {
  const pages = Math.ceil(fxrState.filteredResults.length / fxrState.perPage);
  if (page < 1 || page > pages) return;
  fxrState.page = page;
  fxrRenderResults();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function fxrChangePage(direction) {
  fxrSetPage(fxrState.page + direction);
}

// ========================================
// EVENT HANDLERS
// ========================================
function fxrPerformSearch() {
  const input = document.getElementById('searchInput');
  fxrState.query = input ? input.value.trim() : '';
  fxrState.page = 1;
  fxrApplyFilters();
}

function fxrQuickFilter(el, cat) {
  document.querySelectorAll('.fxr-qf-chip').forEach(chip => {
    chip.classList.remove('active');
  });
  el.classList.add('active');
  fxrState.category = cat;
  fxrState.page = 1;
  fxrApplyFilters();
}

function fxrResetFilters() {
  // Reset governorate checkboxes (select only Amman by default)
  const govIds = ['amman', 'irbid', 'zarqa', 'aqaba', 'salt', 'mafraq', 
                  'karak', 'maan', 'tafilah', 'ajloun', 'jarash', 'madaba'];
  govIds.forEach(id => {
    const checkbox = document.getElementById(`gov-${id}`);
    if (checkbox) checkbox.checked = false;
  });
  document.getElementById('gov-amman').checked = true;
  
  // Reset rating filter
  const ratingAll = document.getElementById('rating-all');
  if (ratingAll) ratingAll.checked = true;
  
  // Reset availability
  const availableOnly = document.getElementById('availableOnly');
  if (availableOnly) availableOnly.checked = false;
  
  // Reset quick filters
  document.querySelectorAll('.fxr-qf-chip').forEach(chip => {
    chip.classList.remove('active');
  });
  const allChip = document.querySelector('.fxr-qf-chip[data-cat=""]');
  if (allChip) allChip.classList.add('active');
  
  // Reset state
  fxrState.category = '';
  fxrState.query = '';
  fxrState.page = 1;
  
  // Clear search input
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';
  
  fxrApplyFilters();
  fxrShowToast('🔄 تم إعادة تعيين جميع الفلاتر');
}

// ========================================
// SORT CHANGE HANDLER
// ========================================
function setupSortListener() {
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', function(e) {
      fxrState.sortBy = e.target.value;
      fxrState.page = 1;
      fxrSortResults();
    });
  }
}

// ========================================
// SEARCH INPUT ENTER KEY
// ========================================
function setupSearchEnterKey() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') fxrPerformSearch();
    });
  }
}

// ========================================
// INITIALIZE
// ========================================
function fxrInit() {
  // Read URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('q')) {
    fxrState.query = urlParams.get('q');
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = fxrState.query;
  }
  if (urlParams.get('cat')) {
    fxrState.category = urlParams.get('cat');
    const chip = document.querySelector(`.fxr-qf-chip[data-cat="${fxrState.category}"]`);
    if (chip) {
      document.querySelectorAll('.fxr-qf-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    }
  }
  
  setupSortListener();
  setupSearchEnterKey();
  fxrApplyFilters();
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', fxrInit);