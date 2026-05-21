/**
 * FIXORA — search.js
 * JavaScript الخاص بصفحة البحث والفلترة
 */

'use strict';

let fxrState = {
    query: '',
    category: '',
    page: 1,
    limit: 6
};

// دالة الفلترة الأساسية التي يتم استدعاؤها عند تغيير أي خيار بالفلاتر
window.fxrApplyFilters = function() {
    fxrState.page = 1; 
    renderSearch();
};

// الدالة الأساسية لجلب البيانات وعرضها داخل الـ Grid
async function renderSearch() {
    const grid = document.getElementById('resultsGrid');
    const countEl = document.getElementById('resultsCount');
    
    if (grid) grid.innerHTML = '<div class="text-center w-100 p-4">جاري تحميل الحرفيين الموثوقين...</div>';

    // 1. خريطة مطابقة المحافظات مع الـ ENUM المكتوب بالـ Database (بدقة)
    const govsMap = {
        'amman': 'Amman',
        'irbid': 'Irbid',
        'zarqa': 'Zarqa',
        'aqaba': 'Aqaba',
        'madaba': 'Madaba',
        'mafraq': 'Mafraq',
        'salt': 'Balqa',   // في قاعدة البيانات مكتوبة Balqa (البلقاء/السلط)
        'karak': 'Karak',
        'tafilah': 'Tafileh',
        'maan': "Ma'an",   // مكتوبة Ma'an مع الإسكيب سينس
        'ajloun': 'Ajloun',
        'jarash': 'Jerash'
    };

    const selectedGovs = Array.from(document.querySelectorAll('.fxr-filter-panel input[type="checkbox"]'))
                               .filter(cb => cb.id && cb.id.startsWith('gov-') && cb.checked)
                               .map(cb => {
                                   const key = cb.id.replace('gov-', '');
                                   return govsMap[key] || key;
                               });

    // 2. قراءة حالة تشيك بوكس الإتاحة والتقييم
    const isAvailableOnly = document.getElementById('availableOnly')?.checked ? true : false;
    const selectedRating = document.querySelector('input[name="ratingFilter"]:checked')?.value || 'all';

    // 3. طلب البيانات من السيرفر وإرسال حالة الإتاحة
    const { data, totalCount } = await SearchAPI.search({
        query: fxrState.query,
        category: fxrState.category,
        govs: selectedGovs,
        available: isAvailableOnly, // رح تنبعث true أو false للسيرفر
        rating: selectedRating,
        page: fxrState.page
    });

    if (countEl) countEl.textContent = totalCount;

    // 4. في حال عدم وجود نتائج
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

    // 5. رندرة كروت الحرفيين داخل الصفحة
    if (grid) {
        grid.innerHTML = data.map(p => `
            <div class="fxr-provider-card shadow-sm border p-3 mb-3" style="border-radius: 15px; background: #fff;">
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
                    ${isAvailableOnly ? `<div class="badge bg-success mt-1" style="font-size: 11px;">متاح الآن 🟢</div>` : ''}
                </div>
                <a href="privider.html?id=${p.user_id || p.id}" class="btn btn-primary w-100" style="border-radius: 10px; background-color: #f07a26; border: none;">عرض البروفايل</a>
            </div>
        `).join('');
    }
}

// دالة إعادة التعيين (Reset) وتنظيف المدخلات
window.fxrResetFilters = () => {
    document.querySelectorAll('.fxr-filter-panel input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.getElementById('rating-all').checked = true;
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

// الفلترة السريعة عبر التبويبات (Chips)
window.fxrQuickFilter = function(button, category) {
    document.querySelectorAll('.fxr-qf-chip').forEach(chip => chip.classList.remove('active'));
    button.classList.add('active');
    
    fxrState.category = category;
    fxrApplyFilters();
};

// تفعيل زر البحث الأساسي
window.fxrPerformSearch = function() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        fxrState.query = searchInput.value.trim();
    }
    fxrApplyFilters();
};

// استقبال البارامترات عند تحميل الصفحة
async function fxrInitSearch() {
    const urlParams = new URLSearchParams(window.location.search);
    const specialty = urlParams.get('specialty');
    const query = urlParams.get('query');
    const activeTerm = specialty || query;

    if (activeTerm) {
        fxrState.category = specialty ? specialty : '';
        fxrState.query = activeTerm;
        
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = activeTerm;

        const chips = document.querySelectorAll('.fxr-qf-chip');
        chips.forEach(chip => {
            const chipAttr = chip.getAttribute('data-cat') || '';
            if (chipAttr === activeTerm) {
                chip.classList.add('active');
            } else {
                chip.classList.remove('active');
            }
        });
    }

    await renderSearch();
}

document.addEventListener('DOMContentLoaded', fxrInitSearch);