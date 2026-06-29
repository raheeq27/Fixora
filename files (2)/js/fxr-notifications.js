/**

 * FIXORA — جرس الإشعارات في الـ Navbar

 */

(function (global) {

  'use strict';



  const POLL_MS = 45000;

  let pollTimer = null;

  let fxrNotifCache = [];

  let fxrUnreadCount = 0;



  function getApi() {

    return global.FixoraAPI;

  }



  function getRole() {

    return global.FixoraAccess?.getRole?.() || localStorage.getItem('userRole');

  }



  function notifDashboardUrl(type) {

    const role = getRole();

    if (role === 'admin') {

      // \u062a\u0648\u062c\u064a\u0647 \u0627\u0644\u0623\u062f\u0645\u0646 \u062d\u0633\u0628 \u0646\u0648\u0639 \u0627\u0644\u0625\u0634\u0639\u0627\u0631

      if (type === 'new_review') return 'admin-dashboard.html?panel=reviews';

      if (type === 'new_booking') return 'admin-dashboard.html?panel=bookings';

      if (type === 'provider_pending') return 'admin-dashboard.html?panel=providers';

      // system_alert \u064a\u062d\u062a\u0648\u064a \u0639\u0644\u0649 \u0628\u0644\u0627\u063a\u0627\u062a \u0648\u063a\u064a\u0631\u0647\u0627 \u2014 \u0646\u0648\u062c\u0647 \u0644\u0644\u0628\u0644\u0627\u063a\u0627\u062a \u0648\u0627\u0644\u062a\u0642\u064a\u064a\u0645\u0627\u062a

      return 'admin-dashboard.html?panel=reviews';

    }

    return role === 'provider'

      ? 'provider-dashboard.html#notifications'

      : 'user-dashboard.html?tab=tab-notifications';

  }



  function parseNotifLink(message) {

    const m = String(message || '').match(/<!--fxr-link:([^>]+)-->/);

    return m ? m[1] : null;

  }



  function displayMessage(message) {

    return String(message || '').replace(/\n<!--fxr-link:[^>]+-->/, '').trim();

  }



  function getDropdown() {

    return document.getElementById('fxrNotifDropdown');

  }



  function getBell() {

    return document.getElementById('fxrNotifBell');

  }



  function isDropdownOpen() {

    const dropdown = getDropdown();

    return dropdown?.classList.contains('show') ?? false;

  }



  function openDropdown() {

    const dropdown = getDropdown();

    const bell = getBell();

    if (!dropdown) return;

    dropdown.classList.add('show');

    dropdown.setAttribute('aria-hidden', 'false');

    bell?.setAttribute('aria-expanded', 'true');

  }



  function closeDropdown() {

    const dropdown = getDropdown();

    const bell = getBell();

    if (!dropdown) return;

    dropdown.classList.remove('show');

    dropdown.setAttribute('aria-hidden', 'true');

    bell?.setAttribute('aria-expanded', 'false');

  }



  function toggleDropdown() {

    if (isDropdownOpen()) closeDropdown();

    else openDropdown();

  }



  function formatTime(iso) {

    try {

      return new Date(iso).toLocaleString('ar-JO', { dateStyle: 'short', timeStyle: 'short' });

    } catch (_) {

      return '';

    }

  }



  function escapeHtml(s) {

    return String(s ?? '')

      .replace(/&/g, '&amp;')

      .replace(/</g, '&lt;')

      .replace(/>/g, '&gt;');

  }



  function updateBadge(count) {

    const badge = document.getElementById('fxrNotifBadge');

    if (!badge) return;

    const n = Math.max(0, parseInt(count, 10) || 0);

    fxrUnreadCount = n;

    badge.textContent = n > 99 ? '99+' : String(n);

    badge.classList.toggle('d-none', n === 0);

  }



  function renderList(items) {

    const list = document.getElementById('fxrNotifList');

    const empty = document.getElementById('fxrNotifEmpty');

    const head = document.querySelector('.fxr-notif-dropdown-head');

    if (!list) return;



    const rows = (items || []).slice(0, 12);

    const hasItems = rows.length > 0;



    if (head) head.style.display = hasItems || rows.length === 0 ? '' : 'none';



    if (!hasItems) {

      list.innerHTML = '';

      list.style.display = 'none';

      empty?.classList.remove('d-none');

      return;

    }



    empty?.classList.add('d-none');

    list.style.display = '';



    list.innerHTML = rows.map((n) => `

      <li class="fxr-notif-item ${n.is_read ? 'read' : ''}" data-notif-id="${n.id}">

        <strong>${escapeHtml(n.title || 'إشعار')}</strong>

        <p>${escapeHtml(displayMessage(n.message))}</p>

        <time>${formatTime(n.created_at)}</time>

      </li>`).join('');



    list.querySelectorAll('[data-notif-id]').forEach((el) => {

      el.addEventListener('click', () => onNotifClick(el.dataset.notifId));

    });

  }



  async function onNotifClick(id) {

    const n = fxrNotifCache.find((x) => String(x.id) === String(id));

    const link = parseNotifLink(n?.message);

    await markRead(id);

    closeDropdown();

    if (link) {

      window.location.href = link;

      return;

    }

    window.location.href = notifDashboardUrl(n?.type);

  }



  async function fetchNotifications() {

    const api = getApi();

    if (!api || !localStorage.getItem('token')) {

      fxrNotifCache = [];

      updateBadge(0);

      if (isDropdownOpen()) renderList([]);

      return { rows: [], unread: 0 };

    }

    try {

      const res = await api.getNotifications();

      const rows = res.data || res.notifications || [];

      fxrNotifCache = rows;

      const unread = res.unread_count != null

        ? res.unread_count

        : rows.filter((n) => !n.is_read).length;

      updateBadge(unread);

      if (isDropdownOpen()) renderList(rows);

      return { rows, unread };

    } catch (_) {

      return { rows: fxrNotifCache, unread: fxrUnreadCount };

    }

  }



  async function markRead(id) {

    const api = getApi();

    if (!api || !id) return;

    try {

      await api.markNotificationRead(id);

      fxrNotifCache = fxrNotifCache.map((n) =>

        String(n.id) === String(id) ? { ...n, is_read: true } : n

      );

      const unread = fxrNotifCache.filter((n) => !n.is_read).length;

      updateBadge(unread);

      if (isDropdownOpen()) renderList(fxrNotifCache);

      global.fxrOnNotificationsUpdated?.(fxrNotifCache, unread);

    } catch (_) { /* ignore */ }

  }



  async function onBellClick(e) {

    e.preventDefault();

    e.stopPropagation();



    if (isDropdownOpen()) {

      closeDropdown();

      return;

    }



    const { rows } = await fetchNotifications();

    openDropdown();

    renderList(rows);

  }



  function bindUi() {

    const bell = getBell();

    const dropdown = getDropdown();

    if (!bell || !dropdown || bell.dataset.fxrNotifBound) return;

    bell.dataset.fxrNotifBound = '1';



    closeDropdown();

    bell.addEventListener('click', onBellClick);



    document.addEventListener('click', (e) => {

      if (!isDropdownOpen()) return;

      const wrap = document.getElementById('fxrNotifWrap');

      if (wrap?.contains(e.target)) return;

      closeDropdown();

    });



    dropdown.addEventListener('click', (e) => e.stopPropagation());



    document.addEventListener('keydown', (e) => {

      if (e.key === 'Escape' && isDropdownOpen()) closeDropdown();

    });

  }



  function startPoll() {

    if (pollTimer) clearInterval(pollTimer);

    if (!localStorage.getItem('token')) return;

    pollTimer = setInterval(fetchNotifications, POLL_MS);

  }



  function fxrInitNotifications() {

    if (!localStorage.getItem('token')) return;

    bindUi();

    fetchNotifications();

    startPoll();

  }



  global.fxrInitNotifications = fxrInitNotifications;

  global.fxrRefreshNotifications = fetchNotifications;

  global.fxrCloseNotifDropdown = closeDropdown;

  global.fxrNotifDisplayMessage = displayMessage;

  global.fxrNotifParseLink = parseNotifLink;

})(window);