/**
 * FIXORA — بحث الفنيين (بيانات من API فقط)
 */
'use strict';

const api = window.FixoraAPI;

var fxrState = {
  query: '',
  category: '',
  maxPrice: 50,
  sortBy: 'rating',
  page: 1,
  perPage: 6,
  filtered: []
};

function fxrBuildStars(rating) {
  const full = Math.floor(parseFloat(rating) || 0);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

function fxrBuildExtendedCard(p) {
  const stars = fxrBuildStars(p.avg_rating);
  const name = `${p.first_name || ''} ${p.last_name || ''}`.trim();
  const profileId = p.id || p.provider_profile_id;
  const avatar = p.profile_pic_url
    ? `<img src="${p.profile_pic_url}" alt="" style="width:48px;height:48px;border-radius:50%;object-fit:cover">`
    : '👷';

  return `<div class="fxr-provider-card-extended">
    <div class="fxr-pcard-head">
      <div class="fxr-avatar fxr-avatar-blue">${avatar}</div>
      <div class="fxr-pcard-info">
        <div class="fxr-pcard-name">${name}</div>
        <div class="fxr-pcard-specialty">${p.specialty || 'فني'}</div>
      </div>
    </div>
    <div class="fxr-pcard-rating">${stars} ${p.avg_rating || 'جديد'}</div>
    <div class="fxr-pcard-tags">
      <span class="fxr-tag">${p.governorate || ''}</span>
      ${p.is_verified ? '<span class="fxr-tag">موثّق</span>' : ''}
    </div>
    <div class="fxr-pcard-actions">
      <a href="privider.html?id=${profileId}" class="fxr-btn fxr-btn-primary fxr-btn-sm" style="flex:1;justify-content:center">عرض البروفايل</a>
      <a href="booking.html?id=${profileId}" class="fxr-btn fxr-btn-outline-dark fxr-btn-sm">📅 احجز</a>
    </div>
  </div>`;
}

async function fxrApplyFilters() {
  const grid = document.getElementById('fxrSearchGrid') || document.getElementById('resultsGrid');
  if (grid) grid.innerHTML = '<p class="text-center w-100">جاري التحميل...</p>';

  try {
    const { data } = await api.SearchAPI.search({
      query: fxrState.query,
      category: fxrState.category
    });
    fxrState.filtered = data || [];
    const start = (fxrState.page - 1) * fxrState.perPage;
    const pageItems = fxrState.filtered.slice(start, start + fxrState.perPage);

    if (grid) {
      grid.innerHTML = pageItems.length
        ? pageItems.map(fxrBuildExtendedCard).join('')
        : '<p class="text-center w-100">لا يوجد فنيون مطابقون. <a href="register.html">سجّل كفني</a></p>';
    }
  } catch (e) {
    if (grid) grid.innerHTML = `<p class="text-danger text-center">${e.message}</p>`;
  }
}

document.addEventListener('DOMContentLoaded', () => fxrApplyFilters());