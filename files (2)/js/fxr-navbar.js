/**
 * FIXORA — shared mobile sidebar toggle
 */
(function (global) {
  'use strict';

  function fxrToggleSidebar(forceClose) {
    const sidebar = document.getElementById('fxrMainSidebar');
    const overlay = document.getElementById('fxrSidebarOverlay');
    if (!sidebar || !overlay) return;

    const open = forceClose === true ? false : !sidebar.classList.contains('active');
    sidebar.classList.toggle('active', open);
    overlay.classList.toggle('active', open);
    document.body.classList.toggle('fxr-sidebar-open', open);
  }

  function fxrCloseSidebar() {
    fxrToggleSidebar(true);
  }

  function bindNavbar() {
    document.querySelectorAll('[data-fxr-sidebar-toggle]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        fxrToggleSidebar();
      });
    });

    const overlay = document.getElementById('fxrSidebarOverlay');
    if (overlay && !overlay.dataset.fxrBound) {
      overlay.dataset.fxrBound = '1';
      overlay.addEventListener('click', () => fxrCloseSidebar());
    }

    document.querySelectorAll('.fxr-sidebar-close').forEach((btn) => {
      if (btn.dataset.fxrBound) return;
      btn.dataset.fxrBound = '1';
      btn.addEventListener('click', () => fxrCloseSidebar());
    });

    document.querySelectorAll('.fxr-main-sidebar a.fxr-sidebar-link').forEach((link) => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 900) fxrCloseSidebar();
      });
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 900) fxrCloseSidebar();
    });
  }

  global.fxrToggleSidebar = fxrToggleSidebar;
  global.fxrCloseSidebar = fxrCloseSidebar;

  document.addEventListener('DOMContentLoaded', bindNavbar);
})(window);
