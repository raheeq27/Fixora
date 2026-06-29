/**
 * FIXORA - لوحة تحكم العميل (User Dashboard)
 */
'use strict';

if (window.FixoraAPI && !window.FixoraAPI.requireAuth('client')) {
  /* redirected */
}

const fallbackUserData = {
  name: 'مستخدم فيكسورا',
  phone: '0790000000',
  email: 'user@fixora.com',
  city: 'عمّان',
  area: 'الشميساني'
};

let notificationsData = [];
let favoritesData = [];
let messagesData = [];
let allBookings = [];
let currentOrderFilter = 'all';
let pendingAvatarDataUrl = null;

const api = () => window.FixoraAPI;

const STATUS_LABELS = {
  pending: 'قيد الانتظار',
  confirmed: 'مقبول',
  in_progress: 'جاري التنفيذ',
  completed: 'مكتمل',
  rejected: 'مرفوض',
  cancelled: 'ملغى'
};

const STATUS_BADGE_CLASS = {
  pending: 'status-pending',
  confirmed: 'status-confirmed',
  in_progress: 'status-progress',
  completed: 'status-done',
  rejected: 'status-rejected',
  cancelled: 'status-cancelled'
};

function normalizeStatus(status) {
  return String(status || '').toLowerCase().trim();
}

function setSidebarBadge(id, count) {
  const el = document.getElementById(id);
  if (!el) return;
  if (count > 0) {
    el.textContent = count;
    el.style.display = '';
  } else {
    el.textContent = '0';
    el.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const currentUser = JSON.parse(sessionStorage.getItem('fixora_current_user') || 'null');

  initializeTabs();
  initializeLogout();
  initializeNotifications();
  initializeOrderFilters();
  initializeProfilePicture();
  fetchUserDataFromServer();
  loadFavoritesFromApi();
  loadBookingsForMessages();
  openTabFromUrl();

  if (currentUser && (currentUser.first_name || currentUser.firstName)) {
    displayWelcomeMessage(currentUser);
    populateProfileFields(currentUser);
    displayProfileAvatar(currentUser.profile_pic_url);
  }

  initializeProfileUpdate();
  window.fxrInitNotifications?.();
});

function initializeTabs() {
  const sidebarItems = document.querySelectorAll('.sidebar-item[data-tab]');
  const tabPanels = document.querySelectorAll('.tab-panel');
  const viewAllButtons = document.querySelectorAll('.view-all-btn');

  function switchTab(tabId) {
    sidebarItems.forEach((item) => item.classList.remove('active'));
    tabPanels.forEach((panel) => {
      panel.classList.remove('active');
      panel.style.display = 'none';
    });

    const targetSidebarItem = document.querySelector(`.sidebar-item[data-tab="${tabId}"]`);
    if (targetSidebarItem) targetSidebarItem.classList.add('active');

    const targetPanel = document.getElementById(tabId);
    if (targetPanel) {
      targetPanel.classList.add('active');
      targetPanel.style.display = 'block';
    }
  }

  sidebarItems.forEach((item) => {
    item.addEventListener('click', (e) => {
      const tabId = item.getAttribute('data-tab');
      if (!tabId) return;
      e.preventDefault();
      switchTab(tabId);
    });
  });

  viewAllButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const goToTab = btn.getAttribute('data-goto');
      if (goToTab) switchTab(goToTab);
    });
  });

  window.fxrDashboardSwitchTab = switchTab;
}

function openTabFromUrl() {
  const params = new URLSearchParams(location.search);
  const hash = (location.hash || '').replace('#', '');
  const tab = params.get('tab') || hash;
  if (tab && typeof window.fxrDashboardSwitchTab === 'function') {
    window.fxrDashboardSwitchTab(tab);
  }
}

function displayWelcomeMessage(user) {
  const nameDisplay = document.getElementById('userNameDisplay');
  if (!nameDisplay) return;
  const name = user.first_name || user.firstName || user.name || fallbackUserData.name;
  nameDisplay.textContent = `مرحباً ${name} 👋`;
  localStorage.setItem('userName', name);
}

function populateProfileFields(user) {
  if (!user) return;
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el && val != null) el.value = val;
  };
  set('profileFirstName', user.first_name || '');
  set('profileLastName', user.last_name || '');
  set('profilePhone', user.phone || '');
  set('profileEmail', user.email || '');
  set('profileCity', user.governorate || 'Amman');
  set('profileArea', user.detailed_area || user.address || user.area || '');
}

function displayProfileAvatar(url) {
  const img = document.getElementById('profileAvatarImg');
  const fallback = document.getElementById('profileAvatarDefault');
  if (!img || !fallback) return;
  if (url) {
    img.src = url;
    img.style.display = 'block';
    fallback.style.display = 'none';
  } else {
    img.style.display = 'none';
    img.removeAttribute('src');
    fallback.style.display = 'flex';
  }
}

function initializeProfilePicture() {
  const btn = document.getElementById('btnUploadPicture');
  const input = document.getElementById('profilePictureInput');
  if (!btn || !input) return;

  btn.addEventListener('click', () => input.click());
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      pendingAvatarDataUrl = e.target.result;
      displayProfileAvatar(pendingAvatarDataUrl);
    };
    reader.readAsDataURL(file);
  });
}

function initializeOrderFilters() {
  document.querySelectorAll('.order-filters .filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.order-filters .filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentOrderFilter = btn.getAttribute('data-filter') || 'all';
      renderOrdersFromDB(allBookings);
    });
  });
}

function filterBookings(bookings, filterKey) {
  if (filterKey === 'all') return bookings;
  return bookings.filter((b) => {
    const s = normalizeStatus(b.status);
    switch (filterKey) {
      case 'progress':
        return s === 'pending' || s === 'confirmed' || s === 'in_progress';
      case 'accepted':
        return s === 'confirmed';
      case 'completed':
        return s === 'completed';
      case 'rejected':
        return s === 'rejected';
      case 'cancelled':
        return s === 'cancelled';
      default:
        return true;
    }
  });
}

async function fetchUserDataFromServer() {
  let userId = localStorage.getItem('userId');
  if (!userId) {
    const currentUser = JSON.parse(sessionStorage.getItem('fixora_current_user') || 'null');
    userId = currentUser?.id || null;
  }
  if (!userId) return;

  try {
    const result = await api().getProfile(userId);
    const userData = result.user || result;
    if (userData) {
      sessionStorage.setItem('fixora_current_user', JSON.stringify(userData));
      if (userData.profile_pic_url) {
        localStorage.setItem('fixora_client_avatar', userData.profile_pic_url);
      }
      displayWelcomeMessage(userData);
      populateProfileFields(userData);
      displayProfileAvatar(userData.profile_pic_url);
    }

    const bookingsRes = await api().getMyBookings();
    allBookings = bookingsRes.data || [];
    renderOrdersFromDB(allBookings);
    updateSidebarBadges(allBookings);
    renderOverviewFromBookings(allBookings);
    await loadNotificationsFromApi();
  } catch (error) {
    console.warn('[FIXORA]', error.message);
    allBookings = [];
    renderOrdersFromDB([]);
    updateSidebarBadges([]);
    const localName = localStorage.getItem('userName') || fallbackUserData.name;
    const nameDisplay = document.getElementById('userNameDisplay');
    if (nameDisplay) nameDisplay.textContent = `مرحباً ${localName} 👋`;
  }
}

async function loadFavoritesFromApi() {
  try {
    const res = await api().getFavorites();
    favoritesData = (res.data || []).map((f) => ({
      id: f.provider_profile_id,
      name: `${f.first_name || ''} ${f.last_name || ''}`.trim() || 'حرفي',
      specialty: f.specialty || 'مقدم خدمة',
      rating: parseFloat(f.avg_rating) || 0,
      bio: f.bio || ''
    }));
    renderFavorites();
    setSidebarBadge('favBadge', favoritesData.length);
    const favCount = document.querySelector('#tab-dashboard .stats-grid .stat-card:nth-child(3) .stat-number');
    if (favCount) favCount.textContent = favoritesData.length;
  } catch (_) {
    favoritesData = [];
    renderFavorites();
    setSidebarBadge('favBadge', 0);
  }
}

async function loadNotificationsFromApi() {
  try {
    const res = await api().getNotifications();
    const rows = res.data || res.notifications || [];
    notificationsData = rows.map((n) => ({
      id: n.id,
      icon: n.type === 'new_review' ? '⭐' : n.title?.includes('رسالة') ? '💬' : '🔔',
      title: n.title || 'إشعار',
      text: window.fxrNotifDisplayMessage?.(n.message) || n.message || '',
      time: new Date(n.created_at).toLocaleDateString('ar-JO'),
      read: !!n.is_read,
      rawMessage: n.message,
      createdAt: n.created_at
    }));
  } catch (_) {
    notificationsData = [];
  }
  renderNotifications();
  renderOverviewNotifications();
  updateSidebarBadges(allBookings);
}

async function loadBookingsForMessages() {
  try {
    const [bookingsRes, threadsRes] = await Promise.all([
      api().getMyBookings(),
      api().getInquiryThreads().catch(() => ({ data: [] }))
    ]);
    const bookings = bookingsRes.data || [];
    const threads = threadsRes.data || [];

    // map: provider_profile_id => thread
    const threadByProvider = {};
    threads.forEach((t) => {
      const pid = String(t.provider_profile_id || '');
      if (pid) threadByProvider[pid] = t;
    });

    const seenProviders = new Set();
    const combined = [];

    // 1) الحرفيون الذين عندهم inquiry thread
    threads.forEach((t) => {
      const pid = String(t.provider_profile_id || '');
      if (!pid || seenProviders.has(pid)) return;
      seenProviders.add(pid);

      const provBookings = bookings.filter((b) => String(b.provider_id || '') === pid);
      const latestBooking = provBookings[0];

      const previewParts = [];
      if (t.specialty) previewParts.push(t.specialty);
      if (latestBooking?.category_name) previewParts.push(latestBooking.category_name);
      const preview = previewParts.length ? previewParts.join(' - ') : 'محادثة';

      combined.push({
        icon: '💬',
        sender: (t.other_name || 'حرفي').trim(),
        preview,
        time: new Date(
          latestBooking?.updated_at || latestBooking?.created_at || t.created_at
        ).toLocaleDateString('ar-JO'),
        href: `chat.html?inquiryId=${encodeURIComponent(t.id)}`
      });
    });

    // 2) الحرفيون بدون inquiry thread (حجوزات فقط)
    bookings.forEach((b) => {
      const pid = String(b.provider_id || '');
      if (!pid || seenProviders.has(pid)) return;
      seenProviders.add(pid);

      combined.push({
        icon: '💬',
        sender: (b.provider_name || 'فني').trim(),
        preview: b.category_name || b.notes || 'محادثة الحجز',
        time: new Date(b.updated_at || b.created_at).toLocaleDateString('ar-JO'),
        href: `chat.html?bookingId=${encodeURIComponent(b.id)}`
      });
    });

    messagesData = combined.slice(0, 15);
    renderMessages();
    setSidebarBadge('msgBadge', messagesData.length);
  } catch (_) {
    messagesData = [];
    renderMessages();
    setSidebarBadge('msgBadge', 0);
  }
}
async function markNotificationRead(notifId) {
  try {
    await api().markNotificationRead(notifId);
    const n = notificationsData.find((x) => String(x.id) === String(notifId));
    if (n) n.read = true;
    renderNotifications();
    renderOverviewNotifications();
    updateSidebarBadges(allBookings);
    window.fxrRefreshNotifications?.();
  } catch (_) { /* ignore */ }
}

function handleNotificationClick(notifId) {
  const n = notificationsData.find((x) => String(x.id) === String(notifId));
  const link = window.fxrNotifParseLink?.(n?.rawMessage);
  markNotificationRead(notifId);
  if (link) {
    window.location.href = link;
    return;
  }
  window.fxrDashboardSwitchTab?.('tab-notifications');
}

function initializeNotifications() {
  window.fxrOnNotificationsUpdated = () => {
    loadNotificationsFromApi();
  };

  document.getElementById('notifModalClose')?.addEventListener('click', () => {
    const overlay = document.getElementById('notifModalOverlay');
    if (overlay) overlay.hidden = true;
  });

  document.getElementById('notifModalDismiss')?.addEventListener('click', () => {
    const overlay = document.getElementById('notifModalOverlay');
    if (overlay) overlay.hidden = true;
  });

  document.getElementById('notifModalOverlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'notifModalOverlay') e.target.hidden = true;
  });
}

function updateSidebarBadges(bookings) {
  setSidebarBadge('ordersBadge', bookings.length);
  const unread = notificationsData.filter((n) => !n.read).length;
  setSidebarBadge('notifBadge', unread);
}

function renderOverviewFromBookings(bookings) {
  const stats = document.querySelector('#tab-dashboard .stats-grid');
  if (stats) {
    const cards = stats.querySelectorAll('.stat-card .stat-number');
    if (cards[0]) cards[0].textContent = bookings.length;
    const active = bookings.filter((b) => {
      const s = normalizeStatus(b.status);
      return s === 'pending' || s === 'confirmed' || s === 'in_progress';
    }).length;
    if (cards[1]) cards[1].textContent = active;
    if (cards[2]) cards[2].textContent = favoritesData.length;
  }

  const preview = document.getElementById('overviewOrdersPreview');
  if (!preview) return;
  if (!bookings.length) {
    preview.innerHTML = '<p style="text-align:center;color:#7f8c8d;padding:12px">لا توجد طلبات حديثة</p>';
    return;
  }

  preview.innerHTML = bookings.slice(0, 3).map((b) => {
    const s = normalizeStatus(b.status);
    const badge = STATUS_BADGE_CLASS[s] || 'status-pending';
    const label = STATUS_LABELS[s] || b.status;
    return `
      <div class="order-row">
        <span>🔧 ${b.category_name || 'طلب خدمة'}</span>
        <span class="provider-name">${(b.provider_name || 'فني').trim()}</span>
        <span class="status-badge ${badge}">${label}</span>
      </div>`;
  }).join('');
}

function renderOverviewNotifications() {
  const preview = document.getElementById('overviewNotifPreview');
  if (!preview) return;
  if (!notificationsData.length) {
    preview.innerHTML = '<p style="text-align:center;color:#7f8c8d;padding:12px">لا توجد إشعارات</p>';
    return;
  }
  preview.innerHTML = `<div class="notif-preview-grid">${notificationsData.slice(0, 3).map((n) => `
    <button type="button" class="notif-preview-card ${n.read ? 'read' : ''}" data-notif-id="${n.id}">
      <span class="notif-preview-card-icon">${n.icon}</span>
      <span class="notif-preview-card-body">
        <strong class="notif-preview-card-title">${n.title}</strong>
        <span class="notif-preview-card-text">${n.text}</span>
      </span>
      <span class="notif-preview-card-time">${n.time}</span>
      ${n.read ? '' : '<span class="notif-preview-dot"></span>'}
    </button>
  `).join('')}</div>`;

  preview.querySelectorAll('[data-notif-id]').forEach((el) => {
    el.addEventListener('click', () => {
      handleNotificationClick(el.getAttribute('data-notif-id'));
    });
  });
}

function renderOrdersFromDB(bookings) {
  const container = document.getElementById('ordersListFull');
  if (!container) return;

  const filtered = filterBookings(bookings, currentOrderFilter);

  if (!filtered.length) {
    container.innerHTML = '<p style="text-align:center;padding:24px;color:#7f8c8d">لا توجد طلبات في هذا التصنيف.</p>';
    return;
  }

  container.innerHTML = filtered.map((booking) => {
    const s = normalizeStatus(booking.status);
    const badgeClass = STATUS_BADGE_CLASS[s] || 'status-pending';
    const label = STATUS_LABELS[s] || booking.status || '—';
    const appt = window.FixoraDateTime
      ? window.FixoraDateTime.formatBookingAppointment(booking.scheduled_at, booking.start_time)
      : null;
    const formattedDate = appt
      ? appt.full
      : (booking.scheduled_at
        ? new Date(booking.scheduled_at).toLocaleDateString('ar-JO', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'قريباً');
    const providerId = booking.provider_id || '';
    const providerLink = providerId
      ? `<a href="privider.html?id=${encodeURIComponent(providerId)}" class="btn-outline" style="display:inline-block;margin-top:10px;font-size:12px">عرض بروفايل الحرفي</a>`
      : '';

    return `
      <div class="order-card" style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:15px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px">
          <h4 style="margin:0;color:#2c3e50;font-size:16px">${booking.category_name || 'طلب خدمة'}</h4>
          <span class="status-badge ${badgeClass}" style="padding:4px 10px;border-radius:20px;font-size:12px;font-weight:700">${label}</span>
        </div>
        <p style="margin:4px 0;font-size:14px;color:#7f8c8d">👷 الفني: <strong>${(booking.provider_name || '—').trim()}</strong></p>
        <p style="margin:4px 0;font-size:14px;color:#7f8c8d">📅 الموعد: ${formattedDate}</p>
        <p style="margin:4px 0;font-size:14px;color:#7f8c8d">📝 ${booking.notes || 'لا توجد ملاحظات'}</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
          <a href="chat.html?bookingId=${encodeURIComponent(booking.id)}" class="btn-outline" style="font-size:12px">💬 محادثة</a>
          ${providerLink}
          ${s === 'pending' || s === 'confirmed' ? `<button type="button" class="btn-outline order-cancel-btn" data-booking-id="${booking.id}" style="font-size:12px;color:#c0392b;border-color:#c0392b">إلغاء الطلب</button>` : ''}
          ${s === 'completed' && providerId
            ? `<a href="privider.html?id=${encodeURIComponent(providerId)}&tab=reviews" class="btn-primary" style="font-size:12px;background:#f07a26;border:none;padding:6px 14px;border-radius:8px;color:#fff;text-decoration:none;display:inline-block">⭐ قيّم على صفحة الحرفي</a>`
            : ''}
        </div>
      </div>`;
  }).join('');

  container.querySelectorAll('.order-cancel-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-booking-id');
      if (!id || !confirm('هل تريد إلغاء هذا الطلب؟')) return;
      try {
        await api().updateBookingStatus(id, 'cancelled');
        await fetchUserDataFromServer();
        await loadBookingsForMessages();
      } catch (e) {
        alert(e.message || 'تعذر إلغاء الطلب');
      }
    });
  });
}

function initializeProfileUpdate() {
  const saveProfileBtn = document.getElementById('saveProfileBtn');
  if (!saveProfileBtn) return;

  saveProfileBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    const firstName = document.getElementById('profileFirstName')?.value.trim();
    const lastName = document.getElementById('profileLastName')?.value.trim();
    const phone = document.getElementById('profilePhone')?.value.trim();
    const governorate = document.getElementById('profileCity')?.value;
    const detailedArea = document.getElementById('profileArea')?.value.trim();

    if (!firstName || !lastName || !phone) {
      alert('يرجى تعبئة الاسم ورقم الهاتف.');
      return;
    }

    const payload = {
      first_name: firstName,
      last_name: lastName,
      phone,
      governorate,
      address: detailedArea,
      detailed_area: detailedArea
    };
    if (pendingAvatarDataUrl) {
      payload.profile_pic_url = pendingAvatarDataUrl;
    }

    try {
      const result = await api().updateProfile(payload);
      if (result.success) {
        pendingAvatarDataUrl = null;
        const saved = result.user || {};
        sessionStorage.setItem('fixora_current_user', JSON.stringify(saved));
        if (saved.profile_pic_url) {
          localStorage.setItem('fixora_client_avatar', saved.profile_pic_url);
        }
        displayWelcomeMessage(saved);
        populateProfileFields(saved);
        displayProfileAvatar(saved.profile_pic_url);
        alert(result.message || 'تم حفظ التغييرات بنجاح');
      } else {
        alert(result.message || 'فشل التحديث');
      }
    } catch (error) {
      alert(error.message || 'حدث خطأ أثناء الحفظ');
    }
  });
}

function renderNotifications() {
  const container = document.getElementById('notificationsList');
  if (!container) return;
  if (!notificationsData.length) {
    container.innerHTML = '<p style="text-align:center;color:#7f8c8d;padding:20px">لا توجد إشعارات</p>';
    return;
  }
  container.innerHTML = notificationsData.map((notif) => `
    <button type="button" class="notification-item ${notif.read ? 'read' : ''}" data-notif-id="${notif.id}">
      <div class="notif-item-icon">${notif.icon}</div>
      <div class="notif-item-body">
        <strong>${notif.title}</strong>
        <p>${notif.text}</p>
        <span class="notif-item-time">${notif.time}</span>
      </div>
      ${notif.read ? '' : '<span class="notif-unread-dot" aria-hidden="true"></span>'}
    </button>
  `).join('');

  container.querySelectorAll('[data-notif-id]').forEach((el) => {
    el.addEventListener('click', () => {
      handleNotificationClick(el.getAttribute('data-notif-id'));
    });
  });
}

function renderFavorites() {
  const container = document.getElementById('favListFull');
  if (!container) return;
  if (!favoritesData.length) {
    container.innerHTML = `
      <p style="text-align:center;color:#7f8c8d;padding:24px">
        لا يوجد حرفيون في المفضلة.<br>
        أضف حرفياً من <a href="search.html">صفحة البحث</a> أو من <a href="privider.html">بروفايله</a>.
      </p>`;
    return;
  }

  container.innerHTML = `<div class="fav-cards-grid">${favoritesData.map((fav) => {
    const stars = fav.rating > 0 ? `⭐ ${fav.rating.toFixed(1)}` : '⭐ جديد';
    const initial = (fav.name || 'ح').charAt(0);
    return `
      <article class="fav-card">
        <div class="fav-card-avatar">${initial}</div>
        <div class="fav-card-main">
          <h3 class="fav-card-name">${fav.name}</h3>
          <p class="fav-card-meta">${fav.specialty}</p>
          <p class="fav-card-rating">${stars}</p>
          ${fav.bio ? `<p class="fav-card-bio">${fav.bio.slice(0, 100)}${fav.bio.length > 100 ? '…' : ''}</p>` : ''}
        </div>
        <div class="fav-card-actions">
          <a href="privider.html?id=${encodeURIComponent(fav.id)}" class="btn-outline">عرض الحساب</a>
          <a href="booking.html?id=${encodeURIComponent(fav.id)}" class="btn-primary">احجز الآن</a>
        </div>
      </article>`;
  }).join('')}</div>`;
}

function renderMessages() {
  const container = document.getElementById('messagesList');
  if (!container) return;
  if (!messagesData.length) {
    container.innerHTML = '<p style="text-align:center;color:#7f8c8d;padding:20px">لا توجد محادثات بعد</p>';
    return;
  }
  container.innerHTML = messagesData.map((msg) => `
    <a href="${msg.href}" class="message-item" style="padding:12px;border-bottom:1px solid #eee;display:flex;align-items:center;gap:10px;text-decoration:none;color:inherit">
      <div style="font-size:20px">${msg.icon}</div>
      <div>
        <strong style="color:#2c3e50">${msg.sender}</strong>
        <p style="margin:3px 0 0;font-size:13px;color:#7f8c8d">${msg.preview}</p>
        <span style="font-size:11px;color:#999">${msg.time}</span>
      </div>
    </a>
  `).join('');
}

function initializeLogout() {
  const handleLogout = (e) => {
    if (e) e.preventDefault();
    if (window.FixoraAccess?.logout) {
      window.FixoraAccess.logout();
      return;
    }
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    sessionStorage.removeItem('fixora_current_user');
    window.location.href = 'login.html';
  };

  document.getElementById('headerLogoutBtn')?.addEventListener('click', handleLogout);
  document.querySelectorAll('[data-fxr-logout]').forEach((el) => {
    el.addEventListener('click', handleLogout);
  });

  const dashLogout = document.querySelector('.dashboard-sidebar .sidebar-item[data-fxr-logout]');
  if (dashLogout) {
    dashLogout.addEventListener('click', handleLogout);
  }
}

/** إعادة تحميل المفضلة (يُستدعى من صفحة الحرفي بعد الإضافة) */
window.fxrRefreshClientFavorites = loadFavoritesFromApi;