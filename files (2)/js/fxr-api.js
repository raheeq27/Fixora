/**
 * FIXORA — عميل API موحّد للواجهة
 */
(function (global) {
  'use strict';

  const BASE = global.FIXORA_API || 'http://localhost:3000';

  function getToken() {
    return localStorage.getItem('token');
  }

  function authHeaders(json = true) {
    const h = {};
    if (json) h['Content-Type'] = 'application/json';
    const t = getToken();
    if (t) h.Authorization = `Bearer ${t.trim()}`;
    return h;
  }

  async function request(path, options = {}) {
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: { ...authHeaders(options.body != null), ...(options.headers || {}) }
    });
    let data = {};
    try {
      data = await res.json();
    } catch (_) {
      data = { success: false, message: await res.text() };
    }
    if (!res.ok) {
      const err = new Error(data.message || `خطأ ${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  const api = {
    get: (path) => request(path),
    post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
    put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
    patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (path) => request(path, { method: 'DELETE' }),

    uploadDocument: (formData) =>
      fetch(`${BASE}/api/documents/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()?.trim() || ''}` },
        body: formData
      }).then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || `خطأ ${res.status}`);
        return data;
      }),
    register: (body) => api.post('/api/auth/register', body),
    login: (body) => api.post('/api/auth/login', body),

    getCategories: () => api.get('/api/categories'),
    getProviders: (params = {}) => {
      const q = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v != null && v !== '') q.set(k, v);
      });
      const qs = q.toString();
      return api.get(`/api/providers${qs ? `?${qs}` : ''}`);
    },
    getProvider: (id) => api.get(`/api/providers/${id}`),
    getProviderReviews: (id) => api.get(`/api/providers/${encodeURIComponent(id)}/reviews`),
    getProviderAvailability: (providerId) =>
      api.get(`/api/providers/${encodeURIComponent(providerId)}/availability`),
    updateProviderAvailability: (schedule) =>
      api.put('/api/providers/me/availability', { schedule }),
    updateProviderPortfolio: (portfolio) =>
      api.put('/api/providers/me/portfolio', { portfolio }),
    updateProviderServiceAreas: (service_areas) =>
      api.put('/api/providers/me/service-areas', { service_areas }),

    createBooking: (body) => api.post('/api/bookings', body),
    getAvailableSlots: (providerId, filter = 'standard') => {
      const q = new URLSearchParams({
        provider_id: providerId,
        filter: filter === 'emergency' ? 'emergency' : 'standard'
      });
      return api.get(`/api/bookings/available-slots?${q.toString()}`);
    },
    getMyBookings: () => api.get('/api/bookings/my-bookings'),
    updateBookingStatus: (id, status) => {
      const mapped = status === 'accepted' ? 'confirmed' : status;
      return api.patch(`/api/bookings/${id}/status`, { status: mapped });
    },

    getProfile: (userId) => api.get(`/api/users/user/${userId}`),
    updateProfile: (body) => api.put('/api/users/update-profile', body),
    getProviderProfile: () => api.get('/api/auth/profile/provider'),
    updateProviderProfile: (body) => api.put('/api/auth/update-profile/provider', body),

    toggleFavorite: (provider_id) => api.post('/api/users/favorites/toggle', { provider_id }),
    getFavorites: () => api.get('/api/users/favorites'),

    getChat: (bookingId) => api.get(`/api/users/bookings/${bookingId}/messages`),
    sendChat: (bookingId, message_text) =>
      api.post(`/api/users/bookings/${bookingId}/messages`, { message_text }),
    getInquiryChat: (inquiryId) => api.get(`/api/users/inquiries/${inquiryId}/messages`),
    sendInquiryChat: (inquiryId, message_text) =>
      api.post(`/api/users/inquiries/${inquiryId}/messages`, { message_text }),
    getInquiryThreads: () => api.get('/api/users/inquiry-threads'),
    startInquiryChat: (providerId) =>
      api.post(`/api/users/providers/${encodeURIComponent(providerId)}/inquiry-chat`, {}),

    getNotifications: () => api.get('/api/users/notifications'),
    markNotificationRead: (id) => api.patch(`/api/users/notifications/${id}/read`, {}),
    postReview: (body) => api.post('/api/users/reviews', body),
    postReport: (body) => api.post('/api/users/reports', body),
    getRateableBookings: (providerId) =>
      api.get(`/api/users/providers/${encodeURIComponent(providerId)}/rateable-bookings`),
    getCompletedBookings: (providerId) =>
      api.get(`/api/users/providers/${encodeURIComponent(providerId)}/completed-bookings`),

    adminGetStats: () => api.get('/api/admin/stats'),
    adminGetUsers: () => api.get('/api/admin/users'),
    adminSetUserBan: (id, banned) => api.patch(`/api/admin/users/${id}/ban`, { banned }),
    adminDeleteUser: (id) => api.delete(`/api/admin/users/${id}`),
    adminGetPendingProviders: () => api.get('/api/admin/providers/pending'),
    adminGetPendingProviderDetails: (profileId) =>
      api.get(`/api/admin/providers/pending/${encodeURIComponent(profileId)}`),
    adminGetBookings: () => api.get('/api/admin/bookings'),
    adminUpdateBooking: (id, body) => api.patch(`/api/admin/bookings/${id}`, body),
    adminVerifyProvider: (userId) => api.put(`/api/admin/verify-provider/${userId}`, {}),
    adminGetCategories: () => api.get('/api/admin/categories'),
    adminCreateCategory: (body) => api.post('/api/admin/categories', body),
    adminUpdateCategory: (id, body) => api.put(`/api/admin/categories/${id}`, body),
    adminDeleteCategory: (id) => api.delete(`/api/admin/categories/${id}`),
    adminSuspendCategory: (id, suspended) => api.patch(`/api/admin/categories/${id}/suspend`, { suspended }),
    adminGetReviews: () => api.get('/api/admin/reviews'),
    adminDeleteReview: (id) => api.delete(`/api/admin/review/${id}`),
    adminGetReports: () => api.get('/api/admin/reports'),
    adminResolveReport: (id, status) => api.patch(`/api/admin/reports/${id}`, { status }),
    adminGetContactMessages: () => api.get('/api/admin/contact-messages'),
    adminMarkContactMessage: (id, status) => api.patch(`/api/admin/contact-messages/${id}`, { status }),

    submitContactMessage: (body) => api.post('/api/contact', body)
  };

  const GOV_MAP = {
    amman: 'Amman',
    irbid: 'Irbid',
    zarqa: 'Zarqa',
    aqaba: 'Aqaba',
    madaba: 'Madaba',
    mafraq: 'Mafraq',
    salt: 'Salat',
    balqa: 'Balqa',
    karak: 'Karak',
    tafilah: 'Tafileh',
    maan: "Ma'an",
    ajloun: 'Ajloun',
    jarash: 'Jerash'
  };

  api.SearchAPI = {
    async search({
      query = '',
      category = '',
      profession = '',
      govs = [],
      rating = 'all',
      available = false,
      page = 1,
      limit = 12
    } = {}) {
      const params = { page, limit };
      if (query) params.q = query;
      if (category) params.category = category;
      if (profession) params.profession = profession;
      
      if (govs.length) {
        params.governorate = govs.join(',');
      }
      
      if (rating !== 'all') params.min_rating = rating;
      if (available) params.available = 'true';

      const json = await api.getProviders(params);
      const data = json.data || [];
      return { data, totalCount: data.length };
    },
    mapGovernorateKeys: GOV_MAP
  };

  api.requireAuth = function (role) {
    const access = global.FixoraAccess;
    const token = getToken();
    if (!token) {
      localStorage.setItem('redirectAfterLogin', location.pathname + location.search);
      location.href = 'login.html';
      return false;
    }
    if (role && access) {
      const userRole = access.getRole();
      const needed = access.normalizeRole(role);
      if (userRole !== needed) {
        location.href = 'unauthorized.html';
        return false;
      }
    }
    return true;
  };

  api.networkHint =
    'تعذر الاتصال بالسيرفر.\nشغّل: node app.js\nثم افتح: http://localhost:3000/';

  global.FixoraAPI = api;
})(window);