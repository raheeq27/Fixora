/**
 * FIXORA — fxr-home.js
 * JavaScript الخاص بالصفحة الرئيسية
 */

'use strict';

// قاموس بسيط لتحويل رموز المحافظات للعربي عند العرض فقط
const govTranslate = {
   'Amman': 'عمّان',
    'Irbid': 'إربد',
    'Zarqa': 'الزرقاء',
    'Balqa': 'البلقاء',
    'Mafraq': 'المفرق',
    'Jerash': 'جرش',
    'Ajloun': 'عجلون',
    'Madaba': 'مأدبا',
    'Karak': 'الكرك',
    'Tafilah': 'الطفيلة',
    'Ma\'an': 'معان',
    'Aqaba': 'العقبة'
};

function fxrBuildStars(rating) {
    const full = Math.floor(rating);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
}

function fxrBuildProviderCard(p) {
    const stars = fxrBuildStars(p.avg_rating); 
    const availLabel = p.available
        ? '<span class="fxr-status fxr-status-available">متاح ✅</span>'
        : '<span class="fxr-status fxr-status-busy">مشغول</span>';

    const fullName = `${p.first_name} ${p.last_name}`;
    const govArabic = govTranslate[p.governorate] || p.governorate;

    const tagsHtml = [govArabic, ...p.areas.slice(0, 1)]
        .map(t => `<span class="fxr-tag">${t}</span>`)
        .join('');

    return `
        <div class="fxr-provider-card">
            <div class="fxr-provider-card-head">
                <div class="fxr-avatar ${p.avatarClass}">${p.avatar}</div>
                <div>
                    <div class="fxr-provider-name">${fullName}</div>
                    <div class="fxr-provider-specialty">${p.specialty}</div>
                </div>
            </div>
            <div class="fxr-provider-rating">
                ${stars}
                <span>${p.avg_rating} <span>(${p.reviewCount} تقييم)</span></span>
                &nbsp; ${availLabel}
            </div>
            <div class="fxr-provider-tags">
                ${tagsHtml}
            </div>
            <a href="provider.html?id=${p.id}" class="fxr-btn fxr-btn-outline" style="flex:1; text-align:center;">
                عرض البروفايل
            </a>
        </div>
    `;
}

// دالة جلب الحرفيين الموثوقين من السيرفر
async function fxrRenderTopProviders() {
    const grid = document.getElementById('fxrTopProviders');
    if (!grid) return;

    try {
        const response = await fetch('http://localhost:3000/api/providers');
        if (!response.ok) throw new Error('خطأ في الاتصال بالسيرفر');
        
        const providers = await response.json();
        grid.innerHTML = providers.map(fxrBuildProviderCard).join('');
        
    } catch (error) {
        console.error("خطأ:", error);
        grid.innerHTML = '<p class="text-white text-center w-100">تأكدي من تشغيل السيرفر (node app.js)</p>';
    }
}

// دالة الفحص والتحويل الداينمك للـ Header
function checkDynamicHeader() {
    const headerBtns = document.querySelector('.fxr-header-btns');
    const userData = sessionStorage.getItem('fixora_current_user');

    if (userData && headerBtns) {
        const user = JSON.parse(userData);

        headerBtns.innerHTML = `
            <div class="d-flex align-items-center gap-3">
                <span class="fw-bold" style="color: #3f4a4f;">أهلاً، ${user.name} 👋</span>
                <button onclick="logout()" class="fxr-btn fxr-btn-outline" style="padding: 5px 15px;">خروج</button>
            </div>
        `;
    }
}

// دالة البحث من الصفحة الرئيسية
function fxrGoSearch() {
    const q = document.getElementById('fxrMainSearchInput')?.value.trim();
    if (q) {
        window.location.href = `search.html?q=${encodeURIComponent(q)}`;
    } else {
        window.location.href = 'search.html';
    }
}

// ربط دالة البحث بـ window لتكون متاحة في الـ HTML
window.fxrGoSearch = fxrGoSearch;

// دالة تسجيل الخروج الداينمك
window.logout = () => {
    sessionStorage.removeItem('fixora_current_user');
    window.location.reload(); 
};

// تشغيل كل الوظائف عند تحميل الصفحة مرة واحدة وبكفاءة
document.addEventListener('DOMContentLoaded', () => {
    checkDynamicHeader();      // تشغيل الهيدر الداينمك فوراً
    fxrRenderTopProviders();   // جلب الحرفيين الأعلى تقييماً
});
function fxrCatClick(element) {
  const specialty = element.getAttribute('data-cat');
  if (specialty) {
    window.location.href = `search.html?specialty=${encodeURIComponent(specialty)}`;
  }
}

function fxrGoSearch() {
  const searchInput = document.getElementById('fxrMainSearchInput');
  if (searchInput) {
    const keyword = searchInput.value.trim();
    if (keyword) {
      window.location.href = `search.html?query=${encodeURIComponent(keyword)}`;
    } else {
      window.location.href = 'search.html';
    }
  }
}