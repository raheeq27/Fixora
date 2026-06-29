/**
 * FIXORA — تنسيق مواعيد الحجز للعرض في الواجهة فقط (لا يغيّر التخزين في قاعدة البيانات)
 */
(function (global) {
  'use strict';

  const FXR_DAY_AR = {
    sun: 'الأحد', mon: 'الإثنين', tue: 'الثلاثاء', wed: 'الأربعاء',
    thu: 'الخميس', fri: 'الجمعة', sat: 'السبت'
  };

  const FXR_DAY_ORDER = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

  const FXR_AR_TO_ENUM = Object.fromEntries(
    Object.entries(FXR_DAY_AR).map(([k, v]) => [v, k])
  );

  const FXR_DAY_TO_JS = {
    'الأحد': 0, 'الإثنين': 1, 'الثلاثاء': 2, 'الأربعاء': 3,
    'الخميس': 4, 'الجمعة': 5, 'السبت': 6
  };

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function formatDdMm(date) {
    return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}`;
  }

  function getNextDateForWeekday(enumKey) {
    const target = FXR_DAY_ORDER.indexOf(enumKey);
    if (target < 0) return new Date();
    const now = new Date();
    now.setHours(12, 0, 0, 0);
    let diff = target - now.getDay();
    if (diff <= 0) diff += 7;
    const d = new Date(now);
    d.setDate(d.getDate() + diff);
    return d;
  }

  function formatDateCardLabel(enumKey) {
    const dayName = FXR_DAY_AR[enumKey] || enumKey;
    const d = getNextDateForWeekday(enumKey);
    return { dayName, ddMm: formatDdMm(d), calendarDate: toYmd(d), display: `${dayName} — ${formatDdMm(d)}` };
  }

  function toYmd(date) {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  }

  function parseYmd(ymd) {
    if (!ymd) return null;
    const [y, m, d] = String(ymd).split('-').map(Number);
    if (!y || !m || !d) return null;
    const dt = new Date(y, m - 1, d, 12, 0, 0, 0);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  function formatTimeArabic(hour, minute) {
    const isPm = hour >= 12;
    let h = hour % 12;
    if (h === 0) h = 12;
    return `${h}:${pad2(minute)} ${isPm ? 'م' : 'ص'}`;
  }

  function formatTimeArabicFrom24(timeVal) {
    if (!timeVal) return '';
    const raw = String(timeVal).trim();
    const m = raw.match(/(\d{1,2}):(\d{2})/);
    if (!m) return raw;
    return formatTimeArabic(parseInt(m[1], 10), parseInt(m[2], 10));
  }

  function parseArabicTime(timeLabel) {
    if (!timeLabel) return null;
    const m = String(timeLabel).match(/(\d+):(\d+)\s*(ص|م)/);
    if (!m) return null;
    let hour = parseInt(m[1], 10);
    const minute = parseInt(m[2], 10);
    if (m[3] === 'م' && hour !== 12) hour += 12;
    if (m[3] === 'ص' && hour === 12) hour = 0;
    return `${pad2(hour)}:${pad2(minute)}:00`;
  }

  function buildScheduledAt(calendarDateYmd, dayNameAr, timeLabel) {
    let date = parseYmd(calendarDateYmd);
    if (!date && dayNameAr) {
      const enumKey = FXR_AR_TO_ENUM[dayNameAr];
      if (enumKey) date = getNextDateForWeekday(enumKey);
    }
    if (!date) date = new Date();

    const time24 = parseArabicTime(timeLabel);
    if (time24) {
      const [h, mi] = time24.split(':');
      date.setHours(parseInt(h, 10), parseInt(mi, 10), 0, 0);
    } else {
      date.setHours(9, 0, 0, 0);
    }
    return date.toISOString();
  }

  function formatTimeLine(scheduledAt, startTime) {
    if (startTime) return formatTimeArabicFrom24(startTime);
    if (!scheduledAt) return '';
    const dt = new Date(scheduledAt);
    if (Number.isNaN(dt.getTime())) return '';
    return formatTimeArabic(dt.getHours(), dt.getMinutes());
  }

  /** عرض: السبت - 06/06 - الساعة 2:00 م */
  function formatSlotDisplay(dayName, ddMm, timeLabel) {
    const parts = [];
    if (dayName) parts.push(dayName);
    if (ddMm) parts.push(ddMm);
    if (timeLabel) parts.push(`الساعة ${timeLabel}`);
    return parts.join(' - ') || '—';
  }

  function formatBookingAppointment(scheduledAt, startTime) {
    if (!scheduledAt) return { dateLine: '—', timeLine: '', full: '—' };
    const dt = new Date(scheduledAt);
    if (Number.isNaN(dt.getTime())) return { dateLine: '—', timeLine: '', full: '—' };

    const dayNames = Object.values(FXR_DAY_AR);
    const dayName = dayNames[dt.getDay()] || '';
    const ddMm = formatDdMm(dt);
    const timeLine = formatTimeLine(scheduledAt, startTime);
    const full = formatSlotDisplay(dayName, ddMm, timeLine);
    return { dateLine: dayName, ddMm, timeLine, full };
  }

  function formatSelectionSlot(dayNameAr, timeLabelAr) {
    if (!dayNameAr) return '—';
    const enumKey = FXR_AR_TO_ENUM[dayNameAr];
    const ddMm = enumKey ? formatDdMm(getNextDateForWeekday(enumKey)) : '';
    return formatSlotDisplay(dayNameAr, ddMm, timeLabelAr || '');
  }

  function ddMmForDayName(dayNameAr) {
    const enumKey = FXR_AR_TO_ENUM[dayNameAr];
    if (!enumKey) return '';
    return formatDdMm(getNextDateForWeekday(enumKey));
  }

  global.FixoraDateTime = {
    FXR_DAY_AR,
    FXR_DAY_ORDER,
    FXR_AR_TO_ENUM,
    FXR_DAY_TO_JS,
    formatDdMm,
    formatDateCardLabel,
    formatTimeArabic,
    formatTimeArabicFrom24,
    parseArabicTime,
    buildScheduledAt,
    formatBookingAppointment,
    formatSelectionSlot,
    formatSlotDisplay,
    ddMmForDayName,
    getNextDateForWeekday,
    toYmd
  };
})(window);
