/** تحويل تاريخ JS إلى day_of_week_enum (sat..fri) */
const JS_DAY_TO_ENUM = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function dateToDayEnum(dateInput) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(d.getTime())) return null;
  return JS_DAY_TO_ENUM[d.getDay()];
}

export function parseTimeToPg(timeStr) {
  if (!timeStr) return null;
  const t = String(timeStr).trim();
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(t)) {
    const parts = t.split(':');
    if (parts.length === 2) return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`;
    return t;
  }
  return null;
}
