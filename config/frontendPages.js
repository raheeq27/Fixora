/**
 * Frontend page zones and clean URL aliases (logical /client/*, /provider/*, /admin/*).
 */
export const PUBLIC_PAGES = new Set([
  'index.html',
  'search.html',
  'services.html',
  'about.html',
  'contact.html',
  'login.html',
  'register.html',
  'privider.html',
  'unauthorized.html'
]);

/** filename → allowed roles (must be logged in) */
export const PAGE_ROLES = {
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

export const ROLE_HOME = {
  client: '/index.html',
  provider: '/index.html',
  admin: '/admin/panel'
};

export const URL_ALIASES = {
  client: {
    dashboard: 'user-dashboard.html',
    profile: 'user.html',
    booking: 'booking.html',
    chat: 'chat.html'
  },
  provider: {
    dashboard: 'provider-dashboard.html',
    jobs: 'provider-jobs.html',
    profile: 'provider-dashboard.html#security',
    'public-profile': 'privider.html'
  },
  admin: {
    panel: 'admin-dashboard.html',
    dashboard: 'admin-dashboard.html'
  }
};
