/**
 * FIXORA — شريط علوي ديناميكي (اسم المستخدم + إشعارات)
 */
(function (global) {
  'use strict';

  const NOTIF_HTML = `
    <div class="fxr-notif-wrap" id="fxrNotifWrap">
      <button type="button" class="fxr-notif-bell" id="fxrNotifBell" aria-label="الإشعارات" aria-expanded="false">
        <span class="fxr-notif-icon">🔔</span>
        <span class="fxr-notif-badge d-none" id="fxrNotifBadge">0</span>
      </button>
      <div class="fxr-notif-dropdown" id="fxrNotifDropdown" role="menu" aria-hidden="true">
        <div class="fxr-notif-dropdown-head">
          <strong>الإشعارات</strong>
        </div>
        <ul class="fxr-notif-list" id="fxrNotifList"></ul>
        <p class="fxr-notif-empty d-none" id="fxrNotifEmpty">لا توجد إشعارات جديدة</p>
      </div>
    </div>`;

  function getDisplayName() {
    const access = global.FixoraAccess;
    const u = access?.getCurrentUser?.();
    if (u) {
      const full = [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
      if (full) return full;
      if (u.name) return String(u.name).trim();
    }
    try {
      const stored = JSON.parse(sessionStorage.getItem('fixora_current_user') || 'null');
      if (stored) {
        const full = [stored.first_name, stored.last_name].filter(Boolean).join(' ').trim();
        if (full) return full;
      }
    } catch (_) { /* ignore */ }
    const local = localStorage.getItem('userName');
    return local ? String(local).trim() : '';
  }

  async function ensureUserInSession() {
    const access = global.FixoraAccess;
    const u = access?.getCurrentUser?.();
    if (u?.first_name || u?.name) return;
    const userId = localStorage.getItem('userId');
    const api = global.FixoraAPI;
    if (!userId || !api?.getProfile) return;
    try {
      const res = await api.getProfile(userId);
      const user = res.user || res;
      if (user) sessionStorage.setItem('fixora_current_user', JSON.stringify(user));
    } catch (_) { /* ignore */ }
  }

  function roleDashboard() {
    const role = global.FixoraAccess?.getRole?.() || '';
    if (role === 'client') return { href: 'user-dashboard.html', label: 'لوحة العميل' };
    if (role === 'provider') return { href: 'provider-dashboard.html', label: 'لوحة الحرفي' };
    if (role === 'admin') return { href: 'admin-dashboard.html', label: 'لوحة الإدارة' };
    return { href: 'index.html', label: 'الرئيسية' };
  }

  function renderLoggedInHeader(headerBtns) {
    const dash = roleDashboard();
    const name = getDisplayName();

    headerBtns.innerHTML = `
      <div class="fxr-header-auth-cluster">
        ${NOTIF_HTML}
        <span class="fxr-header-user" id="fxrHeaderUser">${name ? escapeHtml(name) : ''}</span>
      </div>
      <a href="${dash.href}" class="fxr-btn fxr-btn-outline fxr-header-dash">${dash.label}</a>
      <button type="button" class="logout-btn" id="fxrHeaderLogout" data-fxr-logout>تسجيل الخروج</button>`;

    const userEl = document.getElementById('fxrHeaderUser');
    if (userEl) userEl.classList.toggle('d-none', !name);

    headerBtns.querySelector('[data-fxr-logout]')?.addEventListener('click', (e) => {
      e.preventDefault();
      global.FixoraAccess?.logout?.();
    });

    if (typeof global.fxrInitNotifications === 'function') {
      global.fxrInitNotifications();
    }
  }

  function renderGuestHeader(headerBtns) {
    headerBtns.innerHTML = `
      <a href="login.html" class="fxr-btn fxr-btn-outline">دخول</a>
      <a href="register.html" class="fxr-btn fxr-btn-primary">تسجيل مجاناً</a>`;
  }

  function escapeHtml(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  async function refreshHeader() {
    const headerBtns = document.querySelector('.fxr-header-btns');
    if (!headerBtns) return;

    const loggedIn = !!localStorage.getItem('token');
    if (!loggedIn) {
      renderGuestHeader(headerBtns);
      return;
    }

    await ensureUserInSession();
    renderLoggedInHeader(headerBtns);
  }

  global.fxrRefreshHeader = refreshHeader;

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(refreshHeader, 0);
  });
})(window);
