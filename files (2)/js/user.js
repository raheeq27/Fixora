/**
 * FIXORA — user profile page (client)
 */
'use strict';

const api = window.FixoraAPI;

const GOV_AR = {
  Amman: 'عمّان',
  Irbid: 'إربد',
  Zarqa: 'الزرقاء',
  Balqa: 'البلقاء',
  Salat: 'السلط',
  Mafraq: 'المفرق',
  Jerash: 'جرش',
  Ajloun: 'عجلون',
  Madaba: 'مأدبا',
  Karak: 'الكرك',
  Tafilah: 'الطفيلة',
  "Ma'an": 'معان',
  Aqaba: 'العقبة'
};

const STATUS_LABELS = {
  pending: 'قيد الانتظار',
  confirmed: 'مقبول',
  in_progress: 'جاري التنفيذ',
  completed: 'مكتمل',
  rejected: 'مرفوض',
  cancelled: 'ملغى'
};

function govLabel(g) {
  return GOV_AR[g] || g || '—';
}

async function loadUserProfile() {
  if (api && !api.requireAuth('client')) return;

  const userId = localStorage.getItem('userId');
  if (!userId) return;

  try {
    const [profileRes, bookingsRes, favRes] = await Promise.all([
      api.getProfile(userId),
      api.getMyBookings().catch(() => ({ data: [] })),
      api.getFavorites().catch(() => ({ data: [] }))
    ]);

    const user = profileRes.user || profileRes;
    if (!user) return;

    const profileUser = {
      ...user,
      profile_pic_url: user.profile_pic_url || null
    };
    sessionStorage.setItem('fixora_current_user', JSON.stringify(profileUser));

    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'مستخدم';
    const picUrl = user.profile_pic_url || localStorage.getItem('fixora_client_avatar') || null;
    const area = user.detailed_area || user.area || user.address || '';
    const location = [govLabel(user.governorate), area].filter(Boolean).join(' – ') || '—';
    const joinDate = user.created_at
      ? new Date(user.created_at).toLocaleDateString('ar-JO', { day: 'numeric', month: 'long', year: 'numeric' })
      : '—';

    const bookings = bookingsRes.data || [];
    const favorites = favRes.data || [];

    const set = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    set('userName', fullName);

    const avatarWrap = document.querySelector('.profile-header .profile-avatar');
    if (avatarWrap) {
      if (picUrl) {
        avatarWrap.innerHTML = `<img src="${picUrl}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
      } else {
        avatarWrap.textContent = '👤';
      }
    }
    set('displayFullName', fullName);
    set('displayPhone', user.phone || '—');
    set('displayEmail', user.email || '—');
    set('displayLocation', location);
    set('displayJoinDate', joinDate);

    const locationBadge = document.getElementById('profileLocationBadge');
    if (locationBadge) locationBadge.textContent = `📍 ${location}`;

    const statsEl = document.getElementById('profileStats');
    if (statsEl) {
      statsEl.innerHTML = `
        <span>📋 ${bookings.length} طلب</span>
        <span>❤️ ${favorites.length} حرفي مفضل</span>
      `;
    }

    const totalOrders = document.getElementById('statTotalOrders');
    const statFavs = document.getElementById('statFavorites');
    if (totalOrders) totalOrders.textContent = String(bookings.length);
    if (statFavs) statFavs.textContent = String(favorites.length);

    renderOrdersList(bookings);
    renderFavoritesList(favorites);
  } catch (e) {
    console.warn('تعذر تحميل الملف الشخصي', e);
  }
}

function renderOrdersList(bookings) {
  const ordersList = document.getElementById('ordersList');
  if (!ordersList) return;

  if (!bookings.length) {
    ordersList.innerHTML = '<p class="text-muted">لا توجد طلبات بعد.</p>';
    return;
  }

  ordersList.innerHTML = bookings.slice(0, 5).map((b) => {
    const s = String(b.status || '').toLowerCase();
    const label = STATUS_LABELS[s] || b.status;
    const date = b.scheduled_at || b.created_at;
    const when = date
      ? new Date(date).toLocaleDateString('ar-JO', { day: 'numeric', month: 'short' })
      : '—';
    return `
      <a href="user-dashboard.html?tab=tab-orders" class="profile-order-row">
        <span class="profile-order-title">${b.category_name || 'طلب خدمة'}</span>
        <span class="profile-order-meta">${(b.provider_name || 'فني').trim()} · ${when}</span>
        <span class="profile-order-status">${label}</span>
      </a>`;
  }).join('');
}

function renderFavoritesList(favorites) {
  const favoritesList = document.getElementById('favList');
  if (!favoritesList) return;

  if (!favorites.length) {
    favoritesList.innerHTML = '<p class="text-muted">لا يوجد حرفيون في المفضلة.</p>';
    return;
  }

  favoritesList.innerHTML = favorites.slice(0, 6).map((f) => {
    const name = `${f.first_name || ''} ${f.last_name || ''}`.trim() || 'حرفي';
    const id = f.provider_profile_id || f.id;
    return `
      <a href="user-dashboard.html?tab=tab-favorites" class="profile-fav-chip" title="${name}">
        <span class="profile-fav-initial">${name.charAt(0)}</span>
        <span class="profile-fav-name">${name}</span>
      </a>`;
  }).join('');
}

function logout() {
  if (window.FixoraAccess) {
    window.FixoraAccess.logout();
    return;
  }
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = 'login.html';
}

window.handleLogout = logout;

document.addEventListener('DOMContentLoaded', () => {
  loadUserProfile();

  document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
  });

  document.querySelectorAll('[data-fxr-logout]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  });

  document.getElementById('editProfileBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'user-dashboard.html?tab=tab-profile';
  });

  document.getElementById('viewAllOrdersBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'user-dashboard.html?tab=tab-orders';
  });

  document.getElementById('viewAllFavoritesBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'user-dashboard.html?tab=tab-favorites';
  });
});
