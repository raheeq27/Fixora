/**
 * FIXORA — تحميل navbar و footer الموحّدين
 */
(function (global) {
  'use strict';

  async function loadPartial(url, rootId) {
    const root = document.getElementById(rootId);
    if (!root) return;
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(res.statusText);
      root.innerHTML = await res.text();
    } catch (e) {
      console.warn('FXR layout:', url, e.message);
    }
  }

  function applyAuthNavState() {
    const access = global.FixoraAccess;
    const token = localStorage.getItem('token');
    const loggedIn = !!token;
    const role = access?.getRole?.() || localStorage.getItem('role');

    document.querySelectorAll('.fxr-guest-only').forEach((el) => {
      el.classList.toggle('d-none', loggedIn);
    });
    document.querySelectorAll('.fxr-logged-in-only').forEach((el) => {
      el.classList.toggle('d-none', !loggedIn);
    });

    document.querySelectorAll('.fxr-role-client').forEach((el) => {
      el.classList.toggle('d-none', role !== 'client');
    });
    document.querySelectorAll('.fxr-role-provider').forEach((el) => {
      el.classList.toggle('d-none', role !== 'provider');
    });
    document.querySelectorAll('.fxr-role-admin').forEach((el) => {
      el.classList.toggle('d-none', role !== 'admin');
    });

    const notifWrap = document.getElementById('fxrNotifWrap');
    if (notifWrap) notifWrap.classList.toggle('d-none', !loggedIn);

    const userEl = document.getElementById('fxrHeaderUser');
    if (userEl && loggedIn) {
      const u = access?.getCurrentUser?.();
      const name = u
        ? [u.first_name, u.last_name].filter(Boolean).join(' ') || u.name || ''
        : '';
      userEl.textContent = name ? `مرحباً، ${name}` : '';
      userEl.classList.toggle('d-none', !name);
    }

    const adminBadge = document.getElementById('fxrAdminBadge');
    if (adminBadge) {
      const isAdminPage = document.body.classList.contains('fxr-admin-page');
      adminBadge.classList.toggle('d-none', !(role === 'admin' && isAdminPage));
    }

    document.getElementById('fxrHeaderLogout')?.addEventListener('click', (e) => {
      e.preventDefault();
      access?.logout?.();
    }, { once: true });

    document.querySelectorAll('[data-fxr-logout]').forEach((el) => {
      if (el.dataset.fxrLogoutBound) return;
      el.dataset.fxrLogoutBound = '1';
      el.addEventListener('click', (e) => {
        e.preventDefault();
        access?.logout?.();
      });
    });
  }

  async function initLayout() {
    const base = document.body.dataset.fxrPartialsBase || 'partials/';
    await Promise.all([
      loadPartial(`${base}navbar.html`, 'fxr-navbar-root'),
      loadPartial(`${base}footer.html`, 'fxr-footer-root')
    ]);
    applyAuthNavState();
    if (typeof global.fxrRefreshHeader === 'function') {
      global.fxrRefreshHeader();
    } else if (global.FixoraAccess?.renderHeaderAuth) {
      global.FixoraAccess.renderHeaderAuth();
    } else if (typeof global.fxrInitNotifications === 'function') {
      global.fxrInitNotifications();
    }
    if (typeof global.fxrCloseSidebar === 'function') {
      document.querySelectorAll('.fxr-sidebar-close').forEach((btn) => {
        btn.addEventListener('click', () => global.fxrCloseSidebar());
      });
    }
  }

  document.addEventListener('DOMContentLoaded', initLayout);
  global.fxrApplyAuthNavState = applyAuthNavState;
})(window);
