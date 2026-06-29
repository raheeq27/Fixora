'use strict';

(function () {
  const api = window.FixoraAPI;

  let allUsers = [];
  let allBookings = [];
  let loadedPanels = new Set(['stats']);

  const editBookingModal = document.getElementById('editBookingModal')
    ? new bootstrap.Modal(document.getElementById('editBookingModal'))
    : null;
  const categoryModal = document.getElementById('categoryModal')
    ? new bootstrap.Modal(document.getElementById('categoryModal'))
    : null;

  function showToast(message, isError) {
    const el = document.getElementById('adminToast');
    const body = document.getElementById('adminToastBody');
    if (!el || !body) return;
    body.textContent = message;
    el.classList.toggle('text-bg-danger', !!isError);
    el.classList.toggle('text-bg-dark', !isError);
    bootstrap.Toast.getOrCreateInstance(el, { delay: 3200 }).show();
  }

  function escapeHtml(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fullName(first, last) {
    return `${first || ''} ${last || ''}`.trim() || '—';
  }

  function formatDate(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('ar-JO', { dateStyle: 'short', timeStyle: 'short' });
    } catch (_) {
      return iso;
    }
  }

  function toLocalInput(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function switchPanel(panelId) {
    document.querySelectorAll('.fxr-admin-nav-item').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.panel === panelId);
    });
    document.querySelectorAll('.fxr-admin-panel').forEach((p) => {
      p.classList.toggle('active', p.dataset.panel === panelId);
    });
    // لوحة البلاغات والتقييمات ورسائل تواصل معنا تُحمّل دائماً عند كل زيارة
    if (panelId === 'reviews' || panelId === 'contact' || !loadedPanels.has(panelId)) {
      loadedPanels.add(panelId);
      loadPanel(panelId);
    }
  }

  async function loadPanel(panelId) {
    const loaders = {
      stats: loadStats,
      users: loadUsers,
      bookings: loadBookings,
      providers: loadProviders,
      categories: loadCategories,
      reviews: loadReviewsPanel,
      contact: loadContactMessages
    };
    try {
      await loaders[panelId]?.();
    } catch (e) {
      showToast(e.message || 'تعذر تحميل البيانات', true);
    }
  }

  async function loadStats() {
    const res = await api.adminGetStats();
    const s = res.stats || {};
    const set = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.textContent = v ?? '0';
    };
    set('statUsers', s.total_users);
    set('statProviders', s.total_providers);
    set('statBookings', s.total_bookings);
    set('statPending', s.pending_providers);
    set('statReviews', s.total_reviews);
    set('statReports', s.pending_reports);
    const navBadge = document.getElementById('adminPendingBadge');
    if (navBadge) {
      const n = s.pending_providers ?? 0;
      navBadge.textContent = n;
      navBadge.classList.toggle('d-none', !n);
    }
    // إظهار عدد البلاغات المعلّقة على زر لوحة البلاغات
    const reportsBadge = document.getElementById('adminReportsBadge');
    if (reportsBadge) {
      const r = s.pending_reports ?? 0;
      reportsBadge.textContent = r;
      reportsBadge.classList.toggle('d-none', !r);
    }
    const contactBadge = document.getElementById('adminContactBadge');
    if (contactBadge) {
      const c = s.new_contact_messages ?? 0;
      contactBadge.textContent = c;
      contactBadge.classList.toggle('d-none', !c);
    }
  }

  function renderUsers(rows) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">لا نتائج</td></tr>';
      return;
    }
    const me = localStorage.getItem('userId');
    tbody.innerHTML = rows.map((u) => {
      const name = escapeHtml(fullName(u.first_name, u.last_name));
      const banned = u.is_banned === true;
      const isSelf = String(u.id) === String(me);
      const isAdmin = u.role === 'admin';
      return `<tr>
        <td>${name}</td>
        <td>${escapeHtml(u.email || '—')}</td>
        <td>${escapeHtml(u.role)}</td>
        <td>${banned ? '<span class="badge bg-danger">محظور</span>' : '<span class="badge bg-success">نشط</span>'}</td>
        <td class="text-nowrap">
          ${!isAdmin && !isSelf
            ? `<button type="button" class="btn btn-sm ${banned ? 'btn-outline-success' : 'btn-outline-warning'}" data-ban-user="${u.id}" data-banned="${!banned}">${banned ? 'إلغاء الحظر' : 'حظر'}</button>`
            : '—'}
        </td>
      </tr>`;
    }).join('');

    tbody.querySelectorAll('[data-ban-user]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          await api.adminSetUserBan(btn.dataset.banUser, btn.dataset.banned === 'true');
          showToast('تم تحديث حالة المستخدم');
          await loadUsers();
        } catch (e) {
          showToast(e.message, true);
        }
      });
    });
  }

  async function loadUsers() {
    const res = await api.adminGetUsers();
    allUsers = res.users || [];
    renderUsers(allUsers);
  }

  function renderBookings(rows) {
    const tbody = document.getElementById('bookingsTableBody');
    if (!tbody) return;
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">لا حجوزات</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map((b) => `<tr>
      <td>${escapeHtml(fullName(b.client_first_name, b.client_last_name))}</td>
      <td>${escapeHtml(fullName(b.provider_first_name, b.provider_last_name))}</td>
      <td><span class="fxr-status-pill">${escapeHtml(b.status)}</span></td>
      <td>${formatDate(b.scheduled_at)}</td>
      <td><button type="button" class="btn btn-sm btn-outline-primary" data-edit-booking="${b.id}">تعديل</button></td>
    </tr>`).join('');

    tbody.querySelectorAll('[data-edit-booking]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const data = allBookings.find((x) => String(x.id) === String(btn.dataset.editBooking));
        if (!data) return;
        document.getElementById('editBookingId').value = data.id;
        document.getElementById('editBookingStatus').value = data.status || 'pending';
        document.getElementById('editBookingDate').value = toLocalInput(data.scheduled_at);
        document.getElementById('editBookingNotes').value = data.notes || '';
        editBookingModal?.show();
      });
    });
  }

  async function loadBookings() {
    const res = await api.adminGetBookings();
    allBookings = res.bookings || [];
    renderBookings(allBookings);
  }

  async function saveBooking() {
    const id = document.getElementById('editBookingId')?.value;
    if (!id) return;
    const status = document.getElementById('editBookingStatus')?.value;
    const scheduled_at = document.getElementById('editBookingDate')?.value;
    const notes = document.getElementById('editBookingNotes')?.value;
    try {
      await api.adminUpdateBooking(id, {
        status,
        scheduled_at: scheduled_at ? new Date(scheduled_at).toISOString() : undefined,
        notes
      });
      showToast('تم تحديث الحجز وإشعار المستخدمين');
      editBookingModal?.hide();
      await loadBookings();
      loadedPanels.delete('stats');
    } catch (e) {
      showToast(e.message, true);
    }
  }

  async function loadProviders() {
    const res = await api.adminGetPendingProviders();
    const rows = res.providers || [];
    const navBadge = document.getElementById('adminPendingBadge');
    if (navBadge) {
      navBadge.textContent = rows.length;
      navBadge.classList.toggle('d-none', !rows.length);
    }
    const tbody = document.getElementById('providersTableBody');
    if (!tbody) return;
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">لا حرفيين معلّقين</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map((p) => `<tr>
      <td>${escapeHtml(fullName(p.first_name, p.last_name))}</td>
      <td>${escapeHtml(p.specialty || '—')}</td>
      <td>${escapeHtml(p.email || '—')}</td>
      <td>${p.portfolio_count || 0} صورة · ${p.docs_count || 0} مستند</td>
      <td class="text-nowrap">
        <button type="button" class="btn btn-sm btn-outline-primary" data-view-provider="${p.profile_id}">عرض الملف</button>
        <button type="button" class="btn btn-sm btn-success" data-verify="${p.user_id}">اعتماد</button>
      </td>
    </tr>`).join('');

    tbody.querySelectorAll('[data-verify]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          await api.adminVerifyProvider(btn.dataset.verify);
          showToast('تم اعتماد الحرفي');
          await loadProviders();
          loadedPanels.delete('stats');
        } catch (e) {
          showToast(e.message, true);
        }
      });
    });

    tbody.querySelectorAll('[data-view-provider]').forEach((btn) => {
      btn.addEventListener('click', () => showPendingProviderDetails(btn.dataset.viewProvider));
    });
  }

  async function showPendingProviderDetails(profileId) {
    try {
      const res = await api.adminGetPendingProviderDetails(profileId);
      const docs = res.documents || [];
      const portfolio = res.portfolio || [];
      const modal = document.getElementById('pendingProviderModal');
      const body = document.getElementById('pendingProviderModalBody');
      if (!modal || !body) return;

      const docHtml = docs.length
        ? docs.map((d) => `<li><a href="${escapeHtml(d.file_url)}" target="_blank" rel="noopener">${escapeHtml(d.doc_type || 'مستند')}</a></li>`).join('')
        : '<li class="text-muted">لا مستندات</li>';

      const portHtml = portfolio.length
        ? `<div class="d-flex flex-wrap gap-2">${portfolio.map((item) => {
            const src = item.imageData || item.image_url || '';
            return src
              ? `<figure style="width:120px"><img src="${src}" alt="" style="width:100%;border-radius:8px"><figcaption style="font-size:11px">${escapeHtml(item.description || '')}</figcaption></figure>`
              : '';
          }).join('')}</div>`
        : '<p class="text-muted">لا أعمال في المعرض</p>';

      body.innerHTML = `
        <p><strong>المعرض:</strong></p>${portHtml}
        <p class="mt-3"><strong>المستندات:</strong></p><ul>${docHtml}</ul>`;
      bootstrap.Modal.getOrCreateInstance(modal).show();
    } catch (e) {
      showToast(e.message, true);
    }
  }

  async function loadCategories() {
    const res = await api.adminGetCategories();
    const rows = res.categories || [];
    const tbody = document.getElementById('categoriesTableBody');
    if (!tbody) return;
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">لا مهن</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map((c) => `<tr>
      <td>${escapeHtml(c.name_ar)}</td>
      <td>${c.is_active ? '<span class="badge bg-success">نشطة</span>' : '<span class="badge bg-warning text-dark">معلّقة</span>'}</td>
      <td>
        <button type="button" class="btn btn-sm btn-outline-secondary" data-edit-cat="${c.id}" data-cat-name="${escapeHtml(c.name_ar)}">تعديل</button>
        <button type="button" class="btn btn-sm ${c.is_active ? 'btn-outline-warning' : 'btn-outline-success'}" data-suspend-cat="${c.id}" data-is-active="${c.is_active}">${c.is_active ? 'تعليق' : 'تفعيل'}</button>
        <button type="button" class="btn btn-sm btn-outline-danger" data-del-cat="${c.id}">حذف</button>
      </td>
    </tr>`).join('');

    tbody.querySelectorAll('[data-edit-cat]').forEach((btn) => {
      btn.addEventListener('click', () => openCategoryModal(btn.dataset.editCat, btn.getAttribute('data-cat-name')));
    });
    tbody.querySelectorAll('[data-suspend-cat]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const isCurrentlyActive = btn.dataset.isActive === 'true';
        try {
          await api.adminSuspendCategory(btn.dataset.suspendCat, isCurrentlyActive);
          showToast(isCurrentlyActive ? 'تم تعليق المهنة' : 'تم تفعيل المهنة');
          await loadCategories();
        } catch (e) {
          showToast(e.message, true);
        }
      });
    });
    tbody.querySelectorAll('[data-del-cat]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('حذف هذه المهنة؟')) return;
        try {
          await api.adminDeleteCategory(btn.dataset.delCat);
          showToast('تم الحذف');
          await loadCategories();
        } catch (e) {
          showToast(e.message, true);
        }
      });
    });
  }

  function openCategoryModal(id, name) {
    document.getElementById('categoryEditId').value = id || '';
    document.getElementById('categoryNameInput').value = name || '';
    document.getElementById('categoryModalTitle').textContent = id ? 'تعديل مهنة' : 'مهنة جديدة';
    categoryModal?.show();
  }

  async function saveCategory() {
    const id = document.getElementById('categoryEditId')?.value;
    const name_ar = document.getElementById('categoryNameInput')?.value?.trim();
    if (!name_ar) return showToast('الاسم مطلوب', true);
    try {
      if (id) await api.adminUpdateCategory(id, { name_ar });
      else await api.adminCreateCategory({ name_ar });
      showToast('تم الحفظ');
      categoryModal?.hide();
      await loadCategories();
    } catch (e) {
      showToast(e.message, true);
    }
  }

  async function loadReviewsPanel() {
    const [revRes, repRes] = await Promise.all([
      api.adminGetReviews(),
      api.adminGetReports()
    ]);
    const reviews = revRes.reviews || [];
    const reports = repRes.reports || [];

    const revBody = document.getElementById('reviewsTableBody');
    if (revBody) {
      revBody.innerHTML = reviews.length
        ? reviews.map((r) => `<tr>
          <td>${escapeHtml(fullName(r.first_name, r.last_name))}</td>
          <td>${escapeHtml(fullName(r.provider_first_name, r.provider_last_name))} · ${escapeHtml(r.specialty || '')}</td>
          <td>${'★'.repeat(r.rating)}</td>
          <td>${escapeHtml((r.comment || '').slice(0, 80))}</td>
          <td><button type="button" class="btn btn-sm btn-outline-danger" data-del-review="${r.id}">حذف</button></td>
        </tr>`).join('')
        : '<tr><td colspan="5" class="text-center text-muted py-4">لا تقييمات</td></tr>';

      revBody.querySelectorAll('[data-del-review]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          if (!confirm('حذف التقييم؟')) return;
          try {
            await api.adminDeleteReview(btn.dataset.delReview);
            showToast('تم الحذف');
            await loadReviewsPanel();
            loadedPanels.delete('stats');
          } catch (e) {
            showToast(e.message, true);
          }
        });
      });
    }

    const repBody = document.getElementById('reportsTableBody');
    if (repBody) {
      repBody.innerHTML = reports.length
        ? reports.map((r) => `<tr>
          <td>${escapeHtml(fullName(r.reporter_first, r.reporter_last))}</td>
          <td>${escapeHtml(fullName(r.reported_first, r.reported_last))}</td>
          <td>${escapeHtml((r.reason || '').slice(0, 60))}</td>
          <td>${escapeHtml(r.status)}</td>
          <td>${r.status === 'pending'
            ? `<button type="button" class="btn btn-sm btn-outline-success" data-resolve-report="${r.id}">حلّ</button>`
            : '—'}</td>
        </tr>`).join('')
        : '<tr><td colspan="5" class="text-center text-muted py-4">لا بلاغات</td></tr>';

      repBody.querySelectorAll('[data-resolve-report]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          try {
            await api.adminResolveReport(btn.dataset.resolveReport, 'resolved');
            showToast('تم تحديث البلاغ');
            await loadReviewsPanel();
          } catch (e) {
            showToast(e.message, true);
          }
        });
      });
    }
  }

  async function loadContactMessages() {
    const res = await api.adminGetContactMessages();
    const rows = res.messages || [];
    const tbody = document.getElementById('contactMessagesTableBody');
    if (!tbody) return;

    const contactBadge = document.getElementById('adminContactBadge');
    const newCount = rows.filter((m) => m.status === 'new').length;
    if (contactBadge) {
      contactBadge.textContent = newCount;
      contactBadge.classList.toggle('d-none', !newCount);
    }

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">لا رسائل بعد</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map((m) => {
      const statusBadge = m.status === 'new'
        ? '<span class="badge bg-warning text-dark">جديدة</span>'
        : m.status === 'read'
          ? '<span class="badge bg-success">مقروءة</span>'
          : '<span class="badge bg-secondary">مؤرشف</span>';
      return `<tr class="${m.status === 'new' ? 'table-warning' : ''}">
        <td>${escapeHtml(m.full_name)}</td>
        <td dir="ltr">${escapeHtml(m.phone || '—')}</td>
        <td>${escapeHtml(m.email || '—')}</td>
        <td>${escapeHtml(m.topic || '—')}</td>
        <td style="max-width:220px">${escapeHtml((m.message || '').slice(0, 120))}${(m.message || '').length > 120 ? '…' : ''}</td>
        <td>${formatDate(m.created_at)}</td>
        <td>${statusBadge}</td>
        <td class="text-nowrap">
          ${m.status === 'new'
            ? `<button type="button" class="btn btn-sm btn-outline-primary" data-mark-contact="${m.id}">تعليم كمقروء</button>`
            : '—'}
        </td>
      </tr>`;
    }).join('');

    tbody.querySelectorAll('[data-mark-contact]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          await api.adminMarkContactMessage(btn.dataset.markContact, 'read');
          showToast('تم تعليم الرسالة كمقروءة');
          await loadContactMessages();
          loadedPanels.delete('stats');
        } catch (e) {
          showToast(e.message, true);
        }
      });
    });
  }

  function bindNav() {
    document.querySelectorAll('.fxr-admin-nav-item').forEach((btn) => {
      btn.addEventListener('click', () => switchPanel(btn.dataset.panel));
    });
  }

  function bindSearch() {
    document.getElementById('userSearch')?.addEventListener('input', (e) => {
      const term = e.target.value.trim().toLowerCase();
      const filtered = term
        ? allUsers.filter((u) =>
            fullName(u.first_name, u.last_name).toLowerCase().includes(term) ||
            (u.email || '').toLowerCase().includes(term))
        : allUsers;
      renderUsers(filtered);
    });
    document.getElementById('bookingSearch')?.addEventListener('input', (e) => {
      const term = e.target.value.trim().toLowerCase();
      const filtered = term
        ? allBookings.filter((b) =>
            fullName(b.client_first_name, b.client_last_name).toLowerCase().includes(term) ||
            fullName(b.provider_first_name, b.provider_last_name).toLowerCase().includes(term))
        : allBookings;
      renderBookings(filtered);
    });
  }

  async function init() {
    if (!api?.requireAuth('admin')) return;

    bindNav();
    bindSearch();
    document.getElementById('saveBookingBtn')?.addEventListener('click', saveBooking);
    document.getElementById('saveCategoryBtn')?.addEventListener('click', saveCategory);
    document.getElementById('addCategoryBtn')?.addEventListener('click', () => openCategoryModal('', ''));

    // تفعيل إشعارات الأدمن
    window.fxrInitNotifications?.();

    await loadPanel('stats');
    window.fxrApplyAuthNavState?.();
    window.FixoraAccess?.renderHeaderAuth?.();

    // إذا �cاء الأدمن من إشعار بارامتر panel، انتقل مباشرة لللوحة المناسبة
    const urlPanel = new URLSearchParams(window.location.search).get('panel');
    if (urlPanel) switchPanel(urlPanel);
  }

  document.addEventListener('DOMContentLoaded', init);
})();