'use strict';

let ordersData = [];
let portfolioData = [];
let servicesCount = 0;
let providerProfileId = null;
let providerFullData = null;

let daysList = [
  { name: 'الأحد', key: 'sun', isAvailable: true, from: '09:00', to: '17:00' },
  { name: 'الإثنين', key: 'mon', isAvailable: true, from: '09:00', to: '17:00' },
  { name: 'الثلاثاء', key: 'tue', isAvailable: true, from: '09:00', to: '17:00' },
  { name: 'الأربعاء', key: 'wed', isAvailable: true, from: '09:00', to: '17:00' },
  { name: 'الخميس', key: 'thu', isAvailable: true, from: '09:00', to: '17:00' },
  { name: 'الجمعة', key: 'fri', isAvailable: false, from: '09:00', to: '12:00' },
  { name: 'السبت', key: 'sat', isAvailable: true, from: '10:00', to: '14:00' }
];

let providerData = {
  name: '', phone: '', email: '',
  city: '', specialty: '', areas: '',
  bio: '', rating: 0, avatar: null
};

let servicesDescription = '';
let pendingUpload = { file: null, description: '' };

const PROVIDER_DAY_AR = {
  sun: 'الأحد', mon: 'الإثنين', tue: 'الثلاثاء', wed: 'الأربعاء',
  thu: 'الخميس', fri: 'الجمعة', sat: 'السبت'
};

const GOV_TO_AR = {
  Amman: 'عمّان', Irbid: 'إربد', Zarqa: 'الزرقاء', Aqaba: 'العقبة',
  Salat: 'السلط', Mafraq: 'المفرق', Karak: 'الكرك', "Ma'an": 'معان',
  Tafileh: 'الطفيلة', Ajloun: 'عجلون', Jerash: 'جرش', Madaba: 'مادبا', Balqa: 'البلقاء'
};

const AR_TO_GOV = Object.fromEntries(
  Object.entries(GOV_TO_AR).map(([en, ar]) => [ar, en])
);

function resolveGovernorate(value) {
  if (!value) return value;
  if (GOV_TO_AR[value]) return value;
  return AR_TO_GOV[value] || value;
}

function portfolioStorageKey() {
  const uid = localStorage.getItem('userId') || 'guest';
  return `fixora_provider_portfolio_${uid}`;
}

function loadPortfolioFromStorage() {
  try {
    const raw = localStorage.getItem(portfolioStorageKey());
    portfolioData = raw ? JSON.parse(raw) : [];
  } catch (_) {
    portfolioData = [];
  }
}

async function loadPortfolioFromApi() {
  if (!providerProfileId) return;
  try {
    const full = await FixoraAPI.getProvider(providerProfileId);
    const items = full.data?.portfolio;
    if (Array.isArray(items)) {
      portfolioData = items;
      savePortfolioToStorage();
    }
  } catch (_) {
    loadPortfolioFromStorage();
  }
}

async function savePortfolioToApi() {
  savePortfolioToStorage();
  try {
    await FixoraAPI.updateProviderPortfolio(portfolioData);
  } catch (e) {
    showNotification('⚠️', 'تنبيه', 'تعذر حفظ المعرض على السيرفر — تم الحفظ محلياً');
  }
}

function savePortfolioToStorage() {
  localStorage.setItem(portfolioStorageKey(), JSON.stringify(portfolioData));
}

function showToast(message) {
  const toast = document.getElementById('fxrToast');
  if (!toast) return;
  toast.textContent = message;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

function showNotification(icon, title, message) {
  const modal = document.getElementById('notificationModal');
  const notifIcon = document.getElementById('notifIcon');
  const notifTitle = document.getElementById('notifTitle');
  const notifMessage = document.getElementById('notifMessage');
  const closeBtn = document.getElementById('closeNotifBtn');
  if (!modal || !notifIcon || !notifTitle || !notifMessage) {
    showToast(`${title}: ${message}`);
    return;
  }
  notifIcon.innerHTML = icon;
  notifTitle.innerHTML = title;
  notifMessage.innerHTML = message;
  modal.classList.add('active');
  if (closeBtn) closeBtn.onclick = () => modal.classList.remove('active');
}

function mapBookingToOrder(b) {
  const d = new Date(b.scheduled_at || b.created_at);
  return {
    id: b.id,
    icon: '📋',
    customer: b.client_name || 'عميل',
    service: b.category_name || 'طلب خدمة',
    date: d.toLocaleDateString('ar-JO'),
    time: d.toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' }),
    location: (b.notes || '').slice(0, 80),
    status: b.status
  };
}

function renderPublicProfilePreview() {
  const data = providerFullData;
  if (!data) return;

  const name = providerData.name || `${data.first_name || ''} ${data.last_name || ''}`.trim();
  const setText = (id, t) => {
    const el = document.getElementById(id);
    if (el) el.textContent = t;
  };

  setText('previewName', name || '—');
  setText('previewSpecialty', `🔧 ${data.specialty || providerData.specialty || 'مقدم خدمة'}`);
  const avg = parseFloat(data.avg_rating) || providerData.rating || 0;
  setText('previewRating', avg > 0 ? `⭐ ${avg} · ${(data.reviews || []).length} تقييم` : '⭐ جديد');
  setText('previewBio', data.bio || providerData.bio || 'لا توجد نبذة بعد.');

  const avatar = document.getElementById('previewAvatar');
  const pic = data.profile_pic_url || providerData.avatar;
  if (avatar) {
    if (pic) {
      avatar.innerHTML = `<img src="${pic}" alt="">`;
    } else {
      avatar.textContent = '👨‍🔧';
    }
  }

  const servicesEl = document.getElementById('previewServices');
  if (servicesEl) {
    const items = (data.services || []).map((s) => s.name_ar).filter(Boolean);
    servicesEl.innerHTML = items.length
      ? items.map((s) => `<span class="preview-tag">${s}</span>`).join('')
      : `<span class="preview-tag">${data.specialty || 'خدمات متنوعة'}</span>`;
  }

  const areasEl = document.getElementById('previewAreas');
  if (areasEl) {
    const areaLabels = (data.service_areas || [])
      .map((a) => (typeof a === 'string' ? a : (a.district || a.governorate || '')))
      .filter(Boolean);
    const fallback = data.serviced_areas_text || providerData.areas || '';
    const tags = areaLabels.length
      ? areaLabels
      : (fallback ? fallback.split(/[,،]/).map((s) => s.trim()).filter(Boolean) : []);
    areasEl.innerHTML = tags.length
      ? tags.map((t) => `<span class="preview-tag">${escapeHtml(t)}</span>`).join('')
      : '<p style="font-size:12px;color:var(--muted)">لم يُحدد بعد</p>';
  }

  const schedEl = document.getElementById('previewSchedule');
  if (schedEl) {
    const rows = data.availability || [];
    schedEl.innerHTML = rows.length
      ? rows.map((row) => {
          const day = PROVIDER_DAY_AR[row.day_of_week] || row.day_of_week;
          const from = row.start_time ? String(row.start_time).slice(0, 5) : '';
          const to = row.end_time ? String(row.end_time).slice(0, 5) : '';
          const st = row.is_available !== false ? 'متاح' : 'مغلق';
          return `<div class="preview-schedule-row"><span>${day}</span><span>${from} – ${to} · ${st}</span></div>`;
        }).join('')
      : '<p style="font-size:12px;color:var(--muted)">لم يُحدد جدول عمل بعد.</p>';
  }

  const link = document.getElementById('previewPublicLink');
  if (link && providerProfileId) {
    link.href = `privider.html?id=${encodeURIComponent(providerProfileId)}`;
  }
}

function renderProviderMessages() {
  loadProviderMessagesList();
}

async function loadProviderMessagesList() {
  const container = document.getElementById('providerMessagesList');
  if (!container) return;

  let inquiryRows = [];
  try {
    const threadsRes = await FixoraAPI.getInquiryThreads();
    inquiryRows = (threadsRes.data || []).map((t) => ({
      id: t.id,
      customer: (t.other_name || 'عميل').trim(),
      service: 'محادثة استفسار',
      date: new Date(t.created_at).toLocaleDateString('ar-JO'),
      href: `chat.html?inquiryId=${encodeURIComponent(t.id)}`
    }));
  } catch (_) { /* optional */ }

  const chatBookings = ordersData.filter((o) =>
    ['pending', 'confirmed', 'in_progress', 'completed'].includes(o.status)
  ).map((o) => ({
    id: o.id,
    customer: o.customer,
    service: o.service,
    date: o.date,
    href: `chat.html?bookingId=${encodeURIComponent(o.id)}`
  }));

  const allChats = [...inquiryRows, ...chatBookings];

  const badge = document.getElementById('messagesBadge');
  if (badge) {
    badge.textContent = allChats.length;
    badge.style.display = allChats.length ? '' : 'none';
  }

  if (!allChats.length) {
    container.innerHTML = '<div class="empty-state">لا توجد محادثات بعد — ستظهر هنا عند وصول رسائل من العملاء</div>';
    return;
  }

  container.innerHTML = allChats.map((o) => `
    <div class="provider-msg-row">
      <div>
        <strong>${escapeHtml(o.customer)}</strong>
        <p style="font-size:12px;color:var(--muted);margin:4px 0 0">${escapeHtml(o.service)} · ${o.date}</p>
      </div>
      <a href="${o.href}" class="btn-accept" style="text-decoration:none">💬 فتح المحادثة</a>
    </div>
  `).join('');
}

let providerNotificationsData = [];

async function loadProviderNotifications() {
  try {
    const res = await FixoraAPI.getNotifications();
    providerNotificationsData = res.data || res.notifications || [];
    const unread = res.unread_count != null
      ? res.unread_count
      : providerNotificationsData.filter((n) => !n.is_read).length;
    const badge = document.getElementById('providerNotifBadge');
    if (badge) {
      badge.textContent = unread;
      badge.style.display = unread ? '' : 'none';
    }
    renderProviderNotifications();
  } catch (_) {
    providerNotificationsData = [];
    renderProviderNotifications();
  }
}

function renderProviderNotifications() {
  const container = document.getElementById('providerNotificationsList');
  if (!container) return;

  if (!providerNotificationsData.length) {
    container.innerHTML = '<div class="empty-state">لا توجد إشعارات</div>';
    return;
  }

  container.innerHTML = providerNotificationsData.map((n) => {
    const text = window.fxrNotifDisplayMessage?.(n.message) || n.message || '';
    const link = window.fxrNotifParseLink?.(n.message);
    const isRead = !!n.is_read;
    return `
      <button type="button" class="provider-notif-row ${isRead ? 'read' : ''}" data-notif-id="${n.id}" data-link="${link ? escapeHtml(link) : ''}">
        <strong style="font-size:13px">${escapeHtml(n.title || 'إشعار')}</strong>
        <p style="font-size:12px;color:var(--muted);margin:4px 0">${escapeHtml(text)}</p>
        <time style="font-size:11px;color:var(--muted)">${new Date(n.created_at).toLocaleString('ar-JO')}</time>
      </button>`;
  }).join('');

  container.querySelectorAll('[data-notif-id]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await FixoraAPI.markNotificationRead(btn.dataset.notifId);
      } catch (_) { /* ignore */ }
      const link = btn.getAttribute('data-link');
      if (link) {
        window.location.href = link;
        return;
      }
      window.fxrRefreshNotifications?.();
      await loadProviderNotifications();
    });
  });
}

function applyProviderDataToUI() {
  const first = (providerData.name || '').split(' ')[0] || 'حرفي';
  const welcome = document.getElementById('dashboardWelcome');
  if (welcome) welcome.textContent = `مرحباً ${first}! إليك ملخص نشاطك على المنصة`;

  const ratingEl = document.getElementById('statRating');
  if (ratingEl) ratingEl.textContent = providerData.rating > 0 ? providerData.rating : '—';

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.tagName === 'SELECT') {
      const ar = GOV_TO_AR[val] || val;
      for (const opt of el.options) {
        if (opt.value === val || opt.textContent.trim() === ar || opt.textContent.trim() === val) {
          el.value = opt.value || opt.textContent.trim();
          break;
        }
      }
    } else {
      el.value = val ?? '';
    }
  };

  setVal('fullName', providerData.name);
  setVal('phone', providerData.phone);
  setVal('email', providerData.email);
  setVal('city', providerData.city);
  setVal('specialty', providerData.specialty);
  setVal('areas', providerData.areas);
  setVal('bio', providerData.bio);

  const profileName = document.getElementById('profileName');
  if (profileName) profileName.textContent = providerData.name || '—';
  const profileContact = document.getElementById('profileContact');
  if (profileContact) {
    profileContact.textContent = `📞 ${providerData.phone || '—'} · ✉️ ${providerData.email || '—'}`;
  }
  const profileLocation = document.getElementById('profileLocation');
  if (profileLocation) profileLocation.textContent = `📍 ${GOV_TO_AR[providerData.city] || providerData.city || '—'}، الأردن`;

  if (providerData.avatar) updateAvatarDisplay();
}

async function loadProviderDashboardFromApi() {
  if (!window.FixoraAPI || !window.FixoraAPI.requireAuth('provider')) return;
  try {
    const prof = await FixoraAPI.getProviderProfile();
    const p = prof.profile || {};
    if (p.is_verified === false) {
      window.location.replace('provider-pending.html');
      return;
    }

    const bookings = await FixoraAPI.getMyBookings();
    ordersData = (bookings.data || []).map(mapBookingToOrder);
    providerProfileId = p.provider_profile_id || null;
    providerData.name = `${p.first_name || ''} ${p.last_name || ''}`.trim();
    providerData.phone = p.phone || '';
    providerData.email = p.email || '';
    providerData.city = p.governorate || '';
    providerData.specialty = p.specialty || '';
    providerData.bio = p.bio || '';
    providerData.rating = parseFloat(p.avg_rating) || 0;
    if (p.profile_pic_url) providerData.avatar = p.profile_pic_url;
    if (p.serviced_areas_text) {
      providerData.areas = p.serviced_areas_text;
    } else if (Array.isArray(p.service_areas) && p.service_areas.length) {
      providerData.areas = p.service_areas.join('، ');
    }

    servicesCount = 0;
    if (providerProfileId) {
      const full = await FixoraAPI.getProvider(providerProfileId);
      const data = full.data || {};
      providerFullData = data;
      servicesCount = (data.services || []).length;
      if (Array.isArray(data.portfolio)) {
        portfolioData = data.portfolio;
        savePortfolioToStorage();
      } else {
        loadPortfolioFromStorage();
      }
      if (data.serviced_areas_text) {
        providerData.areas = data.serviced_areas_text;
      } else if ((data.service_areas || []).length) {
        providerData.areas = data.service_areas
          .map((a) => (typeof a === 'string' ? a : (a.district || '')))
          .filter(Boolean)
          .join('، ');
      }
      const av = data.availability || [];
      if (av.length) {
        daysList = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map((key) => {
          const row = av.find((a) => a.day_of_week === key);
          const from = row?.start_time ? String(row.start_time).slice(0, 5) : '09:00';
          const to = row?.end_time ? String(row.end_time).slice(0, 5) : '17:00';
          return {
            name: PROVIDER_DAY_AR[key],
            key,
            isAvailable: row ? row.is_available !== false : false,
            from,
            to
          };
        });
      }
    }

    servicesDescription = providerData.bio || '';
    const fullName = providerData.name.trim();
    if (fullName) {
      localStorage.setItem('userName', fullName.split(' ')[0] || fullName);
      sessionStorage.setItem('fixora_current_user', JSON.stringify({
        first_name: p.first_name,
        last_name: p.last_name,
        role: 'provider'
      }));
    }
    applyProviderDataToUI();
    renderPublicProfilePreview();
    renderProviderMessages();
    updateStats();
  } catch (e) {
    console.warn('تعذر تحميل لوحة الفني', e);
  }
}

function updateStats() {
  const pending = ordersData.filter(o => o.status === 'pending').length;
  const confirmed = ordersData.filter(o => o.status === 'confirmed' || o.status === 'completed').length;
  document.getElementById('statOrders').textContent = ordersData.length;
  document.getElementById('statPending').textContent = pending;
  document.getElementById('statConfirmed').textContent = confirmed;
  document.getElementById('statPortfolio').textContent = portfolioData.length;
  document.getElementById('statServices').textContent = servicesCount;
  document.getElementById('ordersBadge').textContent = pending;
}

function renderRecentOrders() {
  const container = document.getElementById('recentOrdersList');
  if (!container) return;
  const recent = ordersData.slice(0, 3);
  if (recent.length === 0) {
    container.innerHTML = '<div class="empty-state" style="padding:20px">لا توجد طلبات</div>';
    return;
  }
  container.innerHTML = recent.map(order => `<div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid #eee"><span>${order.icon}</span><div style="flex:1"><strong>${order.customer}</strong> - ${order.service}</div><span style="padding:2px 8px;border-radius:20px;font-size:10px;background:${order.status === 'pending' ? 'rgba(240,122,38,.1)' : 'rgba(145,189,209,.2)'}">${order.status === 'pending' ? 'جديد' : 'قيد التأكيد'}</span></div>`).join('');
}

function renderOrders() {
  const container = document.getElementById('ordersList');
  if (!container) return;
  const pending = ordersData.filter(o => o.status === 'pending');
  const accepted = ordersData.filter(o => o.status === 'accepted' || o.status === 'confirmed');
  const completed = ordersData.filter(o => o.status === 'completed');
  let html = '';
  if (pending.length) {
    html += `<div style="margin-bottom:20px"><h3 style="font-size:13px;font-weight:700;margin-bottom:10px;color:var(--orange)">🆕 طلبات جديدة</h3>`;
    pending.forEach(order => { html += `<div class="order-card"><div class="order-icon">${order.icon}</div><div class="order-details"><div class="order-customer">${order.customer}</div><div class="order-service">${order.service}</div><div class="order-datetime">📅 ${order.date} · 🕐 ${order.time} · 📍 ${order.location}</div></div><div class="order-status status-pending">جديد</div><div class="order-actions"><a href="chat.html?bookingId=${encodeURIComponent(order.id)}" class="btn-reject" style="text-decoration:none">💬</a><button class="btn-accept" onclick="acceptOrder('${order.id}')">✅ قبول</button><button class="btn-reject" onclick="rejectOrder('${order.id}')">✗ رفض</button></div></div>`; });
    html += `</div>`;
  }
  if (accepted.length) {
    html += `<div style="margin-bottom:20px"><h3 style="font-size:13px;font-weight:700;margin-bottom:10px;color:var(--blue)">⏳ في انتظار التأكيد</h3>`;
    accepted.forEach(order => { html += `<div class="order-card"><div class="order-icon">${order.icon}</div><div class="order-details"><div class="order-customer">${order.customer}</div><div class="order-service">${order.service}</div><div class="order-datetime">📅 ${order.date} · 🕐 ${order.time} · 📍 ${order.location}</div></div><div class="order-status status-accepted">تم القبول</div><div class="order-actions"><a href="chat.html?bookingId=${encodeURIComponent(order.id)}" class="btn-reject" style="text-decoration:none">💬</a><button class="btn-confirm" onclick="confirmOrder('${order.id}')">✅ تأكيد</button><button class="btn-reject" onclick="rejectOrder('${order.id}')">✗ رفض</button></div></div>`; });
    html += `</div>`;
  }
  if (completed.length) {
    html += `<div style="margin-bottom:20px"><h3 style="font-size:13px;font-weight:700;margin-bottom:10px;color:#28c840">✓ الطلبات المؤكدة</h3>`;
    completed.forEach(order => { html += `<div class="order-card"><div class="order-icon">${order.icon}</div><div class="order-details"><div class="order-customer">${order.customer}</div><div class="order-service">${order.service}</div><div class="order-datetime">📅 ${order.date} · 🕐 ${order.time} · 📍 ${order.location}</div></div><div class="order-status status-confirmed">مؤكد</div><div class="order-actions"><a href="chat.html?bookingId=${encodeURIComponent(order.id)}" class="btn-reject" style="text-decoration:none">💬</a><button class="btn-delete" onclick="deleteOrder('${order.id}')">🗑️ حذف</button></div></div>`; });
    html += `</div>`;
  }
  if (!pending.length && !accepted.length && !completed.length) html = '<div class="empty-state">🎉 لا توجد طلبات</div>';
  container.innerHTML = html;
  updateStats();
  renderRecentOrders();
}

window.acceptOrder = async function(id) {
  try {
    await FixoraAPI.updateBookingStatus(id, 'accepted');
    await loadProviderDashboardFromApi();
    renderOrders();
    showNotification('✅', 'تم قبول الطلب', 'تم قبول الطلب بنجاح.');
  } catch (e) { showNotification('❌', 'خطأ', e.message); }
};

window.confirmOrder = async function(id) {
  try {
    await FixoraAPI.updateBookingStatus(id, 'completed');
    await loadProviderDashboardFromApi();
    renderOrders();
    showNotification('✅', 'تم التأكيد', 'تم إكمال الطلب.');
  } catch (e) { showNotification('❌', 'خطأ', e.message); }
};

window.rejectOrder = async function(id) {
  try {
    await FixoraAPI.updateBookingStatus(id, 'rejected');
    await loadProviderDashboardFromApi();
    renderOrders();
    showNotification('❌', 'تم رفض الطلب', 'تم رفض الطلب.');
  } catch (e) { showNotification('❌', 'خطأ', e.message); }
};

window.deleteOrder = function(id) {
  ordersData = ordersData.filter(o => String(o.id) !== String(id));
  renderOrders();
  showNotification('🗑️', 'تم الحذف', 'تم حذف الطلب بنجاح');
};

function renderPortfolio() {
  const container = document.getElementById('portfolioGrid');
  if (!container) return;
  if (portfolioData.length === 0) {
    container.innerHTML = '<div class="empty-state">📷 لا توجد أعمال مضافة بعد. اضغط "إضافة عمل جديد"</div>';
    return;
  }
  container.innerHTML = portfolioData.map(item => `
    <div class="gallery-item">
      <div class="gallery-image">${item.imageData ? `<img src="${item.imageData}" alt="${item.description}">` : `<div class="no-image">🖼️</div>`}</div>
      <div class="gallery-info">
        <div class="gallery-desc">${escapeHtml(item.description)}</div>
        <div class="gallery-actions">
          <button class="gallery-edit-btn" onclick="editPortfolioItem(${item.id})">✏️ تعديل</button>
          <button class="gallery-delete-btn" onclick="deletePortfolioItem(${item.id})">🗑️ حذف</button>
        </div>
      </div>
    </div>
  `).join('');
  updateStats();
}

window.editPortfolioItem = function(id) {
  const item = portfolioData.find(p => p.id === id);
  if (!item) return;
  document.getElementById('workDescription').value = item.description;
  pendingUpload = { file: null, description: item.description, editId: id };
  const preview = document.getElementById('imagePreview');
  preview.innerHTML = item.imageData ? `<img src="${item.imageData}" style="max-width:100%;max-height:100%">` : '<div class="placeholder">📷 اضغط لرفع صورة جديدة</div>';
  document.getElementById('uploadModal').classList.add('active');
  document.getElementById('confirmUploadBtn').onclick = () => savePortfolioItem(true);
};

window.deletePortfolioItem = async function(id) {
  portfolioData = portfolioData.filter(p => p.id !== id);
  await savePortfolioToApi();
  renderPortfolio();
  showNotification('🗑️', 'تم الحذف', 'تم حذف العمل بنجاح');
};

async function savePortfolioItem(isEdit = false) {
  const description = document.getElementById('workDescription').value.trim();
  if (!description) { showNotification('⚠️', 'تنبيه', 'الرجاء إدخال وصف للعمل'); return; }
  if (isEdit && pendingUpload.editId) {
    const index = portfolioData.findIndex(p => p.id === pendingUpload.editId);
    if (index !== -1) {
      portfolioData[index].description = description;
      if (pendingUpload.file) portfolioData[index].imageData = pendingUpload.file;
    }
    showNotification('✅', 'تم التعديل', 'تم تعديل العمل بنجاح');
  } else {
    const newId = Math.max(0, ...portfolioData.map(p => p.id), 0) + 1;
    portfolioData.push({ id: newId, description, imageData: pendingUpload.file || null, icon: '📷' });
    showNotification('✅', 'تم الإضافة', 'تم إضافة العمل بنجاح');
  }
  await savePortfolioToApi();
  renderPortfolio();
  closeUploadModal();
}

function closeUploadModal() {
  document.getElementById('uploadModal').classList.remove('active');
  document.getElementById('workDescription').value = '';
  document.getElementById('workImage').value = '';
  document.getElementById('imagePreview').innerHTML = '<div class="placeholder">📷 سيظهر معاينة الصورة هنا</div>';
  pendingUpload = { file: null, description: '' };
}

function setupImagePreview() {
  const fileInput = document.getElementById('workImage');
  if (!fileInput) return;
  fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = function(event) {
        pendingUpload.file = event.target.result;
        document.getElementById('imagePreview').innerHTML = `<img src="${event.target.result}" style="max-width:100%;max-height:100%">`;
      };
      reader.readAsDataURL(file);
    }
  });
}

function renderSchedule() {
  const tbody = document.getElementById('scheduleBody');
  if (!tbody) return;
  tbody.innerHTML = daysList.map(day => `<tr><td style="font-weight:700">${day.name}</td><td><input type="checkbox" class="schedule-checkbox" data-day="${day.key}" ${day.isAvailable ? 'checked' : ''}></td><td><input type="time" class="schedule-time-input from-time" data-day="${day.key}" value="${day.from}" ${!day.isAvailable ? 'disabled' : ''}></td><td><input type="time" class="schedule-time-input to-time" data-day="${day.key}" value="${day.to}" ${!day.isAvailable ? 'disabled' : ''}></td></tr>`).join('');
  document.querySelectorAll('.schedule-checkbox').forEach(cb => {
    cb.addEventListener('change', function() {
      const row = this.closest('tr');
      row.querySelector('.from-time').disabled = !this.checked;
      row.querySelector('.to-time').disabled = !this.checked;
    });
  });
}

async function saveSchedule() {
  document.querySelectorAll('.schedule-checkbox').forEach((cb) => {
    const dayKey = cb.getAttribute('data-day');
    const row = cb.closest('tr');
    const dayIndex = daysList.findIndex((d) => d.key === dayKey);
    if (dayIndex !== -1) {
      daysList[dayIndex].isAvailable = cb.checked;
      daysList[dayIndex].from = row.querySelector('.from-time').value;
      daysList[dayIndex].to = row.querySelector('.to-time').value;
    }
  });

  const schedule = daysList.map((d) => ({
    day_of_week: d.key,
    start_time: d.from,
    end_time: d.to,
    is_available: d.isAvailable
  }));

  try {
    const res = await FixoraAPI.updateProviderAvailability(schedule);
    showNotification('✅', 'تم الحفظ', res.message || 'تم حفظ جدول العمل بنجاح');
  } catch (e) {
    showNotification('❌', 'خطأ', e.message || 'تعذر حفظ جدول العمل');
  }
}

function setupAvatarUpload() {
  const fileInput = document.getElementById('avatarUpload');
  if (!fileInput) return;
  fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = function(event) {
        providerData.avatar = event.target.result;
        updateAvatarDisplay();
      };
      reader.readAsDataURL(file);
    }
  });
}

function updateAvatarDisplay() {
  const avatarIcon = document.getElementById('avatarIcon');
  const avatarImg = document.getElementById('avatarImage');
  if (providerData.avatar) {
    avatarIcon.style.display = 'none';
    avatarImg.style.display = 'block';
    avatarImg.src = providerData.avatar;
  } else {
    avatarIcon.style.display = 'flex';
    avatarImg.style.display = 'none';
  }
}

async function saveProfile() {
  const fullName = document.getElementById('fullName').value.trim();
  const parts = fullName.split(/\s+/);
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ') || '';
  providerData.name = fullName;
  providerData.phone = document.getElementById('phone').value.trim();
  providerData.email = document.getElementById('email').value.trim();
  providerData.city = resolveGovernorate(document.getElementById('city').value);
  providerData.specialty = document.getElementById('specialty').value.trim();
  providerData.areas = document.getElementById('areas').value.trim();
  providerData.bio = document.getElementById('bio').value.trim();

  const profilePayload = {
    phone: providerData.phone,
    specialty: providerData.specialty,
    bio: providerData.bio
  };
  if (providerData.areas) {
    profilePayload.serviced_areas_text = providerData.areas;
  }
  if (providerData.avatar) {
    profilePayload.profile_pic_url = providerData.avatar;
  }

  // #region agent log
  fetch('http://127.0.0.1:7413/ingest/b6795036-60bf-453e-a231-7fde9205c57b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c3def8'},body:JSON.stringify({sessionId:'c3def8',location:'provider-dashboard.js:saveProfile',message:'save profile payload',data:{hasAreas:!!profilePayload.serviced_areas_text,areasLen:providerData.areas?.length||0},timestamp:Date.now(),hypothesisId:'E',runId:'post-fix'})}).catch(()=>{});
  // #endregion

  try {
    const updateRes = await FixoraAPI.updateProviderProfile(profilePayload);
    const savedText = updateRes.serviced_areas_text || updateRes.profile?.serviced_areas_text;
    const savedList = updateRes.service_areas || updateRes.profile?.service_areas;
    if (savedText) {
      providerData.areas = savedText;
    } else if (savedList?.length) {
      providerData.areas = savedList.join('، ');
    }
    await FixoraAPI.updateProfile({
      first_name: firstName,
      last_name: lastName,
      phone: providerData.phone,
      governorate: providerData.city
    });
    if (providerProfileId) {
      const full = await FixoraAPI.getProvider(providerProfileId);
      providerFullData = full.data || providerFullData;
    }
    applyProviderDataToUI();
    renderPublicProfilePreview();
    showNotification('✅', 'تم الحفظ', 'تم حفظ التغييرات بنجاح');
  } catch (e) {
    showNotification('❌', 'خطأ', e.message || 'فشل حفظ التغييرات');
  }
}

async function saveServicesDescription() {
  servicesDescription = document.getElementById('servicesDescription').value.trim();
  providerData.bio = servicesDescription;
  try {
    await FixoraAPI.updateProviderProfile({ bio: servicesDescription });
    showNotification('✅', 'تم الحفظ', 'تم حفظ وصف الخدمات');
  } catch (e) {
    showNotification('❌', 'خطأ', e.message || 'فشل حفظ الوصف');
  }
}

function savePassword() {
  const oldPass = document.getElementById('oldPass')?.value;
  const newPass = document.getElementById('newPass')?.value;
  const confirmPass = document.getElementById('confirmPass')?.value;

  if (!oldPass) {
    showNotification('⚠️', 'تنبيه', 'الرجاء إدخال كلمة المرور الحالية');
    return;
  }
  if (!newPass || newPass.length < 8) {
    showNotification('⚠️', 'تنبيه', 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل');
    return;
  }
  if (newPass !== confirmPass) {
    showNotification('⚠️', 'تنبيه', 'كلمة المرور الجديدة غير متطابقة');
    return;
  }
  showNotification('ℹ️', 'قريباً', 'تغيير كلمة المرور من لوحة التحكم قيد التفعيل — استخدم صفحة تسجيل الدخول حالياً');
  document.getElementById('oldPass').value = '';
  document.getElementById('newPass').value = '';
  document.getElementById('confirmPass').value = '';
}

function switchTab(tabId) {
  document.querySelectorAll('.ditem').forEach(item => {
    item.classList.remove('on');
    if (item.getAttribute('data-tab') === tabId) item.classList.add('on');
  });
  document.querySelectorAll('.tab-content').forEach(tab => { tab.style.display = 'none'; });
  const panel = document.getElementById(`tab-${tabId}`);
  if (panel) panel.style.display = 'block';
  if (tabId === 'orders') renderOrders();
  if (tabId === 'portfolio') renderPortfolio();
  if (tabId === 'schedule') renderSchedule();
  if (tabId === 'dashboard') { updateStats(); renderRecentOrders(); }
  if (tabId === 'messages') renderProviderMessages();
  if (tabId === 'notifications') loadProviderNotifications();
  if (tabId === 'profile') renderPublicProfilePreview();
  if (tabId === 'services') {
    document.getElementById('servicesDescription').value = servicesDescription;
  }
}

function initProviderLogout() {
  const handleLogout = (e) => {
    e.preventDefault();
    if (window.FixoraAccess?.logout) {
      window.FixoraAccess.logout();
      return;
    }
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    sessionStorage.clear();
    window.location.href = 'login.html';
  };
  document.querySelectorAll('[data-fxr-logout]').forEach((el) => {
    el.addEventListener('click', handleLogout);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', async function() {
  await loadProviderDashboardFromApi();
  document.querySelectorAll('.ditem').forEach(item => {
    item.addEventListener('click', function() {
      const tabId = this.getAttribute('data-tab');
      if (tabId) switchTab(tabId);
    });
  });
  document.getElementById('saveDescriptionBtn')?.addEventListener('click', saveServicesDescription);
  document.getElementById('addPortfolioBtn')?.addEventListener('click', () => {
    pendingUpload = { file: null, description: '' };
    document.getElementById('workDescription').value = '';
    document.getElementById('workImage').value = '';
    document.getElementById('imagePreview').innerHTML = '<div class="placeholder">📷 سيظهر معاينة الصورة هنا</div>';
    document.getElementById('uploadModal').classList.add('active');
    document.getElementById('confirmUploadBtn').onclick = () => savePortfolioItem(false);
  });
  document.getElementById('cancelUploadBtn')?.addEventListener('click', closeUploadModal);
  document.getElementById('saveScheduleBtn')?.addEventListener('click', saveSchedule);
  document.getElementById('saveProfileBtn')?.addEventListener('click', saveProfile);
  document.getElementById('savePasswordBtn')?.addEventListener('click', savePassword);
  setupImagePreview();
  setupAvatarUpload();
  updateAvatarDisplay();
  renderOrders();
  renderPortfolio();
  renderSchedule();
  updateStats();
  renderRecentOrders();
  document.getElementById('servicesDescription').value = servicesDescription;
  applyProviderDataToUI();

  initProviderLogout();
  loadProviderNotifications();

  const hashTab = (location.hash || '').replace('#', '');
  if (hashTab) switchTab(hashTab);
});
