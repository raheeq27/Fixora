/** تقسيم نص المناطق (فاصلة عربية أو إنجليزية) */
export function splitAreasInput(input) {
  if (input == null || input === '') return [];
  if (Array.isArray(input)) return input.map((s) => String(s).trim()).filter(Boolean);
  if (typeof input === 'string') {
    return input.split(/[,،]/).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

/** نص المناطق المخدومة كما يكتبه الحرفي (للعرض في البروفايل فقط — لا يُستخدم في البحث) */
export function normalizeServicedAreasText(input) {
  if (input == null) return null;
  const raw = Array.isArray(input) ? input.join('، ') : String(input).trim();
  if (!raw) return null;
  return raw.slice(0, 2000);
}

export function servicedAreasTextToList(text) {
  return splitAreasInput(text);
}

export async function saveServicedAreasText(pool, providerId, input) {
  const text = normalizeServicedAreasText(input);
  await pool.query(
    'UPDATE provider_profiles SET serviced_areas_text = $1 WHERE id = $2',
    [text, providerId]
  );
  const result = {
    serviced_areas_text: text,
    service_areas: servicedAreasTextToList(text)
  };
  // #region agent log
  fetch('http://127.0.0.1:7413/ingest/b6795036-60bf-453e-a231-7fde9205c57b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c3def8'},body:JSON.stringify({sessionId:'c3def8',location:'providerAreas.js:saveServicedAreasText',message:'areas saved',data:{providerId,textLen:text?text.length:0,listLen:result.service_areas.length},timestamp:Date.now(),hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  return result;
}

/** تحويل بيانات قديمة من provider_areas إلى قائمة عرض */
export function legacyAreasToList(areaRows) {
  if (!Array.isArray(areaRows) || !areaRows.length) return [];
  const districts = areaRows.map((r) => r.district).filter(Boolean);
  if (districts.length) return districts;
  return areaRows.map((r) => r.governorate).filter(Boolean);
}

export function resolveServiceAreasForDisplay(profileRow, legacyAreaRows = []) {
  if (profileRow?.serviced_areas_text) {
    return servicedAreasTextToList(profileRow.serviced_areas_text);
  }
  return legacyAreasToList(legacyAreaRows);
}
