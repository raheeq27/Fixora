/**
 * FIXORA — search.js
 * (النسخة المستقرة - نسخة امبارح السريعة)
 */

'use strict';

let fxrState = {
    query: '',
    category: '',
    page: 1,
    limit: 6
};

// الدالة الأساسية لتشغيل الفلترة وإعادة الرندرة
window.fxrApplyFilters = function() {
    fxrState.page = 1; 
    renderSearch();
};

// دالة جلب البيانات وعرضها بداخل الـ Grid
async function renderSearch() {
    const grid = document.getElementById('resultsGrid');
    const countEl = document.getElementById('resultsCount');
    
    if (grid) grid.innerHTML = '<div class="text-center w-100 p-4">جاري تحميل الحرفيين الموثوقين...</div>';

    // خريطة المحافظات لتطابق الـ DB
    const govsMap = {
        'amman': 'Amman',
        'irbid': 'Irbid',
        'zarqa': 'Zarqa',
        'salt': 'Salat',
        'aqaba': 'Aqaba',
        'madaba': 'Madaba',
        'mafraq': 'Mafraq',
        'balqa': 'Balqa',
        'karak': 'Karak',
        'tafilah': 'Tafileh',
        'maan': "Ma'an",
        'ajloun': 'Ajloun',
        'jarash': 'Jerash'
    };

    // تجميع المحافظات المحددة
    let selectedGovs = Array.from(document.querySelectorAll('.fxr-filter-panel input[type="checkbox"]'))
                               .filter(cb => cb.id && cb.id.startsWith('gov-') && cb.checked)
                               .map(cb => {
                                   const key = cb.id.replace('gov-', '');
                                   return govsMap[key] || key;
                               });

    const isAvailableOnly = document.getElementById('availableOnly')?.checked ? true : false;
    const selectedRating = document.querySelector('input[name="ratingFilter"]:checked')?.value || 'all';

    try {
        // الاتصال مباشرة بالـ API الخاص بـ Fixora
        const { data, totalCount } = await window.FixoraAPI.SearchAPI.search({
            query: fxrState.query,
            category: fxrState.category,
            govs: selectedGovs,
            available: isAvailableOnly,
            rating: selectedRating,
            page: fxrState.page
        });

        if (countEl) countEl.textContent = totalCount || 0;

        if (!data || data.length === 0) { 
            if (grid) {
                grid.innerHTML = `
                    <div class="fxr-empty-state text-center w-100 p-5">
                        <div style="font-size: 60px;">🕵️‍♂️</div>
                        <h4 class="mt-3">لم نجد نتائج تطابق خيارات التصفية الحالية</h4>
                        <p class="text-muted">جرب تغيير المحافظة أو إلغاء فلتر "متاح الآن"</p>
                        <button class="btn btn-primary mt-2" onclick="fxrResetFilters()">إعادة تعيين البحث</button>
                    </div>`;
            }
            return;
        }

        if (grid) {
            grid.innerHTML = data.map(p => {
              const banned = p.is_banned === true;
              const bookBtn = banned
                ? `<span class="btn btn-secondary w-100 mt-2 disabled" style="border-radius: 10px; opacity: 0.85; cursor: not-allowed;">🚫 غير متاح للحجز</span>`
                : `<a href="booking.html?id=${p.id}" class="btn btn-outline-secondary w-100 mt-2" style="border-radius: 10px;">احجز الآن</a>`;
              const bannedBadge = banned
                ? '<div class="text-danger small mt-1 fw-bold">🚫 الحرفي غير متاح للحجز</div>'
                : '';
              return `
                <div class="fxr-provider-card shadow-sm border p-3 mb-3" style="border-radius: 15px; background: #fff;${banned ? ' opacity: 0.92;' : ''}">
                    <div class="d-flex align-items-center mb-3">
                        <div class="fxr-avatar-circle" style="width: 50px; height: 50px; background: #eee; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; overflow: hidden;">
                            ${p.profile_pic_url ? `<img src="${p.profile_pic_url}" style="width:100%; height:100%; object-fit:cover;">` : '👷'}
                        </div>
                        <div class="ms-3" style="margin-right: 12px;">
                            <h6 class="mb-0 fw-bold">${p.first_name ? p.first_name + ' ' + (p.last_name || '') : 'حرفي فيكسورا'}</h6>
                            <small style="color: #f07a26; font-weight: 600;">${p.specialty || fxrState.category || 'مقدم خدمة'}</small>
                        </div>
                    </div>
                    <div class="mb-3">
                        <span class="me-2">⭐ ${p.avg_rating && parseFloat(p.avg_rating) > 0 ? p.avg_rating : 'جديد'}</span>
                        <div class="text-muted small mt-1">📍 المحافظة: ${p.governorate || 'غير محدد'}</div>
                        ${bannedBadge}
                    </div>
                    <a href="privider.html?id=${p.id}" class="btn btn-primary w-100" style="border-radius: 10px; background-color: #f07a26; border: none;">عرض الحساب</a>
                    ${bookBtn}
                </div>`;
            }).join('');
        }
    } catch (error) {
        console.error("خطأ بطلب البحث جافاسكريبت:", error);
        if (grid) grid.innerHTML = '<div class="text-center text-danger w-100 p-4">حدث خطأ أثناء جلب البيانات.</div>';
    }
}

// دالة تفريغ وإعادة تعيين البحث بالكامل (Reset)
window.fxrResetFilters = () => {
    document.querySelectorAll('.fxr-filter-panel input[type="checkbox"]').forEach(cb => cb.checked = false);
    
    // إعادة تفعيل عمان كافتراضي إذا أردتِ
    const ammanCb = document.getElementById('gov-amman');
    if (ammanCb) ammanCb.checked = true;

    const rateAll = document.getElementById('rating-all');
    if (rateAll) rateAll.checked = true;
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    
    document.querySelectorAll('.fxr-qf-chip').forEach(chip => chip.classList.remove('active'));
    const allChip = document.querySelector('.fxr-qf-chip[data-cat=""]');
    if (allChip) allChip.classList.add('active');

    fxrState.query = '';
    fxrState.category = '';
    fxrState.page = 1;
    renderSearch();
};

// الفلترة السريعة بالضغط على الـ Chips
window.fxrQuickFilter = function(button, category) {
    document.querySelectorAll('.fxr-qf-chip').forEach(chip => chip.classList.remove('active'));
    button.classList.add('active');
    
    fxrState.category = category;
    fxrState.query = category; 
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = category;

    fxrApplyFilters();
};

// كبسة زر البحث العلوية
window.fxrPerformSearch = function() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        fxrState.query = searchInput.value.trim();
    }
    fxrApplyFilters();
};

// دالة الاستقبال الفورية (تثبيت الكلمة بالصندوق وتلوين الـ Chip وتشغيل السيرش فوراً)
function fxrInitSearch() {
    const urlParams = new URLSearchParams(window.location.search);
    const queryParam = urlParams.get('q') || urlParams.get('query') || urlParams.get('specialty') || '';
    
    if (queryParam) {
        fxrState.query = queryParam;
        
        // 1. تثبيت النص بداخل صندوق البحث
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = queryParam;
        }

        // 2. تلوين الـ Chip المطابق للكلمة
        const chips = document.querySelectorAll('.fxr-qf-chip');
        chips.forEach(chip => {
            const cat = chip.getAttribute('data-cat') || '';
            if (cat === queryParam || chip.textContent.includes(queryParam)) {
                chip.classList.add('active');
            } else {
                chip.classList.remove('active');
            }
        });
    }

    // رندرة فورية بمجرد الدخول
    renderSearch();
}

// التشغيل المباشر الآمن أول ما تفتح الصفحة
document.addEventListener('DOMContentLoaded', fxrInitSearch);