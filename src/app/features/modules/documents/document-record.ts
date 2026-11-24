import schema from './document.schema.json';

export type Turu = 'mal' | 'hizmet' | 'yapim';
export type Usulu = 'ihale' | 'dogrudanTemin' | 'diger';
export type IhaleUsulu = 'acikIhale' | 'pazarlik21A' | 'pazarlik21B' | 'pazarlik21D';
export type DogrudanTeminUsulu = 'dogrudanTemin22A' | 'dogrudanTemin22B' | 'dogrudanTemin22C';

export interface DocumentRecord {
  id: string;
  source?: 'yerel' | 'drive';
  isinAdi: string;
  turu: Turu;
  usulu: Usulu;
  ihaleUsulu?: IhaleUsulu;
  dogrudanTeminUsulu?: DogrudanTeminUsulu;
  alimTarihi: string;
  aciklama?: string;
  exportedAt?: string;
}

type SchemaProperty = {
  type?: string;
  enum?: string[];
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  title?: string;
};

const schemaProperties = (schema as { properties: Record<string, SchemaProperty> }).properties;

const enumOf = (key: string): string[] => schemaProperties[key]?.enum ?? [];
const minLengthOf = (key: string): number => schemaProperties[key]?.minLength ?? 0;
const maxLengthOf = (key: string): number =>
  schemaProperties[key]?.maxLength ?? Number.MAX_SAFE_INTEGER;

export const TURU_OPTIONS: { value: Turu; label: string }[] = [
  { value: 'mal', label: 'Mal' },
  { value: 'hizmet', label: 'Hizmet' },
  { value: 'yapim', label: 'Yapım' },
];

export const USULU_OPTIONS: { value: Usulu; label: string }[] = [
  { value: 'ihale', label: 'İhale' },
  { value: 'dogrudanTemin', label: 'Doğrudan Temin' },
  { value: 'diger', label: 'Diğer' },
];

export const IHALE_USULU_OPTIONS: { value: IhaleUsulu; label: string }[] = [
  { value: 'acikIhale', label: 'Açık İhale' },
  { value: 'pazarlik21A', label: 'Pazarlık 21-A' },
  { value: 'pazarlik21B', label: 'Pazarlık 21-B' },
  { value: 'pazarlik21D', label: 'Pazarlık 21-D' },
];

export const DOGRUDAN_TEMIN_USULU_OPTIONS: { value: DogrudanTeminUsulu; label: string }[] = [
  { value: 'dogrudanTemin22A', label: 'Doğrudan Temin - 22A' },
  { value: 'dogrudanTemin22B', label: 'Doğrudan Temin - 22B' },
  { value: 'dogrudanTemin22C', label: 'Doğrudan Temin - 22C' },
];

export const DOCUMENT_FIELDS = {
  isinAdi: 'İşin adı',
  turu: 'Türü',
  usulu: 'Usulü',
  ihaleUsulu: 'İhale usulü',
  dogrudanTeminUsulu: 'Doğrudan temin usulü',
  alimTarihi: 'Alım tarihi',
  aciklama: 'Açıklama',
} as const;

export function turuLabel(value: Turu): string {
  return TURU_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function usuluLabel(value: Usulu): string {
  return USULU_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function usulDetayiLabel(record: DocumentRecord): string {
  if (record.usulu === 'ihale' && record.ihaleUsulu) {
    return IHALE_USULU_OPTIONS.find((option) => option.value === record.ihaleUsulu)?.label ?? '';
  }
  if (record.usulu === 'dogrudanTemin' && record.dogrudanTeminUsulu) {
    return (
      DOGRUDAN_TEMIN_USULU_OPTIONS.find((option) => option.value === record.dogrudanTeminUsulu)
        ?.label ?? ''
    );
  }
  return '—';
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
// Sheets hücresine ayrıştırılmış yazılan (eski USER_ENTERED kayıt) tarihler, tablonun yerel
// biçiminde okunur: 15.01.2026 (noktalı, gün.ay.yıl) veya 1/15/2026 (bölü, ay/gün/yıl).
const DOTTED_SHEET_DATE = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
const SLASHED_SHEET_DATE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

function toIsoDate(year: string, month: string, day: string): string {
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// Eski satırlardaki biçimlendirilmiş tarihi YYYY-AA-GG biçimine çevirir; gün/ay sırası
// belirsizse (her iki bileşen de 12'den küçük) değer olduğu gibi bırakılır.
function normalizeSheetDate(value: string): string {
  if (DATE_PATTERN.test(value)) {
    return value;
  }

  const dotted = DOTTED_SHEET_DATE.exec(value);
  if (dotted) {
    const [, first, second, year] = dotted;
    const dayFirst = Number(first) <= 12 && Number(second) > 12 ? false : true;
    return dayFirst ? toIsoDate(year, second, first) : toIsoDate(year, first, second);
  }

  const slashed = SLASHED_SHEET_DATE.exec(value);
  if (slashed) {
    const [, first, second, year] = slashed;
    if (Number(first) > 12) {
      return toIsoDate(year, second, first);
    }
    if (Number(second) > 12) {
      return toIsoDate(year, first, second);
    }
  }

  return value;
}

function isRealDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime());
}

type DocumentField =
  | 'isinAdi'
  | 'turu'
  | 'usulu'
  | 'ihaleUsulu'
  | 'dogrudanTeminUsulu'
  | 'alimTarihi'
  | 'aciklama';

// Şema (document.schema.json) kurallarına göre doğrulama; alan adı -> Türkçe hata mesajı.
export function validateDocumentRecord(
  value: unknown,
): Partial<Record<DocumentField, string>> {
  const errors: Partial<Record<DocumentField, string>> = {};
  if (typeof value !== 'object' || value === null) {
    return { isinAdi: 'Kayıt verisi geçersiz.' };
  }

  const record = value as Partial<DocumentRecord>;
  const text = (input: unknown): string => (typeof input === 'string' ? input.trim() : '');

  const isinAdi = text(record.isinAdi);
  if (!isinAdi) {
    errors.isinAdi = 'İşin adı zorunludur.';
  } else if (isinAdi.length < minLengthOf('isinAdi')) {
    errors.isinAdi = `İşin adı en az ${minLengthOf('isinAdi')} karakter olmalıdır.`;
  } else if (isinAdi.length > maxLengthOf('isinAdi')) {
    errors.isinAdi = `İşin adı en fazla ${maxLengthOf('isinAdi')} karakter olabilir.`;
  }

  if (!record.turu || !enumOf('turu').includes(record.turu)) {
    errors.turu = 'Türü seçin (Mal, Hizmet veya Yapım).';
  }

  if (!record.usulu || !enumOf('usulu').includes(record.usulu)) {
    errors.usulu = 'Usulü seçin.';
  } else if (record.usulu === 'ihale') {
    if (!record.ihaleUsulu || !enumOf('ihaleUsulu').includes(record.ihaleUsulu)) {
      errors.ihaleUsulu = 'İhale usulü seçin.';
    }
    if (record.dogrudanTeminUsulu) {
      errors.dogrudanTeminUsulu = 'İhale seçildiğinde doğrudan temin usulü girilmez.';
    }
  } else if (record.usulu === 'dogrudanTemin') {
    if (
      !record.dogrudanTeminUsulu ||
      !enumOf('dogrudanTeminUsulu').includes(record.dogrudanTeminUsulu)
    ) {
      errors.dogrudanTeminUsulu = 'Doğrudan temin usulü seçin.';
    }
    if (record.ihaleUsulu) {
      errors.ihaleUsulu = 'Doğrudan temin seçildiğinde ihale usulü girilmez.';
    }
  }

  const alimTarihi = text(record.alimTarihi);
  if (!alimTarihi) {
    errors.alimTarihi = 'Alım tarihi zorunludur.';
  } else if (!DATE_PATTERN.test(alimTarihi) || !isRealDate(alimTarihi)) {
    errors.alimTarihi = 'Alım tarihi geçerli bir tarih olmalıdır (YYYY-AA-GG).';
  }

  const aciklama = text(record.aciklama);
  if (aciklama.length > maxLengthOf('aciklama')) {
    errors.aciklama = `Açıklama en fazla ${maxLengthOf('aciklama')} karakter olabilir.`;
  }

  return errors;
}

export const DOCUMENT_SHEET_HEADERS = [
  'İşin Adı',
  'Türü',
  'Usulü',
  'Usul Detayı',
  'Alım Tarihi',
  'Açıklama',
  'Kaydedilme Tarihi',
] as const;

export function toSheetRow(record: DocumentRecord): string[] {
  return [
    record.isinAdi,
    turuLabel(record.turu),
    usuluLabel(record.usulu),
    usulDetayiLabel(record),
    record.alimTarihi,
    record.aciklama?.trim() ?? '',
    record.exportedAt ?? new Date().toISOString(),
  ];
}

export function createRecordId(): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  return uuid ?? `doc-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// Drive'daki "dosyalar" tablosundan okunan satırı kayda çevirir. Etiketler tanınmazsa
// veya zorunlu alanlar boşsa null döner (satır atlanır).
export function fromSheetRow(row: string[]): DocumentRecord | null {
  const [isinAdi, turuText, usuluText, usulDetayi, tarihText, aciklama] = row.map((cell) =>
    (cell ?? '').trim(),
  );

  const alimTarihi = normalizeSheetDate(tarihText);
  if (!isinAdi || !alimTarihi) {
    return null;
  }

  const turu = TURU_OPTIONS.find((option) => option.label === turuText)?.value;
  const usulu = USULU_OPTIONS.find((option) => option.label === usuluText)?.value;
  if (!turu || !usulu) {
    return null;
  }

  const ihaleUsulu = IHALE_USULU_OPTIONS.find((option) => option.label === usulDetayi)?.value;
  const dogrudanTeminUsulu = DOGRUDAN_TEMIN_USULU_OPTIONS.find(
    (option) => option.label === usulDetayi,
  )?.value;

  return {
    id: createRecordId(),
    source: 'drive',
    isinAdi,
    turu,
    usulu,
    ...(usulu === 'ihale' && ihaleUsulu ? { ihaleUsulu } : {}),
    ...(usulu === 'dogrudanTemin' && dogrudanTeminUsulu ? { dogrudanTeminUsulu } : {}),
    alimTarihi,
    ...(aciklama ? { aciklama } : {}),
    exportedAt: new Date().toISOString(),
  };
}

export function recordKey(record: DocumentRecord): string {
  return `${record.isinAdi.toLowerCase()}|${record.alimTarihi}|${record.turu}`;
}

// Drive'dan okunan satırları mevcut kayıtlarla birleştirir; aynı kayıt (ad+tarih+tür)
// yerelde varsa yeniden eklenmez. Eklenen kayıt sayısını döner.
export function mergeSheetRecords(current: DocumentRecord[], loaded: DocumentRecord[]): {
  records: DocumentRecord[];
  added: number;
} {
  const keys = new Set(current.map((record) => recordKey(record)));
  const records = [...current];
  let added = 0;

  for (const record of loaded) {
    const key = recordKey(record);
    if (keys.has(key)) {
      continue;
    }
    keys.add(key);
    records.push(record);
    added += 1;
  }

  return { records, added };
}
