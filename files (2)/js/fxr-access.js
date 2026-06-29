/**
 * FIXORA — role-based page guard, nav, and redirects (vanilla JS).
 */
(function (global) {
  'use strict';

  const PUBLIC = new Set([
    'index.html', 'search.html', 'services.html', 'about.html', 'contact.html',
    'login.html', 'register.html', 'privider.html', 'unauthorized.html',
    'provider-profile-edit.html'
  ]);

  const PAGE_ROLES = {
    'user-dashboard.html': ['client'],
    'user.html': ['client'],
    'booking.html': ['client'],
    'chat.html': ['client', 'provider'],
    'provider-dashboard.html': ['provider'],
    'provider-jobs.html': ['provider'],
    'provider-pending.html': ['provider'],
    'test-dashboard.html': ['admin'],
    'admin-dashboard.html': ['admin']
  };

  const ROLE_HOME = {
    client: 'index.html',
    provider: 'index.html',
    admin: 'admin-dashboard.html'
  };

  function normalizeRole(role) {
    if (!role) return null;
    const r = String(role).toLowerCase();
    if (r === 'user') return 'client';
    return r;
  }

  function getToken() {
    return localStorage.getItem('token');
  }

  function decodeJwtRole(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return normalizeRole(payload.role);
    } catch (_) {
      return null;
    }
  }

  function getCurrentUser() {
    try {
      const u = JSON.parse(sessionStorage.getItem('fixora_current_user') || 'null');
      if (u && u.role) return { ...u, role: normalizeRole(u.role) };
    } catch (_) { /* ignore */ }
    const token = getToken();
    if (!token) return null;
    const role = decodeJwtRole(token);
    const userId = localStorage.getItem('userId');
    return role ? { id: userId, role } : null;
  }

  function getRole() {
    return getCurrentUser()?.role || null;
  }

  function isLoggedIn() {
    return !!getToken();
  }

  function currentPage() {
    const name = location.pathname.split('/').filter(Boolean).pop() || 'index.html';
    return name.includes('.html') ? name : `${name}.html`;
  }

  function canAccessPage(page, role) {
    if (PUBLIC.has(page)) return true;
    const allowed = PAGE_ROLES[page];
    if (!allowed) return true;
    if (!role) return false;
    return allowed.includes(role);
  }

  function redirectToRoleHome(role) {
    const home = ROLE_HOME[role] || 'index.html';
    location.replace(home);
  }

  /** ProtectedRoute equivalent — call on every protected page */
  function guardPage() {
    const page = currentPage();
    if (PUBLIC.has(page)) {
      renderNav();
      return;
    }

    const allowed = PAGE_ROLES[page];
    if (!allowed) {
      renderNav();
      return;
    }

    if (!isLoggedIn()) {
      localStorage.setItem('redirectAfterLogin', location.pathname + location.search);
      location.replace('login.html');
      return;
    }

    const role = getRole();
    if (!role || !allowed.includes(role)) {
      const q = new URLSearchParams({ from: page, role: role || 'guest' });
      location.replace(`unauthorized.html?${q.toString()}`);
      return;
    }

    renderNav();
  }

  function buildNavLinks() {
    const role = getRole();
    const loggedIn = isLoggedIn();

    const publicLinks = [
      { href: 'index.html', label: '🏠 الرئيسية' },
      { href: 'services.html', label: '⚙️ الخدمات' },
      { href: 'about.html', label: 'ℹ️ من نحن' },
      { href: 'contact.html', label: '📞 تواصل معنا' }
    ];

    const clientLinks = [
      { href: 'user-dashboard.html', label: '🎛️ لوحة تحكم العميل' },
      { href: 'user.html', label: '👤 ملفي الشخصي' },
      { href: 'search.html', label: '🔍 احجز خدمة' }
    ];

    const providerLinks = [
      { href: 'provider-dashboard.html', label: '🛠️ لوحة تحكم الحرفي' },
      { href: 'provider-dashboard.html#orders', label: '📥 طلبات العمل' },
      { href: 'provider-dashboard.html#messages', label: '💬 الرسائل' },
      { href: 'provider-dashboard.html#profile', label: '👤 ملفي الشخصي' }
    ];

    const adminLinks = [
      { href: 'admin-dashboard.html', label: '⚙️ لوحة الإدارة' }
    ];

    const guestLinks = [
      { href: 'login.html', label: '🔑 تسجيل الدخول' },
      { href: 'register.html', label: '📝 إنشاء حساب' }
    ];

    let roleLinks = [];
    if (loggedIn && role === 'client') roleLinks = clientLinks;
    if (loggedIn && role === 'provider') roleLinks = providerLinks;
    if (loggedIn && role === 'admin') roleLinks = adminLinks;

    return { publicLinks, roleLinks, guestLinks: loggedIn ? [] : guestLinks, loggedIn, role };
  }

  function highlightCurrentNav() {
    const page = currentPage();
    document.querySelectorAll('.fxr-nav a, .fxr-sidebar-link').forEach((a) => {
      const href = (a.getAttribute('href') || '').split('?')[0];
      a.classList.toggle('active', href === page);
    });
  }

  function renderNav() {
    const container = document.querySelector('.fxr-sidebar-links');
    if (!container) return;

    const { publicLinks, roleLinks, guestLinks, loggedIn } = buildNavLinks();

    const linkHtml = (item) =>
      `<a href="${item.href}" class="fxr-sidebar-link">${item.label}</a>`;

    let html = publicLinks.map(linkHtml).join('');
    if (roleLinks.length) {
      html += '<div style="height:1px;background:rgba(255,255,255,0.08);margin:10px 20px"></div>';
      html += roleLinks.map(linkHtml).join('');
    }
    if (guestLinks.length) {
      html += '<div style="height:1px;background:rgba(255,255,255,0.08);margin:10px 20px"></div>';
      html += guestLinks.map(linkHtml).join('');
    }
    if (loggedIn) {
      html += '<div style="height:1px;background:rgba(255,255,255,0.08);margin:10px 20px"></div>';
      html += '<a href="#" class="fxr-sidebar-link" data-fxr-logout style="color:#f75555">🚪 تسجيل الخروج</a>';
    }

    container.innerHTML = html;
    container.querySelectorAll('[data-fxr-logout]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
      });
    });

    renderHeaderAuth();
    highlightCurrentNav();
  }

  function renderHeaderAuth() {
    if (typeof global.fxrRefreshHeader === 'function') {
      global.fxrRefreshHeader();
      return;
    }

    const headerBtns = document.querySelector('.fxr-header-btns');
    if (!headerBtns) return;

    if (!isLoggedIn()) {
      headerBtns.innerHTML = `
        <a href="login.html" class="fxr-btn fxr-btn-outline">دخول</a>
        <a href="register.html" class="fxr-btn fxr-btn-primary">تسجيل مجاناً</a>`;
    }
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    sessionStorage.removeItem('fixora_current_user');
    location.href = 'login.html';
  }

  function resolveRedirectAfterLogin(role) {
    const redirect = localStorage.getItem('redirectAfterLogin');
    if (!redirect) return null;
    localStorage.removeItem('redirectAfterLogin');
    const page = redirect.split('/').pop()?.split('?')[0] || '';
    if (canAccessPage(page, role)) return redirect;
    return null;
  }

  const access = {
    normalizeRole,
    getCurrentUser,
    getRole,
    isLoggedIn,
    currentPage,
    canAccessPage,
    guardPage,
    redirectToRoleHome,
    renderNav,
    logout,
    resolveRedirectAfterLogin,
    PUBLIC,
    PAGE_ROLES,
    ROLE_HOME
  };

  global.FixoraAccess = access;

  document.addEventListener('DOMContentLoaded', () => {
    guardPage();
  });
})(window);
