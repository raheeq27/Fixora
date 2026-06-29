/** قيم enum jordan_governorates في PostgreSQL */
export const VALID_GOVERNORATES = [
  'Amman',
  'Irbid',
  'Zarqa',
  'Aqaba',
  'Madaba',
  'Mafraq',
  'Balqa',
  'Karak',
  'Tafileh',
  "Ma'an",
  'Ajloun',
  'Jerash',
  'Salat'
];

const ALIASES = {
  amman: 'Amman',
  irbid: 'Irbid',
  zarqa: 'Zarqa',
  aqaba: 'Aqaba',
  madaba: 'Madaba',
  mafraq: 'Mafraq',
  balqa: 'Balqa',
  salt: 'Salat',
  salat: 'Salat',
  karak: 'Karak',
  tafilah: 'Tafileh',
  maan: "Ma'an",
  "ma''an": "Ma'an",
  "ma'an": "Ma'an",
  ajloun: 'Ajloun',
  jarash: 'Jerash',
  'عمّان': 'Amman',
  'عمان': 'Amman',
  'إربد': 'Irbid',
  'اربد': 'Irbid',
  'الزرقاء': 'Zarqa',
  'الزرقا': 'Zarqa',
  'العقبة': 'Aqaba',
  'السلط': 'Salat',
  'المفرق': 'Mafraq',
  'الكرك': 'Karak',
  'معان': "Ma'an",
  'الطفيلة': 'Tafileh',
  'عجلون': 'Ajloun',
  'جرش': 'Jerash',
  'مادبا': 'Madaba',
  'البلقاء': 'Balqa'
};

export function normalizeGovernorate(value) {
  if (value == null || value === '') return null;
  const raw = String(value).trim();
  if (VALID_GOVERNORATES.includes(raw)) return raw;
  if (ALIASES[raw]) return ALIASES[raw];
  const key = raw.toLowerCase().replace(/\s+/g, '');
  if (ALIASES[key]) return ALIASES[key];
  if (key === "ma''an" || key === "ma'an" || key === 'maan') return "Ma'an";
  if (raw === "Ma''an") return "Ma'an";
  return null;
}
