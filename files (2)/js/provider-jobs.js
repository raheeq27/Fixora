/**
 * FIXORA — طلبات عمل الفني (API)
 */
'use strict';

const api = window.FixoraAPI;

const STATUS_LABEL = {
  pending: 'قيد الانتظار',
  accepted: 'مقبول',
  rejected: 'مرفوض',
  completed: 'مكتمل',
  cancelled: 'ملغى'
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('ar-JO', { dateStyle: 'medium', timeStyle: 'short' });
}

async function loadJobs() {
  const container = document.getElementById('jobsList');
  if (!container) return;

  if (!api.requireAuth('provider')) return;

  try {
    const prof = await api.getProviderProfile();
    if (prof.profile?.is_verified === false) {
      location.replace('provider-pending.html');
      return;
    }
  } catch (_) {
    location.replace('provider-pending.html');
    return;
  }

  container.innerHTML = '<div class="text-center p-4">جاري التحميل...</div>';

  try {
    const json = await api.getMyBookings();
    const jobs = (json.data || []).filter((j) => j.status === 'pending' || j.status === 'accepted');

    if (!jobs.length) {
      container.innerHTML = '<div class="empty-state">لا توجد طلبات حالياً</div>';
      return;
    }

    container.innerHTML = jobs.map((job) => `
      <div class="job-card border rounded p-3 mb-3">
        <h5>${job.category_name || 'طلب خدمة'}</h5>
        <p><strong>العميل:</strong> ${job.client_name || '—'}</p>
        <p><strong>الموعد:</strong> ${formatDate(job.scheduled_at)}</p>
        <p><strong>الحالة:</strong> ${STATUS_LABEL[job.status] || job.status}</p>
        <p class="text-muted small">${job.notes || ''}</p>
        ${job.status === 'pending' ? `
          <button class="btn btn-success btn-sm me-2" onclick="acceptJob('${job.id}')">قبول</button>
          <button class="btn btn-outline-danger btn-sm" onclick="rejectJob('${job.id}')">رفض</button>
        ` : ''}
      </div>
    `).join('');

    const badge = document.getElementById('jobsBadge');
    if (badge) {
      badge.textContent = jobs.filter((j) => j.status === 'pending').length;
    }
  } catch (e) {
    container.innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
  }
}

window.acceptJob = async (id) => {
  try {
    await api.updateBookingStatus(id, 'accepted');
    await loadJobs();
  } catch (e) {
    alert(e.message);
  }
};

window.rejectJob = async (id) => {
  try {
    await api.updateBookingStatus(id, 'rejected');
    await loadJobs();
  } catch (e) {
    alert(e.message);
  }
};

document.addEventListener('DOMContentLoaded', loadJobs);
