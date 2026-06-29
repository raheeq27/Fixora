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
    'Salat': 'السلط',
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
    const rating = parseFloat(p.avg_rating) || 0;
    const stars = fxrBuildStars(rating);
    const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'فني';
    const govArabic = govTranslate[p.governorate] || p.governorate || '';
    const avatarContent = p.profile_pic_url
        ? `<img src="${p.profile_pic_url}" alt="" class="fxr-provider-avatar-img">`
        : '👷';

    const tagsHtml = [govArabic].filter(Boolean)
        .map(t => `<span class="fxr-tag">${t}</span>`)
        .join('');

    return `
        <div class="fxr-provider-card">
            <div class="fxr-provider-card-head">
                <div class="fxr-avatar fxr-avatar-blue fxr-provider-card-avatar">${avatarContent}</div>
                <div>
                    <div class="fxr-provider-name">${fullName}</div>
                    <div class="fxr-provider-specialty">${p.specialty || 'مقدم خدمة'}</div>
                </div>
            </div>
            <div class="fxr-provider-rating">
                ${stars}
                <span>${rating > 0 ? rating : 'جديد'}</span>
            </div>
            <div class="fxr-provider-tags">
                ${tagsHtml}
            </div>
            <div style="display:flex;gap:8px;margin-top:8px">
            <a href="privider.html?id=${p.id}" class="fxr-btn fxr-btn-primary" style="flex:1; text-align:center;">
                الحساب الشخصي
            </a>
            <a href="booking.html?id=${p.id}" class="fxr-btn fxr-btn-primary" style="flex:1; text-align:center;">
                احجز الآن
            </a>
            </div>
        </div>
    `;
}

// دالة جلب الحرفيين الموثوقين من السيرفر
async function fxrRenderTopProviders() {
    const grid = document.getElementById('fxrTopProviders');
    if (!grid) return;

    try {
        const json = await window.FixoraAPI.getProviders({ limit: 6 });
        const providers = json.data || [];
        if (!Array.isArray(providers) || providers.length === 0) {
            grid.innerHTML = '<p class="text-white text-center w-100">لا يوجد فنيون مسجلون بعد</p>';
            return;
        }
        grid.innerHTML = providers.map(fxrBuildProviderCard).join('');
        
    } catch (error) {
        console.error("خطأ:", error);
        grid.innerHTML = '<p class="text-white text-center w-100">تأكدي من تشغيل السيرفر (node app.js)</p>';
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

window.fxrGoSearch = fxrGoSearch;

function fxrCatClick(element) {
  const specialty = element.getAttribute('data-cat');
  if (specialty) {
    window.location.href = `search.html?specialty=${encodeURIComponent(specialty)}`;
  }
}

async function fxrApplyProviderHomeView() {
  const role = window.FixoraAccess?.getRole?.();
  if (role !== 'provider') return;

  ['.fxr-cats-section', '.fxr-top-section'].forEach((sel) => {
    const el = document.querySelector(sel);
    if (el) el.style.display = 'none';
  });

  const heroTitle = document.querySelector('.fxr-hero-title');
  const heroSub = document.querySelector('.fxr-hero-sub');
  if (heroTitle) {
    heroTitle.innerHTML = 'مرحباً بك في <span>FIXORA</span><br>مساحة الحرفي';
  }
  if (heroSub) {
    heroSub.innerHTML = 'تابع طلبات العمل، حدّث خدماتك، وأدر حسابك من مكان واحد';
  }

  let displayName = localStorage.getItem('userName') || '';
  try {
    const prof = await window.FixoraAPI?.getProviderProfile?.();
    const p = prof?.profile || {};
    const full = `${p.first_name || ''} ${p.last_name || ''}`.trim();
    if (full) {
      displayName = full.split(' ')[0] || full;
      localStorage.setItem('userName', displayName);
    }
  } catch (_) { /* keep cached */ }

  if (!displayName) displayName = 'حرفي';

  const searchBlock = document.getElementById('fxrHeroSearchBlock');
  if (searchBlock) {
    searchBlock.className = 'fxr-hero-provider-welcome fxr-animate fxr-animate-d3';
    searchBlock.innerHTML = `
      <div class="fxr-provider-welcome-card">
        <p class="fxr-provider-welcome-greet">مرحباً ${displayName} 👋</p>
        <p class="fxr-provider-welcome-hint">أدر طلباتك وخدماتك وجدول عملك من لوحة التحكم</p>
        <div class="fxr-hero-provider-actions">
          <a href="provider-dashboard.html" class="fxr-provider-hero-btn primary">🛠️ لوحة التحكم</a>
          <a href="provider-dashboard.html#orders" class="fxr-provider-hero-btn outline">📥 طلبات العمل</a>
          <a href="provider-dashboard.html#messages" class="fxr-provider-hero-btn outline">💬 الرسائل</a>
        </div>
      </div>
    `;
  }
}

function fxrApplyClientHomeView() {
  const role = window.FixoraAccess?.getRole?.();
  if (role !== 'client') return;

  const heroTitle = document.querySelector('.fxr-hero-title');
  const heroSub = document.querySelector('.fxr-hero-sub');
  if (heroTitle) {
    heroTitle.innerHTML = 'مرحباً في <span>FIXORA</span><br>ابحث عن حرفي موثوق';
  }
  if (heroSub) {
    heroSub.innerHTML = 'احجز خدمتك المنزلية بسهولة من أي محافظة في الأردن — استخدم البحث أدناه';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const role = window.FixoraAccess?.getRole?.();
  if (role !== 'provider') {
    fxrRenderTopProviders();
  }
  await fxrApplyProviderHomeView();
  fxrApplyClientHomeView();
});