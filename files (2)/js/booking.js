/**
 * FIXORA — booking.js
 * JavaScript الخاص بصفحة حجز الخدمة
 */
'use strict';

const api = window.FixoraAPI;
let fxrProvider = null;
let fxrProviderAvailability = [];
let fxrBookedSlotKeys = new Set();
let fxrHasActiveBookingWithProvider = false;
let fxrCachedSlotDays = [];

const FXR_DAY_AR = {
  sun: 'الأحد', mon: 'الإثنين', tue: 'الثلاثاء', wed: 'الأربعاء',
  thu: 'الخميس', fri: 'الجمعة', sat: 'السبت'
};

const FXR_AR_TO_ENUM = Object.fromEntries(
  Object.entries(FXR_DAY_AR).map(([k, v]) => [v, k])
);

const FXR_DAY_ORDER = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

// ========================================
// STATE
// ========================================
let fxrBookingState = {
  step: 1,
  categoryId: null,
  serviceLabel: '',
  problemDescription: '',
  urgency: 'normal',
  bookingMode: 'standard',
  selectedDate: null,
  selectedDay: null,
  selectedTime: null,
  selectedScheduledAt: null,
  selectedCalendarYmd: null,
  locationType: 'home',
  governorate: 'عمّان',
  area: '',
  addressDetail: '',
  landmark: '',
  additionalNotes: '',
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  paymentMethod: 'cash'
};

// ========================================
// UTILITY FUNCTIONS
// ========================================
function fxrFormatAvailableSlots(count) {
  if (!count || count < 1) return '';
  if (count === 1) return 'موعد واحد متاح';
  if (count === 2) return 'موعدين متاحين';
  return `${count} مواعيد متاحة`;
}

function fxrShowToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2600);
}

// ========================================
// STEP NAVIGATION
// ========================================
function fxrUpdateStepsUI() {
  for (let i = 1; i <= 3; i++) {
    const step = document.querySelector(`.fxr-step[data-step="${i}"]`);
    const content = document.getElementById(`step${i}`);
    if (step) {
      if (i < fxrBookingState.step) {
        step.classList.add('completed');
      } else {
        step.classList.remove('completed');
      }
      if (i === fxrBookingState.step) {
        step.classList.add('active');
      } else {
        step.classList.remove('active');
      }
    }
    if (content) {
      if (i === fxrBookingState.step) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    }
  }
}

function fxrNextStep(step) {
  // Validation for step 1
  if (step === 2) {
    if (!fxrBookingState.problemDescription) {
      fxrShowToast('❌ الرجاء كتابة وصف المشكلة');
      return;
    }
  }
  
  // Validation for step 2
  if (step === 3) {
    if (!fxrBookingState.selectedDate) {
      fxrShowToast('❌ الرجاء اختيار موعد الخدمة (اليوم)');
      return;
    }
    if (!fxrBookingState.selectedTime) {
      fxrShowToast('❌ الرجاء اختيار موعد الخدمة (الساعة)');
      return;
    }
    if (!fxrBookingState.area || !fxrBookingState.addressDetail) {
      fxrShowToast('❌ الرجاء إدخال العنوان بالكامل');
      return;
    }
    
    // Update order summary before showing step 3
    fxrUpdateOrderSummary();
  }
  
  fxrBookingState.step = step;
  fxrUpdateStepsUI();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function fxrPrevStep(step) {
  fxrBookingState.step = step;
  fxrUpdateStepsUI();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========================================
// STEP 1 FUNCTIONS
// ========================================
function fxrUpdateProblemDescription() {
  fxrBookingState.problemDescription = document.getElementById('problemDescription').value;
}

function fxrUpdateUrgency() {
  const radios = document.querySelectorAll('input[name="urgency"]');
  for (const radio of radios) {
    if (radio.checked) {
      fxrBookingState.urgency = radio.value;
      break;
    }
  }
}

// ========================================
// STEP 2 FUNCTIONS - DATE & TIME
// ========================================
function fxrParseDbTime(timeVal) {
  if (!timeVal) return null;
  if (timeVal instanceof Date && !Number.isNaN(timeVal.getTime())) {
    return { hour: timeVal.getHours(), minute: timeVal.getMinutes() };
  }
  const raw = String(timeVal).trim();
  const m = raw.match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return { hour: parseInt(m[1], 10), minute: parseInt(m[2], 10) };
}

function fxrNormalizeDayEnum(val) {
  const s = String(val || '').toLowerCase().trim();
  if (FXR_DAY_ORDER.includes(s)) return s;
  return FXR_AR_TO_ENUM[val] || FXR_AR_TO_ENUM[s] || null;
}

function fxrNormalizeAvailability(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map((a) => {
      const day = fxrNormalizeDayEnum(a.day_of_week);
      if (!day) return null;
      const available = a.is_available !== false
        && a.is_available !== 'f'
        && a.is_available !== 0
        && String(a.is_available).toLowerCase() !== 'false';
      return {
        day_of_week: day,
        start_time: a.start_time,
        end_time: a.end_time,
        is_available: available
      };
    })
    .filter(Boolean);
}

async function fxrFetchProviderSchedule(providerId) {
  const json = await api.getProvider(providerId);
  const provider = json.data || {};
  let availability = fxrNormalizeAvailability(provider.availability);

  if (!availability.length) {
    try {
      const avRes = await api.getProviderAvailability(providerId);
      availability = fxrNormalizeAvailability(avRes.data);
    } catch (_) { /* ignore */ }
  }

  const booked = Array.isArray(provider.booked_slots) ? provider.booked_slots : [];
  return { provider, availability, booked_slots: booked };
}

function fxrDdMmForDay(dayName, calendarYmd) {
  if (calendarYmd) {
    const p = String(calendarYmd).split('-');
    if (p.length === 3) return `${p[2]}/${p[1]}`;
  }
  if (window.FixoraDateTime?.ddMmForDayName) {
    return window.FixoraDateTime.ddMmForDayName(dayName);
  }
  const enumKey = FXR_AR_TO_ENUM[dayName];
  if (enumKey == null) return '';
  const target = FXR_DAY_ORDER.indexOf(enumKey);
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  let diff = target - now.getDay();
  if (diff <= 0) diff += 7;
  const d = new Date(now);
  d.setDate(d.getDate() + diff);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function fxrFormatTimeArabic(hour, minute) {
  if (window.FixoraDateTime) return window.FixoraDateTime.formatTimeArabic(hour, minute);
  const isPm = hour >= 12;
  let h = hour % 12;
  if (h === 0) h = 12;
  return `${h}:${String(minute).padStart(2, '0')} ${isPm ? 'م' : 'ص'}`;
}

function fxrGetAvailableDays() {
  return FXR_DAY_ORDER
    .map((enumKey) => {
      const row = fxrProviderAvailability.find(
        (a) => a.day_of_week === enumKey && a.is_available
      );
      if (!row || !row.start_time || !row.end_time) return null;
      if (!fxrParseDbTime(row.start_time) || !fxrParseDbTime(row.end_time)) return null;
      return { enumKey, dayName: FXR_DAY_AR[enumKey], row };
    })
    .filter(Boolean);
}

function fxrSlotLabelFromApi(slot) {
  if (slot.hour != null && slot.minute != null) {
    return fxrFormatTimeArabic(slot.hour, slot.minute);
  }
  const p = fxrParseDbTime(slot.start_time);
  return p ? fxrFormatTimeArabic(p.hour, p.minute) : '';
}

function fxrBuildSlotsClientSide(filter) {
  const mode = filter === 'emergency' ? 'emergency' : 'standard';
  const now = new Date();
  const days = [];

  if (mode === 'emergency') {
    for (let offset = 0; offset < 14; offset++) {
      const date = new Date(now);
      date.setDate(date.getDate() + offset);
      const enumKey = FXR_DAY_ORDER[date.getDay()];
      const row = fxrProviderAvailability.find((a) => a.day_of_week === enumKey && a.is_available);
      if (!row) continue;

      const ymd = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const slots = fxrBuildHourSlots(row.start_time, row.end_time)
        .map((timeLabel) => {
          const parsed = fxrParseArabicTime(timeLabel);
          const [h, m] = (parsed || '09:00:00').split(':');
          const slotDate = new Date(date);
          slotDate.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
          if (offset === 0 && slotDate.getTime() <= now.getTime()) return null;
          if (offset === 0 && slotDate.getTime() - now.getTime() < 30 * 60 * 1000) return null;
          const iso = slotDate.toISOString();
          if (fxrBookedSlotKeys.has(iso)) return null;
          for (const booked of fxrBookedSlotKeys) {
            const a = new Date(booked).getTime();
            const b = new Date(iso).getTime();
            if (!Number.isNaN(a) && !Number.isNaN(b) && Math.abs(a - b) < 60000) return null;
          }
          return {
            start_time: parsed,
            scheduled_at: iso,
            hour: parseInt(h, 10),
            minute: parseInt(m, 10),
            time_label: timeLabel
          };
        })
        .filter(Boolean);

      if (!slots.length) continue;
      days.push({
        day_of_week: enumKey,
        day_name_ar: FXR_DAY_AR[enumKey],
        calendar_date: ymd,
        date_ddmm: fxrDdMmForDay(FXR_DAY_AR[enumKey], ymd),
        slots
      });
      break;
    }
    return days;
  }

  return fxrGetAvailableDays().map(({ enumKey, dayName, row }) => {
    let diff = FXR_DAY_ORDER.indexOf(enumKey) - now.getDay();
    if (diff <= 0) diff += 7;
    const date = new Date(now);
    date.setDate(date.getDate() + diff);
    const ymd = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const slots = fxrBuildHourSlots(row.start_time, row.end_time)
      .map((timeLabel) => {
        const parsed = fxrParseArabicTime(timeLabel);
        const [h, m] = (parsed || '09:00:00').split(':');
        const slotDate = new Date(date);
        slotDate.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
        const iso = slotDate.toISOString();
        let booked = false;
        for (const b of fxrBookedSlotKeys) {
          const a = new Date(b).getTime();
          const bt = new Date(iso).getTime();
          if (!Number.isNaN(a) && !Number.isNaN(bt) && Math.abs(a - bt) < 60000) booked = true;
        }
        if (booked) return null;
        return {
          start_time: parsed,
          scheduled_at: iso,
          hour: parseInt(h, 10),
          minute: parseInt(m, 10),
          time_label: timeLabel
        };
      })
      .filter(Boolean);

    return {
      day_of_week: enumKey,
      day_name_ar: dayName,
      calendar_date: ymd,
      date_ddmm: fxrDdMmForDay(dayName, ymd),
      slots
    };
  }).filter((d) => d.slots.length);
}

async function fetchAvailableSlots() {
  const providerId = fxrGetProviderIdFromPage();
  if (!providerId || !fxrProviderAvailability.length) {
    fxrCachedSlotDays = [];
    fxrGenerateDates();
    return;
  }

  const filter = fxrBookingState.bookingMode === 'emergency' ? 'emergency' : 'standard';
  fxrBookingState.selectedDate = null;
  fxrBookingState.selectedDay = null;
  fxrBookingState.selectedTime = null;
  fxrBookingState.selectedScheduledAt = null;
  fxrBookingState.selectedCalendarYmd = null;

  const timeGroup = document.getElementById('timeGroup');
  if (timeGroup) timeGroup.style.display = 'none';

  try {
    const res = await api.getAvailableSlots(providerId, filter);
    fxrCachedSlotDays = res.days || [];
  } catch (_) {
    fxrCachedSlotDays = fxrBuildSlotsClientSide(filter);
  }

  fxrUpdateDateSelectLabel();
  fxrGenerateDates();
}

function fxrUpdateDateSelectLabel() {
  const label = document.getElementById('fxrDateSelectLabel');
  if (!label) return;
  if (fxrBookingState.bookingMode === 'emergency') {
    label.innerHTML = 'أسرع موعد متاح — اختر اليوم <span class="fxr-required">*</span>';
  } else {
    label.innerHTML = 'موعد الخدمة — اختر اليوم <span class="fxr-required">*</span>';
  }
}

function fxrUpdateBookingMode() {
  const radios = document.querySelectorAll('input[name="bookingMode"]');
  for (const radio of radios) {
    if (radio.checked) {
      fxrBookingState.bookingMode = radio.value === 'emergency' ? 'emergency' : 'standard';
      break;
    }
  }
  fetchAvailableSlots();
}

function fxrBuildHourSlots(startTime, endTime) {
  const start = fxrParseDbTime(startTime);
  const end = fxrParseDbTime(endTime);
  if (!start || !end) return [];

  const slots = [];
  let cursor = start.hour * 60 + start.minute;
  const endMinutes = end.hour * 60 + end.minute;

  while (cursor + 60 <= endMinutes) {
    const hour = Math.floor(cursor / 60);
    const minute = cursor % 60;
    slots.push(fxrFormatTimeArabic(hour, minute));
    cursor += 60;
  }

  return slots;
}

function fxrGenerateDates() {
  const dateGrid = document.getElementById('dateGrid');
  if (!dateGrid) return;

  const days = fxrCachedSlotDays.length
    ? fxrCachedSlotDays
    : fxrBuildSlotsClientSide(fxrBookingState.bookingMode);

  if (!days.length) {
    const hint = fxrBookingState.bookingMode === 'emergency'
      ? 'لا يوجد موعد مستعجل متاح حالياً مع هذا الحرفي. جرّب <strong>الحجز العادي</strong> أو اختر حرفياً آخر.'
      : `لم يُحدد هذا الحرفي جدول عمله بعد.<br>
        اطلب منه حفظ «جدول العمل» من <strong>لوحة تحكم الحرفي</strong>، أو اختر حرفياً آخر.`;
    dateGrid.innerHTML = `<p class="fxr-form-hint">${hint}</p>`;
    return;
  }

  dateGrid.innerHTML = days.map((day) => {
    const dayName = day.day_name_ar;
    const ddMm = day.date_ddmm || fxrDdMmForDay(dayName, day.calendar_date);
    const isSelected = fxrBookingState.selectedDay === dayName
      && fxrBookingState.selectedCalendarYmd === day.calendar_date;
    const slotCount = (day.slots || []).length;
    const hoursHint = slotCount ? fxrFormatAvailableSlots(slotCount) : '';
    return `
      <div class="fxr-date-card ${isSelected ? 'selected' : ''}"
           data-day="${dayName}"
           data-calendar="${day.calendar_date || ''}"
           role="button" tabindex="0">
        <div class="fxr-date-day">${dayName}</div>
        ${ddMm ? `<div class="fxr-date-dd">${ddMm}</div>` : ''}
        ${hoursHint ? `<div class="fxr-date-hours">${hoursHint}</div>` : ''}
      </div>
    `;
  }).join('');

  dateGrid.querySelectorAll('.fxr-date-card').forEach((card) => {
    card.addEventListener('click', () => {
      fxrSelectDate(card.getAttribute('data-day'), card.getAttribute('data-calendar'));
    });
  });

  if (fxrBookingState.bookingMode === 'emergency' && days.length === 1 && days[0].slots?.length === 1) {
    const only = days[0];
    fxrSelectDate(only.day_name_ar, only.calendar_date);
    const slot = only.slots[0];
    const label = slot.time_label || fxrSlotLabelFromApi(slot);
    if (label) fxrSelectTime(label, slot.scheduled_at);
  }
}

function fxrGetSelectedDaySlots() {
  return fxrCachedSlotDays.find(
    (d) => d.day_name_ar === fxrBookingState.selectedDay
      && (!fxrBookingState.selectedCalendarYmd || d.calendar_date === fxrBookingState.selectedCalendarYmd)
  ) || fxrCachedSlotDays.find((d) => d.day_name_ar === fxrBookingState.selectedDay);
}

function fxrSelectDate(dayName, calendarYmd) {
  fxrBookingState.selectedDay = dayName;
  fxrBookingState.selectedDate = dayName;
  fxrBookingState.selectedCalendarYmd = calendarYmd || null;
  fxrBookingState.selectedTime = null;
  fxrBookingState.selectedScheduledAt = null;

  document.querySelectorAll('.fxr-date-card').forEach((card) => {
    const matchDay = card.getAttribute('data-day') === dayName;
    const cal = card.getAttribute('data-calendar');
    const matchCal = !calendarYmd || !cal || cal === calendarYmd;
    card.classList.toggle('selected', matchDay && matchCal);
  });

  const timeGroup = document.getElementById('timeGroup');
  if (timeGroup) timeGroup.style.display = 'block';

  fxrGenerateTimes();
}

function fxrGenerateTimes() {
  const timeGrid = document.getElementById('timeGrid');
  if (!timeGrid) return;

  const dayData = fxrGetSelectedDaySlots();
  let slots = dayData?.slots || [];

  if (!slots.length) {
    const dayEnum = FXR_AR_TO_ENUM[fxrBookingState.selectedDay];
    const row = fxrProviderAvailability.find((a) => a.day_of_week === dayEnum && a.is_available);
    const times = row ? fxrBuildHourSlots(row.start_time, row.end_time) : [];
    slots = times.map((timeLabel) => ({
      time_label: timeLabel,
      scheduled_at: null
    }));
  }

  if (!slots.length) {
    timeGrid.innerHTML = '<p class="fxr-form-hint">لا توجد ساعات عمل متاحة في هذا اليوم.</p>';
    return;
  }

  timeGrid.innerHTML = slots.map((slot) => {
    const time = slot.time_label || fxrSlotLabelFromApi(slot);
    const isSelected = fxrBookingState.selectedTime === time;
    const isBooked = fxrIsSlotBooked(
      fxrBookingState.selectedDay,
      time,
      slot.scheduled_at
    );
    const cls = [isSelected ? 'selected' : '', isBooked ? 'disabled' : ''].filter(Boolean).join(' ');
    return `
      <div class="fxr-time-card ${cls}" data-time="${time}" data-scheduled="${slot.scheduled_at || ''}" data-booked="${isBooked ? '1' : '0'}" role="button" tabindex="0" ${isBooked ? 'aria-disabled="true"' : ''}>
        ${time}${isBooked ? ' <span style="font-size:10px;display:block;color:#999">محجوز</span>' : ''}
      </div>
    `;
  }).join('');

  timeGrid.querySelectorAll('.fxr-time-card').forEach((card) => {
    if (card.getAttribute('data-booked') === '1') return;
    card.addEventListener('click', () => {
      fxrSelectTime(
        card.getAttribute('data-time'),
        card.getAttribute('data-scheduled') || null
      );
    });
  });
}

function fxrSelectTime(time, scheduledAtIso) {
  if (fxrIsSlotBooked(fxrBookingState.selectedDay, time, scheduledAtIso)) {
    fxrShowToast('هذا الموعد محجوز — اختر وقتاً آخر');
    return;
  }
  fxrBookingState.selectedTime = time;
  fxrBookingState.selectedScheduledAt = scheduledAtIso || null;

  document.querySelectorAll('.fxr-time-card').forEach((card) => {
    card.classList.toggle('selected', card.getAttribute('data-time') === time);
  });
}

// ========================================
// STEP 2 FUNCTIONS - LOCATION
// ========================================
function fxrToggleLocationForm() {
  const radios = document.querySelectorAll('input[name="locationType"]');
  for (const radio of radios) {
    if (radio.checked) {
      fxrBookingState.locationType = radio.value;
      break;
    }
  }
  
  const addressForm = document.getElementById('addressForm');
  if (addressForm) addressForm.style.display = 'block';
}

function fxrUpdateAddress() {
  fxrBookingState.governorate = document.getElementById('governorate').value;
  fxrBookingState.area = document.getElementById('area').value;
  fxrBookingState.addressDetail = document.getElementById('addressDetail').value;
  fxrBookingState.landmark = document.getElementById('landmark').value;
  fxrBookingState.additionalNotes = document.getElementById('additionalNotes').value;
}

// ========================================
// STEP 3 FUNCTIONS
// ========================================
async function fxrResolveCategoryId(provider) {
  const services = provider?.services || [];
  if (services.length && services[0].id != null) {
    const id = parseInt(services[0].id, 10);
    if (!Number.isNaN(id)) {
      return { id, label: services[0].name_ar || provider?.specialty || 'خدمة' };
    }
  }
  try {
    const data = await api.getCategories();
    const list = data.categories || [];
    const spec = (provider?.specialty || '').trim();
    if (spec && list.length) {
      const match = list.find(
        (c) => c.name_ar === spec || spec.includes(c.name_ar) || c.name_ar.includes(spec)
      );
      if (match) return { id: match.id, label: match.name_ar };
    }
    if (list.length) return { id: list[0].id, label: list[0].name_ar };
  } catch (_) { /* ignore */ }
  return { id: null, label: provider?.specialty || 'خدمة' };
}

function fxrUpdateOrderSummary() {
  const summaryEl = document.getElementById('orderSummary');
  if (!summaryEl) return;
  
  const fullAddress = `${fxrBookingState.governorate}، ${fxrBookingState.area}، ${fxrBookingState.addressDetail}`;
  const urgencyText = {
    'normal': 'عادي',
    'urgent': 'مستعجل',
    'emergency': 'طوارئ'
  };
  
  const serviceLine = fxrBookingState.serviceLabel || fxrProvider?.specialty || '—';
  summaryEl.innerHTML = `
    <div class="fxr-summary-item">
      <span class="fxr-summary-label">الحرفي / التخصص</span>
      <span class="fxr-summary-value">${serviceLine}</span>
    </div>
    <div class="fxr-summary-item">
      <span class="fxr-summary-label">وصف المشكلة</span>
      <span class="fxr-summary-value">${fxrBookingState.problemDescription.substring(0, 60)}${fxrBookingState.problemDescription.length > 60 ? '...' : ''}</span>
    </div>
    <div class="fxr-summary-item">
      <span class="fxr-summary-label">درجة الإلحاح</span>
      <span class="fxr-summary-value">${urgencyText[fxrBookingState.urgency]}</span>
    </div>
    <div class="fxr-summary-item">
      <span class="fxr-summary-label">يوم الخدمة والوقت</span>
      <span class="fxr-summary-value">${fxrFormatSummarySlot()}</span>
    </div>
    <div class="fxr-summary-item">
      <span class="fxr-summary-label">موقع الخدمة</span>
      <span class="fxr-summary-value">${fullAddress}</span>
    </div>
  `;
}

function fxrUpdateCustomerInfo() {
  fxrBookingState.customerName = document.getElementById('customerName').value;
  fxrBookingState.customerPhone = document.getElementById('customerPhone').value;
  fxrBookingState.customerEmail = document.getElementById('customerEmail').value;
}

function fxrUpdatePaymentMethod() {
  const radios = document.querySelectorAll('input[name="payment"]');
  for (const radio of radios) {
    if (radio.checked) {
      fxrBookingState.paymentMethod = radio.value;
      break;
    }
  }
}

function fxrToggleConfirmBtn() {
  const agreeCheckbox = document.getElementById('agreeTerms');
  const confirmBtn = document.getElementById('confirmBtn');
  if (confirmBtn) {
    confirmBtn.disabled = fxrHasActiveBookingWithProvider || !agreeCheckbox?.checked;
  }
}
const FXR_DAY_TO_JS = {
  'الأحد': 0, 'الإثنين': 1, 'الثلاثاء': 2, 'الأربعاء': 3,
  'الخميس': 4, 'الجمعة': 5, 'السبت': 6
};

function fxrFormatSummarySlot() {
  const day = fxrBookingState.selectedDay || '';
  const time = fxrBookingState.selectedTime || '';
  if (!day) return '—';
  const ddMm = fxrDdMmForDay(day, fxrBookingState.selectedCalendarYmd);
  if (window.FixoraDateTime?.formatSlotDisplay) {
    return window.FixoraDateTime.formatSlotDisplay(day, ddMm, time);
  }
  if (day && time && ddMm) return `${day} - ${ddMm} - الساعة ${time}`;
  if (day && time) return `${day} - ${time}`;
  if (ddMm) return `${day} - ${ddMm}`;
  return day;
}

function fxrParseArabicTime(timeLabel) {
  if (window.FixoraDateTime) return window.FixoraDateTime.parseArabicTime(timeLabel);
  if (!timeLabel) return null;
  const m = timeLabel.match(/(\d+):(\d+)\s*(ص|م)/);
  if (!m) return null;
  let hour = parseInt(m[1], 10);
  const minute = parseInt(m[2], 10);
  if (m[3] === 'م' && hour !== 12) hour += 12;
  if (m[3] === 'ص' && hour === 12) hour = 0;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
}

function fxrSlotKey(dayName, timeLabel, scheduledAtIso) {
  if (scheduledAtIso) return String(scheduledAtIso);
  if (!dayName || !timeLabel) return '';
  return `${fxrBuildScheduledAt(dayName, timeLabel)}`;
}

function fxrIsSlotBooked(dayName, timeLabel, scheduledAtIso) {
  const key = fxrSlotKey(dayName, timeLabel, scheduledAtIso);
  if (!key) return false;
  for (const booked of fxrBookedSlotKeys) {
    if (booked === key) return true;
    const a = new Date(booked).getTime();
    const b = new Date(key).getTime();
    if (!Number.isNaN(a) && !Number.isNaN(b) && Math.abs(a - b) < 60000) return true;
  }
  return false;
}

function fxrBuildScheduledAt(dayName, timeLabel) {
  if (fxrBookingState.selectedScheduledAt) {
    return fxrBookingState.selectedScheduledAt;
  }

  if (fxrBookingState.selectedCalendarYmd) {
    const parts = fxrBookingState.selectedCalendarYmd.split('-').map(Number);
    if (parts.length === 3) {
      const date = new Date(parts[0], parts[1] - 1, parts[2]);
      const time24 = fxrParseArabicTime(timeLabel);
      if (time24) {
        const [h, m] = time24.split(':');
        date.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
      } else {
        date.setHours(9, 0, 0, 0);
      }
      return date.toISOString();
    }
  }

  const targetDay = FXR_DAY_TO_JS[dayName];
  const now = new Date();
  if (targetDay === undefined) return now.toISOString();

  let diff = targetDay - now.getDay();
  if (fxrBookingState.bookingMode === 'emergency') {
    if (diff < 0) diff += 7;
    if (diff === 0) { /* اليوم */ }
  } else if (diff <= 0) {
    diff += 7;
  }

  const date = new Date(now);
  date.setDate(date.getDate() + diff);

  const time24 = fxrParseArabicTime(timeLabel);
  if (time24) {
    const [h, m] = time24.split(':');
    date.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
  } else {
    date.setHours(9, 0, 0, 0);
  }
  return date.toISOString();
}

function fxrGetProviderIdFromPage() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get('id') || params.get('provider_id');
  if (fromQuery) return String(fromQuery).trim();

  const pathMatch = window.location.pathname.match(/\/booking\/([^/]+)\/?$/i);
  if (pathMatch) return decodeURIComponent(pathMatch[1]);

  if (fxrBookingState.providerId) return fxrBookingState.providerId;

  const stored = sessionStorage.getItem('fixora_booking_provider_id');
  return stored ? String(stored).trim() : null;
}

function fxrPersistProviderIdFromUrl() {
  const providerId = fxrGetProviderIdFromPage();
  if (!providerId) return null;
  fxrBookingState.providerId = providerId;
  sessionStorage.setItem('fixora_booking_provider_id', providerId);
  return providerId;
}

function fxrShowProviderNotice(html, variant = 'warning') {
  const el = document.getElementById('fxrProviderNotice');
  if (!el) return;
  el.className = `fxr-provider-notice fxr-provider-notice--${variant}`;
  el.innerHTML = html;
  el.hidden = false;
}

function fxrHideProviderNotice() {
  const el = document.getElementById('fxrProviderNotice');
  if (el) el.hidden = true;
}

function fxrSetConfirmEnabled(enabled) {
  const confirmBtn = document.getElementById('confirmBtn');
  if (confirmBtn) confirmBtn.disabled = !enabled;
}

// 4. إرسال البيانات (Confirm)
// =========================================================================
async function fxrCheckActiveBookingWithProvider(providerId) {
  try {
    const res = await api.getMyBookings();
    const bookings = res.data || [];
    const active = ['pending', 'confirmed', 'in_progress'];
    fxrHasActiveBookingWithProvider = bookings.some((b) => {
      const pid = String(b.provider_id || '');
      const st = String(b.status || '').toLowerCase();
      return pid === String(providerId) && active.includes(st);
    });
    if (fxrHasActiveBookingWithProvider) {
      fxrShowProviderNotice(
        'لديك طلباً قيد التنفيذ مع هذا الحرفي. أكمله أو ألغِه من <a href="user-dashboard.html?tab=tab-orders">طلباتي</a> قبل حجز موعد جديد.',
        'warning'
      );
      fxrSetConfirmEnabled(false);
    }
  } catch (_) {
    fxrHasActiveBookingWithProvider = false;
  }
}

async function fxrConfirmBooking() {
    if (fxrProvider?.is_banned) {
      fxrShowToast('هذا الحرفي غير متاح للحجز');
      return;
    }

    if (fxrHasActiveBookingWithProvider) {
      fxrShowToast('لديك طلب قيد التنفيذ مع هذا الحرفي');
      return;
    }

    const token = localStorage.getItem('token');
    const categoryId = fxrBookingState.categoryId;

    if (!token) { 
        alert("يرجى تسجيل الدخول أولاً."); 
        window.location.href = 'login.html';
        return; 
    }

    const providerId = fxrGetProviderIdFromPage();
    if (!providerId) {
        fxrShowProviderNotice(
          'لم يُحدَّد الفني بعد. <a href="search.html">ابحث عن فني</a> ثم اضغط «احجز الآن» من حسابه.',
          'warning'
        );
        fxrShowToast('يرجى اختيار فني قبل تأكيد الحجز');
        return;
    }

    if (!fxrBookingState.selectedDate || !fxrBookingState.selectedTime) {
        alert("❌ الرجاء اختيار موعد الخدمة (اليوم والساعة) في الخطوة 2.");
        return;
    }

    if (fxrIsSlotBooked(
      fxrBookingState.selectedDay,
      fxrBookingState.selectedTime,
      fxrBookingState.selectedScheduledAt
    )) {
        fxrShowToast('هذا الموعد محجوز — اختر وقتاً آخر');
        return;
    }

    let resolvedCategoryId = categoryId;
    if (!resolvedCategoryId && fxrProvider) {
      const resolved = await fxrResolveCategoryId(fxrProvider);
      resolvedCategoryId = resolved.id;
      fxrBookingState.categoryId = resolvedCategoryId;
    }
    if (!resolvedCategoryId) {
      fxrShowToast('تعذر تحديد نوع الخدمة — أعد تحميل الصفحة أو اختر حرفياً آخر');
      return;
    }

    const payload = {
        provider_id: providerId,
        category_id: resolvedCategoryId,
        scheduled_at: fxrBuildScheduledAt(fxrBookingState.selectedDate, fxrBookingState.selectedTime),
        start_time: fxrParseArabicTime(fxrBookingState.selectedTime),
        notes: [
          fxrBookingState.problemDescription,
          fxrBookingState.area ? `المنطقة: ${fxrBookingState.area}` : '',
          fxrBookingState.addressDetail ? `العنوان: ${fxrBookingState.addressDetail}` : ''
        ].filter(Boolean).join(' | ') || 'طلب صيانة'
    };

    try {
        const result = await api.createBooking(payload);

        if (result.success) {
            window.location.href =
              `privider.html?id=${encodeURIComponent(providerId)}&booked=1&tab=reviews`;
        }
    } catch (error) {
        alert(error.message === 'Failed to fetch' ? api.networkHint : error.message);
        console.error('خطأ في الاتصال:', error);
    }
}
// async function fxrConfirmBooking() {
//     const token = localStorage.getItem('token');
//     const userId = localStorage.getItem('userId');

//     // 1. تنظيف التوكن (إزالة أي مسافات زائدة قد تسبب خطأ Bearer)
//     const cleanToken = token ? token.trim() : null;

//     if (!cleanToken || !userId) {
//         alert("يرجى تسجيل الدخول أولاً.");
//         // window.location.href = 'login.html';
//         return;
//     }

//     // 2. تحويل التاريخ (كما هو بدون تغيير)
//     const getFormattedDate = (dayName) => {
//         const today = new Date();
//         const dayMap = { 'الأحد': 0, 'الإثنين': 1, 'الثلاثاء': 2, 'الأربعاء': 3, 'الخميس': 4, 'الجمعة': 5, 'السبت': 6 };
//         const targetDay = dayMap[dayName];
//         if (targetDay === undefined) return today.toISOString().split('T')[0];
//         const currentDay = today.getDay();
//         const distance = (targetDay - currentDay + 7) % 7;
//         const targetDate = new Date(today);
//         targetDate.setDate(today.getDate() + distance);
//         return targetDate.toISOString().split('T')[0];
//     };

//     const dateToUse = fxrBookingState.selectedDate || 'الأحد'; 
//     const formattedDate = getFormattedDate(dateToUse);
// const payload = {
//     // احذفي client_id من هنا لأن السيرفر (الذي عدلناه قبل قليل) 
//     // سيستخرجه من التوكن (req.user.userId) تلقائياً، 
//     // وهذا يمنع حدوث تضارب.
//     provider_id: "c0a8011c-992a-4f5b-802c-56905589985c", 
//     category_id: 1, 
//     scheduled_at: formattedDate,
//     start_time: "09:00:00",
//     end_time: "10:00:00",
//     notes: fxrBookingState.problemDescription || "طلب صيانة"
// };

//     try {
//         // خطوة حاسمة: التأكد أن التوكن يرسل بصيغة صحيحة تماماً                    
//         const res = await fetch('http://localhost:3000/api/bookings/create-booking', {
//             method: 'POST',
//             headers: { 
//                 'Content-Type': 'application/json', 
//                 'Authorization': `Bearer ${cleanToken}` // استخدام التوكن المنظف
//             },
//             body: JSON.stringify(payload)
//         });

//         // إذا كان هناك خطأ في الاتصال (401 أو 403) سنعرفه هنا
//         if (res.status === 401) {
//             console.error("❌ السيرفر رفض التوكن (401 Unauthorized)");
//             alert("جلسة العمل انتهت، يرجى تسجيل الدخول مجدداً.");
//             window.location.href = 'login.html';
//             return;
//         }

//         const result = await res.json();

//         if (res.ok && result.success) {
//             alert("تم إرسال طلب الحجز بنجاح. ✅");
//             window.location.href = 'user-dashboard.html';
//         } else {
//             alert("عذراً: " + (result.message || "فشل تأكيد الحجز."));
//         }
//     } catch (error) {
//         console.error("🚨 خطأ اتصال:", error);
//         alert("حدث خطأ في الاتصال بالسيرفر.");
//     }
// }
// تعديل جمالات ليكون ديناميك
 


async function fxrInitProviderInfo() {
  const providerId = fxrPersistProviderIdFromUrl();
  if (!providerId) {
    fxrShowProviderNotice(
      'لم يُحدَّد الفني. <a href="search.html">ابحث عن فني</a> أو افتح <a href="privider.html">حساب الفني</a> واضغط «احجز الآن».',
      'warning'
    );
    fxrSetConfirmEnabled(false);
    return;
  }

  fxrHideProviderNotice();
  fxrSetConfirmEnabled(true);

  try {
    const loaded = await fxrFetchProviderSchedule(providerId);
    fxrProvider = loaded.provider;
    fxrProviderAvailability = loaded.availability;
    fxrBookedSlotKeys = new Set(loaded.booked_slots.map((s) => String(s)));

    if (!fxrProviderAvailability.length) {
      fxrShowProviderNotice(
        'هذا الحرفي لم يحفظ جدول عمله بعد. اطلب منه فتح <strong>لوحة تحكم الحرفي</strong> → جدول العمل → حفظ، ثم أعد محاولة الحجز.',
        'warning'
      );
    }

    await fxrCheckActiveBookingWithProvider(providerId);

    if (fxrProvider.is_banned) {
      fxrShowProviderNotice(
        '🚫 <strong>هذا الحرفي غير متاح للحجز حالياً</strong> — تم تعليق حسابه من الإدارة. يمكنك <a href="search.html">البحث عن حرفي آخر</a>.',
        'error'
      );
      fxrSetConfirmEnabled(false);
    }

    const catResolved = await fxrResolveCategoryId(fxrProvider);
    fxrBookingState.categoryId = catResolved.id;
    fxrBookingState.serviceLabel = catResolved.label;

    const name = `${fxrProvider.first_name || ''} ${fxrProvider.last_name || ''}`.trim();
    const avatarEl = document.getElementById('providerAvatar');
    const nameEl = document.getElementById('providerName');
    const specialtyEl = document.getElementById('providerSpecialty');
    const ratingEl = document.getElementById('providerRating');
    if (avatarEl) {
      avatarEl.textContent = fxrProvider.profile_pic_url ? '' : '🧑‍🔧';
      if (fxrProvider.profile_pic_url) {
        avatarEl.innerHTML = `<img src="${fxrProvider.profile_pic_url}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
      }
    }
    if (nameEl) nameEl.textContent = name || '—';
    if (specialtyEl) {
      specialtyEl.textContent = fxrProvider.specialty
        ? `🔧 ${fxrProvider.specialty}`
        : '🔧 —';
    }
    if (ratingEl) {
      const avg = parseFloat(fxrProvider.avg_rating);
      ratingEl.textContent = avg > 0 ? `⭐ ${avg}` : '⭐ جديد';
    }

    try {
      await fetchAvailableSlots();
    } catch (genErr) {
      console.warn('fetchAvailableSlots:', genErr);
      const dateGrid = document.getElementById('dateGrid');
      if (dateGrid) {
        dateGrid.innerHTML = '<p class="fxr-form-hint">تعذر عرض الأيام — أعد تحميل الصفحة.</p>';
      }
    }
  } catch (e) {
    fxrProvider = null;
    fxrShowProviderNotice(
      'تعذر تحميل بيانات الفني. <a href="search.html">اختر فنياً آخر</a>.',
      'error'
    );
    fxrSetConfirmEnabled(false);
    console.warn('تعذر تحميل بيانات الفني', e);
  }
}

// ========================================
// EVENT LISTENERS
// ========================================
function fxrSetupEventListeners() {
  const problemDesc = document.getElementById('problemDescription');
  if (problemDesc) problemDesc.addEventListener('input', fxrUpdateProblemDescription);
  
  const urgencyRadios = document.querySelectorAll('input[name="urgency"]');
  urgencyRadios.forEach(radio => radio.addEventListener('change', fxrUpdateUrgency));

  document.querySelectorAll('input[name="bookingMode"]').forEach((radio) => {
    radio.addEventListener('change', fxrUpdateBookingMode);
  });
  
  // Step 2
  const governorateSelect = document.getElementById('governorate');
  if (governorateSelect) governorateSelect.addEventListener('change', fxrUpdateAddress);
  
  const areaInput = document.getElementById('area');
  if (areaInput) areaInput.addEventListener('input', fxrUpdateAddress);
  
  const addressDetailInput = document.getElementById('addressDetail');
  if (addressDetailInput) addressDetailInput.addEventListener('input', fxrUpdateAddress);
  
  const landmarkInput = document.getElementById('landmark');
  if (landmarkInput) landmarkInput.addEventListener('input', fxrUpdateAddress);
  
  const notesInput = document.getElementById('additionalNotes');
  if (notesInput) notesInput.addEventListener('input', fxrUpdateAddress);
  
  const locationRadios = document.querySelectorAll('input[name="locationType"]');
  locationRadios.forEach(radio => radio.addEventListener('change', fxrToggleLocationForm));
  
  // Step 3
  const customerNameInput = document.getElementById('customerName');
  if (customerNameInput) customerNameInput.addEventListener('input', fxrUpdateCustomerInfo);
  
  const customerPhoneInput = document.getElementById('customerPhone');
  if (customerPhoneInput) customerPhoneInput.addEventListener('input', fxrUpdateCustomerInfo);
  
  const customerEmailInput = document.getElementById('customerEmail');
  if (customerEmailInput) customerEmailInput.addEventListener('input', fxrUpdateCustomerInfo);
  
  const paymentRadios = document.querySelectorAll('input[name="payment"]');
  paymentRadios.forEach(radio => radio.addEventListener('change', fxrUpdatePaymentMethod));
}

// ========================================
// INITIALIZE
// ========================================


async function fxrInit() {
  fxrPersistProviderIdFromUrl();

  if (!api.requireAuth('client')) return;
  await fxrInitProviderInfo();
  if (!fxrProvider) {
    const dateGrid = document.getElementById('dateGrid');
    if (dateGrid) {
      dateGrid.innerHTML = '<p class="fxr-form-hint">اختر فنياً من <a href="search.html">صفحة البحث</a> لعرض أيام عمله.</p>';
    }
  }
  fxrSetupEventListeners();
  fxrBookingState.urgency = 'normal';
}

window.fxrNextStep = fxrNextStep;
window.fxrPrevStep = fxrPrevStep;
window.fxrConfirmBooking = fxrConfirmBooking;
window.fxrToggleLocationForm = fxrToggleLocationForm;
window.fxrToggleConfirmBtn = fxrToggleConfirmBtn;

document.addEventListener('DOMContentLoaded', fxrInit);