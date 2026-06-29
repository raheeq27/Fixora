import pool from '../config/db.js';
import { dateToDayEnum, parseTimeToPg } from './availability.js';

const DAY_AR = {
  sun: 'الأحد', mon: 'الإثنين', tue: 'الثلاثاء', wed: 'الأربعاء',
  thu: 'الخميس', fri: 'الجمعة', sat: 'السبت'
};

const DAY_ORDER = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function pad2(n) {
  return String(n).padStart(2, '0');
}

function formatDdMm(date) {
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}`;
}

function toYmd(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function parseDbTime(timeVal) {
  if (!timeVal) return null;
  const raw = String(timeVal).trim();
  const m = raw.match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return { hour: parseInt(m[1], 10), minute: parseInt(m[2], 10) };
}

function buildHourStarts(startTime, endTime) {
  const start = parseDbTime(startTime);
  const end = parseDbTime(endTime);
  if (!start || !end) return [];

  const slots = [];
  let cursor = start.hour * 60 + start.minute;
  const endMinutes = end.hour * 60 + end.minute;

  while (cursor + 60 <= endMinutes) {
    slots.push({ hour: Math.floor(cursor / 60), minute: cursor % 60 });
    cursor += 60;
  }
  return slots;
}

function nextOccurrenceOnOrAfter(enumKey, fromDate) {
  const target = DAY_ORDER.indexOf(enumKey);
  if (target < 0) return null;
  const base = new Date(fromDate);
  base.setHours(12, 0, 0, 0);
  let diff = target - base.getDay();
  if (diff < 0) diff += 7;
  const d = new Date(base);
  d.setDate(d.getDate() + diff);
  return d;
}

/** نفس استعلام hasBookingConflict — استدعاء فقط دون تعديل الدالة الأصلية */
async function slotHasConflict(providerId, scheduledAtIso) {
  const conflict = await pool.query(
    `SELECT id FROM bookings
     WHERE provider_id = $1
       AND status IN ('pending', 'confirmed', 'in_progress')
       AND scheduled_at = $2::timestamptz`,
    [providerId, scheduledAtIso]
  );
  return conflict.rows.length > 0;
}

async function loadAvailability(providerId) {
  const res = await pool.query(
    `SELECT day_of_week, start_time, end_time, is_available
     FROM provider_availability
     WHERE provider_id = $1 AND is_available = TRUE
     ORDER BY day_of_week`,
    [providerId]
  );
  return res.rows;
}

async function buildSlotsForDate(providerId, row, date, now, emergencyTodayOnly) {
  const hours = buildHourStarts(row.start_time, row.end_time);
  const slots = [];
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const isToday = dayStart.toDateString() === now.toDateString();

  for (const { hour, minute } of hours) {
    const slotDate = new Date(dayStart);
    slotDate.setHours(hour, minute, 0, 0);
    if (isToday && slotDate.getTime() <= now.getTime()) continue;
    if (isToday && slotDate.getTime() - now.getTime() < 30 * 60 * 1000) continue;

    const iso = slotDate.toISOString();
    if (await slotHasConflict(providerId, iso)) continue;

    const startTime = `${pad2(hour)}:${pad2(minute)}:00`;
    slots.push({
      start_time: startTime,
      scheduled_at: iso,
      hour,
      minute
    });
  }

  if (emergencyTodayOnly && isToday && !slots.length) return [];
  return slots;
}

function dayPayload(date, enumKey, slots) {
  return {
    day_of_week: enumKey,
    day_name_ar: DAY_AR[enumKey] || enumKey,
    calendar_date: toYmd(date),
    date_ddmm: formatDdMm(date),
    slots
  };
}

/**
 * @param {string} providerId
 * @param {'standard'|'emergency'} filter
 */
export async function discoverAvailableSlots(providerId, filter) {
  const mode = filter === 'emergency' ? 'emergency' : 'standard';
  const availability = await loadAvailability(providerId);
  const now = new Date();

  if (!availability.length) {
    return { filter: mode, days: [] };
  }

  const days = [];

  if (mode === 'emergency') {
    for (let offset = 0; offset < 14; offset++) {
      const date = new Date(now);
      date.setDate(date.getDate() + offset);
      date.setHours(12, 0, 0, 0);
      const enumKey = dateToDayEnum(date);
      const row = availability.find((a) => a.day_of_week === enumKey);
      if (!row) continue;

      const slots = await buildSlotsForDate(providerId, row, date, now, offset === 0);
      if (!slots.length) continue;

      days.push(dayPayload(date, enumKey, slots));
      break;
    }
  } else {
    for (const row of availability) {
      const enumKey = row.day_of_week;
      let date = nextOccurrenceOnOrAfter(enumKey, now);
      if (!date) continue;

      const slotDate = new Date(date);
      slotDate.setHours(12, 0, 0, 0);
      let slots = await buildSlotsForDate(providerId, row, slotDate, now, false);

      if (!slots.length) {
        date = new Date(slotDate);
        date.setDate(date.getDate() + 7);
        slots = await buildSlotsForDate(providerId, row, date, now, false);
      }

      if (slots.length) {
        days.push(dayPayload(date, enumKey, slots));
      }
    }
  }

  return { filter: mode, days };
}
