/**
 * FIXORA — بروفايل الحرفي (بيانات حقيقية من API)
 */
'use strict';

const api = window.FixoraAPI;
let fxrProviderData = null;
let fxrCurrentProviderId = null;
let fxrIsFavorite = false;

const GOV_AR = {
  Amman: 'عمّان', Irbid: 'إربد', Zarqa: 'الزرقاء', Aqaba: 'العقبة',
  Balqa: 'البلقاء', Mafraq: 'المفرق', Jerash: 'جرش', Ajloun: 'عجلون',
  Madaba: 'مادبا', Karak: 'الكرك', Tafileh: 'الطفيلة', "Ma'an": 'معان'
};

const DAY_AR = {
  sun: 'الأحد', mon: 'الإثنين', tue: 'الثلاثاء', wed: 'الأربعاء',
  thu: 'الخميس', fri: 'الجمعة', sat: 'السبت'
};

function fxrBuildStars(rating) {
  const r = parseFloat(rating) || 0;
  const full = Math.floor(r);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

function fxrShowToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2600);
}

function fxrGetProviderIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id') || params.get('provider_id');
  return id ? String(id).trim() : null;
}

function fxrUpdateBookingLink(providerId) {
  const id = providerId || fxrCurrentProviderId || fxrGetProviderIdFromUrl();
  if (!id) return;

  fxrCurrentProviderId = id;
  sessionStorage.setItem('fixora_booking_provider_id', id);

  const bookBtn = document.getElementById('bookBtn');
  const messageBtn = document.getElementById('messageBtn');

  if (bookBtn) {
    const verified = fxrProviderData?.is_verified !== false;
    const banned = fxrProviderData?.is_banned === true;
    if (banned) {
      bookBtn.removeAttribute('href');
      bookBtn.setAttribute('aria-disabled', 'true');
      bookBtn.classList.add('disabled');
      bookBtn.title = 'هذا الحرفي غير متاح للحجز (تم تعليق حسابه)';
      bookBtn.textContent = '🚫 غير متاح للحجز';
    } else if (verified) {
      bookBtn.href = `booking.html?id=${encodeURIComponent(id)}`;
      bookBtn.removeAttribute('aria-disabled');
      bookBtn.classList.remove('disabled');
      bookBtn.title = '';
      bookBtn.textContent = '📅 احجز الآن';
    } else {
      bookBtn.removeAttribute('href');
      bookBtn.setAttribute('aria-disabled', 'true');
      bookBtn.classList.add('disabled');
      bookBtn.title = 'الحرفي بانتظار اعتماد الإدارة';
    }
  }
  if (messageBtn) {
    messageBtn.href = `chat.html?providerId=${encodeURIComponent(id)}`;
    messageBtn.removeAttribute('aria-disabled');
  }
}

function fxrRenderProviderInfo() {
  const p = fxrProviderData;
  if (!p) return;

  const name = `${p.first_name || ''} ${p.last_name || ''}`.trim();
  const gov = GOV_AR[p.governorate] || p.governorate || '—';

  const set = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  set('providerName', name || 'حرفي Fixora');
  set('providerSpecialty', `🔧 ${p.specialty || 'مقدم خدمة'}`);
  set('starsRating', fxrBuildStars(p.avg_rating));
  set('ratingValue', parseFloat(p.avg_rating) || 'جديد');
  set('reviewsCount', `(${p.reviews?.length || 0} تقييم)`);

  const avatarEl = document.getElementById('avatarCircle');
  if (avatarEl) {
    avatarEl.textContent = p.profile_pic_url
      ? ''
      : '🧑‍🔧';
    if (p.profile_pic_url) {
      avatarEl.innerHTML = `<img src="${p.profile_pic_url}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    }
  }

  const locationTagsEl = document.getElementById('locationTags');
  if (locationTagsEl) {
    locationTagsEl.innerHTML = `<span class="fxr-location-tag">📍 ${gov}</span>`;
    if (p.is_banned) {
      locationTagsEl.innerHTML += '<span class="fxr-location-tag" style="background:#fdecea;color:#c0392b">🚫 غير متاح للحجز</span>';
    } else if (p.is_verified) {
      locationTagsEl.innerHTML += '<span class="fxr-location-tag">✅ موثّق</span>';
    }
  }

  set('phoneNumber', p.phone || '—');
  set('email', p.email || '—');

  const bioEl = document.getElementById('providerBio');
  if (bioEl) bioEl.textContent = p.bio || 'لا توجد نبذة بعد.';
}

function fxrRenderServices() {
  const p = fxrProviderData;
  if (!p) return;

  const servicesList = document.getElementById('servicesList');
  if (servicesList) {
    const items = (p.services || []).map((s) => s.name_ar);
    servicesList.innerHTML = items.length
      ? items.map((s) => `<span class="fxr-service-tag">${s}</span>`).join('')
      : `<span class="fxr-service-tag">${p.specialty || 'خدمات متنوعة'}</span>`;
  }

  const priceRangeEl = document.getElementById('priceRange');
  if (priceRangeEl) {
    priceRangeEl.innerHTML = '<span class="fxr-price-note">السعر يُحدد بعد معاينة المشكلة</span>';
  }
}

function fxrRenderSchedule() {
  const p = fxrProviderData;
  const scheduleTable = document.getElementById('scheduleTable');
  if (!scheduleTable || !p) return;

  const rows = p.availability || [];
  if (!rows.length) {
    scheduleTable.innerHTML = '<p class="text-muted">لم يُحدد جدول عمل بعد.</p>';
    return;
  }

  scheduleTable.innerHTML = rows.map((row) => `
    <div class="fxr-schedule-row">
      <div class="fxr-schedule-day">${DAY_AR[row.day_of_week] || row.day_of_week}</div>
      <div class="fxr-schedule-hours">${row.start_time} – ${row.end_time}</div>
      <div class="fxr-schedule-status ${row.is_available ? 'available' : 'closed'}">
        ${row.is_available ? 'متاح' : 'غير متاح'}
      </div>
    </div>
  `).join('');
}

function fxrRenderReviews() {
  const p = fxrProviderData;
  if (!p) return;

  const reviews = p.reviews || [];
  const avg = parseFloat(p.avg_rating) || 0;

  const set = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  set('summaryScore', avg > 0 ? avg.toFixed(1) : '—');
  set('summaryStars', fxrBuildStars(avg));
  set('summaryCount', reviews.length
    ? `بناءً على ${reviews.length} تقييم`
    : 'لا توجد تقييمات بعد');

  fxrRenderRatingBars(reviews);

  const reviewsList = document.getElementById('reviewsList');
  if (reviewsList) {
    const visible = reviews.slice(0, 3);
    reviewsList.innerHTML = visible.length
      ? visible.map((r) => `
        <div class="fxr-review-card">
          <div class="fxr-review-header">
            <div class="fxr-reviewer-avatar">${(r.first_name || 'ع')[0]}</div>
            <div class="fxr-reviewer-info">
              <div class="fxr-reviewer-name">${r.first_name || ''} ${r.last_name || ''}</div>
              <div class="fxr-review-stars">${fxrBuildStars(r.rating)}</div>
            </div>
            <div class="fxr-review-date">${new Date(r.created_at).toLocaleDateString('ar-JO')}</div>
          </div>
          <p class="fxr-review-text">${r.comment || ''}</p>
        </div>`).join('')
      : '<p class="text-muted">لا توجد تقييمات بعد.</p>';
  }

  const showMoreBtn = document.getElementById('showMoreReviews');
  if (showMoreBtn) {
    showMoreBtn.style.display = reviews.length > 3 ? 'block' : 'none';
  }
}

function fxrRenderRatingBars(reviews) {
  const barsContainer = document.getElementById('ratingBars');
  if (!barsContainer) return;

  const counts = [0, 0, 0, 0, 0];
  reviews.forEach((r) => {
    const star = Math.round(parseFloat(r.rating));
    if (star >= 1 && star <= 5) counts[star - 1] += 1;
  });
  const total = reviews.length;

  barsContainer.innerHTML = [5, 4, 3, 2, 1].map((star) => {
    const count = counts[star - 1];
    const pct = total ? Math.round((count / total) * 100) : 0;
    return `
      <div class="fxr-rating-bar-item">
        <span class="fxr-bar-label">${star} ★</span>
        <div class="fxr-bar-bg"><div class="fxr-bar-fill" style="width: ${pct}%"></div></div>
        <span class="fxr-bar-percent">${pct}%</span>
      </div>`;
  }).join('');
}

function fxrRenderGallery() {
  const galleryGrid = document.getElementById('galleryGrid');
  if (!galleryGrid) return;

  const items = fxrProviderData?.portfolio || [];
  if (!items.length) {
    galleryGrid.innerHTML = '<p class="text-muted p-3">لم يُضف الحرفي أعمالاً في المعرض بعد.</p>';
    return;
  }

  galleryGrid.innerHTML = items.map((item) => `
    <div class="fxr-gallery-item">
      ${item.imageData
        ? `<img src="${item.imageData}" alt="" style="width:100%;height:140px;object-fit:cover;border-radius:8px 8px 0 0">`
        : `<div class="fxr-gallery-icon">${item.icon || '🖼️'}</div>`}
      <div class="fxr-gallery-caption">${item.description || ''}</div>
    </div>`).join('');
}

function fxrAreasForDisplay() {
  const p = fxrProviderData;
  if (!p) return [];
  const fromList = Array.isArray(p.service_areas) ? p.service_areas : [];
  if (fromList.length) return fromList;
  if (p.serviced_areas_text) {
    return String(p.serviced_areas_text)
      .split(/[,،]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function fxrRenderAreas() {
  const areasList = document.getElementById('areasList');
  if (!areasList || !fxrProviderData) return;

  const areas = fxrAreasForDisplay();
  const tags = areas.map((a) => {
    const label = typeof a === 'string'
      ? a
      : (a.district || GOV_AR[a.governorate] || a.governorate || null);
    return label ? `<span class="fxr-area-tag">${label}</span>` : '';
  }).filter(Boolean);

  areasList.innerHTML = tags.length
    ? tags.join('')
    : '<p class="text-muted" style="margin:0">لم يُحدد الحرفي المناطق التي يقدّم فيها خدمته بعد.</p>';
}

let fxrReviewsExpanded = false;

function fxrShowMoreReviews() {
  fxrReviewsExpanded = !fxrReviewsExpanded;
  const reviews = fxrProviderData?.reviews || [];
  const reviewsList = document.getElementById('reviewsList');
  const showMoreBtn = document.getElementById('showMoreReviews');
  if (!reviewsList) return;

  const visible = fxrReviewsExpanded ? reviews : reviews.slice(0, 3);
  reviewsList.innerHTML = visible.length
    ? visible.map((r) => `
      <div class="fxr-review-card">
        <div class="fxr-review-header">
          <div class="fxr-reviewer-avatar">${(r.first_name || 'ع')[0]}</div>
          <div class="fxr-reviewer-info">
            <div class="fxr-reviewer-name">${r.first_name || ''} ${r.last_name || ''}</div>
            <div class="fxr-review-stars">${fxrBuildStars(r.rating)}</div>
          </div>
          <div class="fxr-review-date">${new Date(r.created_at).toLocaleDateString('ar-JO')}</div>
        </div>
        <p class="fxr-review-text">${r.comment || ''}</p>
      </div>`).join('')
    : '<p class="text-muted">لا توجد تقييمات بعد.</p>';

  if (showMoreBtn) {
    showMoreBtn.textContent = fxrReviewsExpanded
      ? 'عرض أقل ←'
      : 'عرض المزيد من التقييمات ←';
  }
}

let fxrReviewsPollTimer = null;
let fxrLastReviewSignature = '';
let fxrSelectedRating = 5;
let fxrRateableBookings = [];

function fxrInitStarPicker() {
  const picker = document.getElementById('starPicker');
  if (!picker) return;
  picker.querySelectorAll('.fxr-star-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      fxrSelectedRating = parseInt(btn.dataset.star, 10);
      picker.querySelectorAll('.fxr-star-btn').forEach((b) => {
        const s = parseInt(b.dataset.star, 10);
        b.textContent = s <= fxrSelectedRating ? '★' : '☆';
        b.classList.toggle('active', s === fxrSelectedRating);
      });
    });
  });
}

function fxrFormatBookingOption(b) {
  const when = b.scheduled_at || b.created_at;
  const dateStr = when
    ? new Date(when).toLocaleDateString('ar-JO', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';
  return `${b.category_name || 'طلب خدمة'} — ${dateStr}`;
}

async function fxrLoadRateableBookings() {
  const card = document.getElementById('rateServiceCard');
  const loginMsg = document.getElementById('rateLoginMsg');
  const pickerWrap = document.getElementById('rateBookingPickerWrap');
  const select = document.getElementById('rateBookingSelect');
  const hint = document.getElementById('rateServiceHint');
  const submitBtn = document.getElementById('submitReviewBtn');
  const starPicker = document.getElementById('starPicker');
  const comment = document.getElementById('rateCommentInput');

  if (!card) return;

  const params = new URLSearchParams(window.location.search);
  const justBooked = params.get('booked') === '1';

  const showFormParts = (show) => {
    [starPicker, comment, submitBtn, hint].forEach((el) => {
      if (el) el.hidden = !show;
    });
    if (pickerWrap) pickerWrap.hidden = !show || (fxrRateableBookings.length <= 1);
  };

  if (!localStorage.getItem('token')) {
    card.hidden = false;
    if (loginMsg) loginMsg.hidden = false;
    showFormParts(false);
    if (hint) {
      hint.hidden = false;
      hint.textContent = justBooked
        ? 'تم إرسال طلب الحجز. سجّل الدخول لتتمكن من التقييم بعد إتمام الخدمة.'
        : 'سجّل الدخول كعميل لتقييم الخدمة بعد إتمام الحجز.';
    }
    return;
  }

  if (loginMsg) loginMsg.hidden = true;

  const role = window.FixoraAccess?.getRole?.();
  if (role !== 'client') {
    card.hidden = true;
    return;
  }

  try {
    const res = await api.getRateableBookings(fxrCurrentProviderId);
    fxrRateableBookings = res.bookings || [];

    // جلب جميع الحجوزات المكتملة (حتى المقيّمة) لإتاحة قسم البلاغ بشكل مستقل
    let completedBookings = [];
    try {
      const cRes = await api.getCompletedBookings(fxrCurrentProviderId);
      completedBookings = cRes.bookings || [];
    } catch (_) {
      completedBookings = fxrRateableBookings.slice();
    }

    const reportWrap = document.getElementById('secretReportWrap');
    const reportSelect = document.getElementById('reportBookingSelect');

    const populateReportSelect = () => {
      if (reportSelect && completedBookings.length) {
        reportSelect.innerHTML = completedBookings
          .map((b) => `<option value="${b.id}">${fxrFormatBookingOption(b)}</option>`)
          .join('');
      }
    };

    if (!fxrRateableBookings.length) {
      if (completedBookings.length) {
        // لا يوجد حجوزات للتقييم لكن يوجد مكتملة — أظهر قسم البلاغ فقط
        card.hidden = false;
        showFormParts(false);
        if (hint) {
          hint.hidden = false;
          hint.textContent = 'لقد قيّمت جميع حجوزاتك مع هذا الحرفي. يمكنك تقديم بلاغ إن لزم.';
        }
        if (reportWrap) {
          reportWrap.hidden = false;
          populateReportSelect();
        }
      } else if (justBooked) {
        card.hidden = false;
        showFormParts(false);
        if (hint) {
          hint.hidden = false;
          hint.textContent =
            'تم إرسال طلب الحجز بنجاح. يمكنك تقييم الحرفي هنا بعد إتمام الخدمة وتحويل الحجز إلى «مكتمل».';
        }
      } else {
        card.hidden = true;
      }
      return;
    }

    card.hidden = false;
    showFormParts(true);
    if (reportWrap) {
      reportWrap.hidden = false;
      populateReportSelect();
    }
    if (hint) {
      hint.textContent = fxrRateableBookings.length === 1
        ? 'لديك حجز مكتمل — شاركنا رأيك في الخدمة:'
        : 'اختر الحجز الذي تريد تقييمه:';
    }

    if (select) {
      select.innerHTML = fxrRateableBookings
        .map((b) => `<option value="${b.id}">${fxrFormatBookingOption(b)}</option>`)
        .join('');
    }
    if (pickerWrap) pickerWrap.hidden = fxrRateableBookings.length <= 1;
  } catch (_) {
    card.hidden = !justBooked;
    if (justBooked && hint) {
      showFormParts(false);
      hint.textContent = 'تم إرسال طلب الحجز. يمكنك التقييم بعد إتمام الخدمة.';
    }
  }
}
async function fxrSubmitProviderReview() {
  if (!api.requireAuth('client')) return;

  const select = document.getElementById('rateBookingSelect');
  const bookingId = select?.value || fxrRateableBookings[0]?.id;
  if (!bookingId) {
    fxrShowToast('لا يوجد حجز متاح للتقييم');
    return;
  }

  const comment = document.getElementById('rateCommentInput')?.value?.trim() || '';
  const btn = document.getElementById('submitReviewBtn');
  if (btn) btn.disabled = true;

  try {
    await api.postReview({
      booking_id: bookingId,
      rating: fxrSelectedRating,
      comment
    });
    fxrShowToast('شكراً! تم إرسال تقييمك وتحديث التقييمات.');
    fxrLastReviewSignature = '';
    document.getElementById('rateCommentInput').value = '';
    await fxrLoadRateableBookings();
    await fxrRefreshReviews();
  } catch (e) {
    fxrShowToast(e.message || 'تعذر إرسال التقييم');
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function fxrSubmitSecretReport() {
  if (!api.requireAuth('client')) return;

  // \u064a\u0633\u062a\u062e\u062f\u0645 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u062d\u062c\u0648\u0632\u0627\u062a \u0627\u0644\u0645\u0643\u062a\u0645\u0644\u0629 \u0627\u0644\u062e\u0627\u0635\u0629 \u0628\u0627\u0644\u0628\u0644\u0627\u063a (\u0645\u0646\u0641\u0635\u0644\u0629 \u0639\u0646 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u062a\u0642\u064a\u064a\u0645)
  const reportSelect = document.getElementById('reportBookingSelect');
  const rateSelect = document.getElementById('rateBookingSelect');
  const bookingId = reportSelect?.value || rateSelect?.value || fxrRateableBookings[0]?.id;
  const reason = document.getElementById('reportReasonInput')?.value?.trim() || '';
  const confirmed = document.getElementById('reportConfirmCheck')?.checked;

  if (!bookingId) {
    fxrShowToast('اختر الحجز أولاً');
    return;
  }
  if (!confirmed) {
    fxrShowToast('يجب تأكيد البلاغ');
    return;
  }
  if (reason.length < 10) {
    fxrShowToast('اكتب سبب البلاغ (10 أحرف على الأقل)');
    return;
  }

  const btn = document.getElementById('submitReportBtn');
  if (btn) btn.disabled = true;

  try {
    await api.postReport({ booking_id: bookingId, reason });
    fxrShowToast('تم إرسال البلاغ للإدارة بنجاح — سيصلك إشعار للمسؤول.');
    document.getElementById('reportReasonInput').value = '';
    document.getElementById('reportConfirmCheck').checked = false;
    window.fxrRefreshNotifications?.();
  } catch (e) {
    fxrShowToast(e.message || 'تعذر إرسال البلاغ');
  } finally {
    if (btn) btn.disabled = false;
  }
}

function fxrApplyUrlTab() {
  const tab = new URLSearchParams(window.location.search).get('tab');
  if (tab === 'reviews') fxrSwitchTab('reviews');
}

function fxrReviewsSignature(reviews, avg) {
  const list = reviews || [];
  return `${avg}|${list.length}|${list[0]?.id || ''}|${list[0]?.created_at || ''}`;
}

async function fxrRefreshReviews() {
  if (!fxrCurrentProviderId || !api) return;
  try {
    const json = await api.getProviderReviews(fxrCurrentProviderId);
    const sig = fxrReviewsSignature(json.reviews, json.avg_rating);
    if (sig === fxrLastReviewSignature && fxrProviderData?.reviews?.length) return;
    fxrLastReviewSignature = sig;

    if (!fxrProviderData) fxrProviderData = {};
    fxrProviderData.reviews = json.reviews || [];
    fxrProviderData.avg_rating = json.avg_rating;
    fxrRenderProviderInfo();
    fxrRenderReviews();
  } catch (_) {
    /* ignore poll errors */
  }
}

function fxrStartReviewsPoll() {
  if (fxrReviewsPollTimer) clearInterval(fxrReviewsPollTimer);
  fxrRefreshReviews();
  fxrReviewsPollTimer = setInterval(fxrRefreshReviews, 8000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') fxrRefreshReviews();
  });
}

function fxrSwitchTab(tabId) {
  document.querySelectorAll('.fxr-tab').forEach((t) => t.classList.remove('active'));
  document.querySelector(`.fxr-tab[data-tab="${tabId}"]`)?.classList.add('active');
  document.querySelectorAll('.fxr-tab-content').forEach((c) => c.classList.remove('active'));
  document.getElementById(`${tabId}Tab`)?.classList.add('active');
  if (tabId === 'reviews') {
    fxrRefreshReviews();
    fxrLoadRateableBookings();
  }
}

function fxrMessageProvider() {
  if (!fxrCurrentProviderId) return;
  if (!api.requireAuth('client')) return;
  window.location.href = `chat.html?providerId=${encodeURIComponent(fxrCurrentProviderId)}`;
}

function fxrUpdateFavoriteButton() {
  const favIcon = document.getElementById('favIcon');
  const favText = document.getElementById('favText');
  const favBtn = document.getElementById('favBtn');
  if (fxrIsFavorite) {
    favBtn?.classList.add('active');
    if (favIcon) favIcon.textContent = '❤️';
    if (favText) favText.textContent = 'في المفضلة';
  } else {
    favBtn?.classList.remove('active');
    if (favIcon) favIcon.textContent = '🤍';
    if (favText) favText.textContent = 'أضف للمفضلة';
  }
}

async function fxrLoadFavoriteState() {
  const role = window.FixoraAccess?.getRole?.();
  if (role !== 'client' || !fxrCurrentProviderId) return;
  try {
    const res = await api.getFavorites();
    const ids = (res.data || []).map((f) => String(f.provider_profile_id));
    fxrIsFavorite = ids.includes(String(fxrCurrentProviderId));
    fxrUpdateFavoriteButton();
  } catch (_) {
    /* guest or error */
  }
}

async function fxrToggleFavorite() {
  if (!api.requireAuth('client')) return;
  if (!fxrCurrentProviderId) return;

  try {
    const res = await api.toggleFavorite(fxrCurrentProviderId);
    if (typeof res.favorited === 'boolean') {
      fxrIsFavorite = res.favorited;
    } else {
      fxrIsFavorite = !fxrIsFavorite;
    }
    fxrUpdateFavoriteButton();
    fxrShowToast(res.message || (fxrIsFavorite ? 'تمت الإضافة للمفضلة' : 'تمت الإزالة من المفضلة'));
    if (typeof window.fxrRefreshClientFavorites === 'function') {
      window.fxrRefreshClientFavorites();
    }
  } catch (e) {
    fxrShowToast(e.message);
  }
}

function fxrCopyPhone() {
  if (fxrProviderData?.phone) {
    navigator.clipboard.writeText(fxrProviderData.phone);
    fxrShowToast('تم نسخ رقم الجوال');
  }
}

function fxrCopyEmail() {
  if (fxrProviderData?.email) {
    navigator.clipboard.writeText(fxrProviderData.email);
    fxrShowToast('تم نسخ البريد');
  }
}

async function fxrLoadProvider(providerId) {
  const main = document.querySelector('.fxr-provider-page, main, body');
  try {
    const json = await api.getProvider(providerId);
    fxrProviderData = json.data;
    fxrCurrentProviderId = fxrProviderData.id;
    fxrUpdateBookingLink();
    fxrRenderProviderInfo();
    fxrRenderServices();
    fxrRenderSchedule();
    fxrRenderReviews();
    fxrRenderGallery();
    fxrRenderAreas();
    await fxrLoadFavoriteState();
    await fxrLoadRateableBookings();
  } catch (e) {
    const msg = document.createElement('div');
    msg.className = 'alert alert-warning m-4';
    msg.textContent = e.message || 'تعذر تحميل بيانات الفني';
    document.body.prepend(msg);
  }
}

async function fxrInit() {
  const providerId = fxrGetProviderIdFromUrl();
  if (!providerId) {
    const empty = document.createElement('div');
    empty.className = 'alert alert-info m-4';
    empty.innerHTML = 'اختر فنياً من <a href="search.html">صفحة البحث</a>.';
    document.body.prepend(empty);
    return;
  }

  fxrInitStarPicker();
  document.getElementById('submitReviewBtn')?.addEventListener('click', fxrSubmitProviderReview);
  document.getElementById('submitReportBtn')?.addEventListener('click', fxrSubmitSecretReport);

  fxrUpdateBookingLink(providerId);
  await fxrLoadProvider(providerId);
  fxrApplyUrlTab();
  fxrStartReviewsPoll();

  const params = new URLSearchParams(window.location.search);
  if (params.get('booked') === '1') {
    fxrShowToast('تم إرسال طلب الحجز بنجاح');
  }
}

window.fxrSwitchTab = fxrSwitchTab;
window.fxrRefreshProviderReviews = fxrRefreshReviews;
window.fxrMessageProvider = fxrMessageProvider;
window.fxrToggleFavorite = fxrToggleFavorite;
window.fxrCopyPhone = fxrCopyPhone;
window.fxrCopyEmail = fxrCopyEmail;
window.fxrShowMoreReviews = fxrShowMoreReviews;

document.addEventListener('DOMContentLoaded', fxrInit);