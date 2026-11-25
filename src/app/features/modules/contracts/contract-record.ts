export interface ContractRecord {
  id: string;
  contractId: string;
  recordNumber: string;
  firmaAdi: string;
  vergiNo: string;
  tutar: string;
  sozlesmeTarihi: string;
  kaydedilmeTarihi?: string;
}

type ContractField = 'firmaAdi' | 'vergiNo' | 'tutar' | 'sozlesmeTarihi';
type ContractErrors = Partial<Record<ContractField, string>>;

export const CONTRACT_FIELDS: Record<ContractField, string> = {
  firmaAdi: 'Firma adı',
  vergiNo: 'Vergi no',
  tutar: 'Sözleşme tutarı',
  sozlesmeTarihi: 'Sözleşme tarihi',
};

export const CONTRACT_SHEET_HEADERS = [
  'Sözleşme ID',
  'Sıra No',
  'Firma Adı',
  'Vergi No',
  'Sözleşme Tutarı',
  'Sözleşme Tarihi',
  'Kaydedilme Tarihi',
] as const;

const CONTRACT_ID_PREFIX = 'SOZ-';
const CONTRACT_ID_WIDTH = 6;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const VERGI_NO_PATTERN = /^\d{10,11}$/;
const TUTAR_PATTERN = /^\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?$|^\d+(?:[.,]\d{1,2})?$/;

export function formatContractId(value: number): string {
  return `${CONTRACT_ID_PREFIX}${String(value).padStart(CONTRACT_ID_WIDTH, '0')}`;
}

export function parseContractId(value: string): number | null {
  const match = /^SOZ-(\d{1,})$/.exec(value.trim());
  return match ? Number(match[1]) : null;
}

export function createContractId(existing: ContractRecord[]): string {
  const max = existing.reduce((acc, contract) => {
    const parsed = parseContractId(contract.contractId);
    return parsed !== null && parsed > acc ? parsed : acc;
  }, 0);
  return formatContractId(max + 1);
}

// Türkçe tutar girdisini (1.250,75 / 1250.75 / 1 250,75) sayıya çevirir;
// geçersizse null döner.
export function parseTutar(value: string): number | null {
  const text = value.replace(/\s/g, '');
  if (!text) {
    return null;
  }
  let normalized: string;
  if (text.includes(',')) {
    // Türkçe biçim: nokta binlik ayırıcı, virgül ondalık (1.250,75).
    normalized = text.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(?:\.\d{3})+$/.test(text)) {
    // Yalnız nokta ve üçlü gruplar: binlik ayırıcı (1.250.000).
    normalized = text.replace(/\./g, '');
  } else {
    // Virgülsüz nokta ondalıktır (1250.75).
    normalized = text;
  }
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatTutar(value: number): string {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function tutarLabel(value: string): string {
  const parsed = parseTutar(value);
  const text = parsed === null ? value : formatTutar(parsed);
  return `${text} ₺`;
}

export function contractId(value: string): string {
  return value.trim();
}

export function sortContracts(contracts: ContractRecord[]): ContractRecord[] {
  return [...contracts].sort((a, b) => {
    const numberA = parseContractId(a.contractId);
    const numberB = parseContractId(b.contractId);
    if (numberA !== null && numberB !== null) {
      return numberA - numberB;
    }
    if (numberA !== null) {
      return -1;
    }
    if (numberB !== null) {
      return 1;
    }
    return 0;
  });
}

export function listContractsForRecord(
  contracts: ContractRecord[],
  recordNumber: string,
): ContractRecord[] {
  if (!recordNumber) {
    return [];
  }
  return contracts.filter((contract) => contract.recordNumber === recordNumber);
}

export function validateContractInput(value: {
  firmaAdi: string;
  vergiNo: string;
  tutar: string;
  sozlesmeTarihi: string;
}): ContractErrors {
  const errors: ContractErrors = {};
  const firmaAdi = value.firmaAdi.trim();
  if (!firmaAdi) {
    errors.firmaAdi = 'Firma adı zorunludur.';
  } else if (firmaAdi.length < 2) {
    errors.firmaAdi = 'Firma adı en az 2 karakter olmalıdır.';
  } else if (firmaAdi.length > 200) {
    errors.firmaAdi = 'Firma adı en fazla 200 karakter olabilir.';
  }

  const vergiNo = value.vergiNo.trim();
  if (!vergiNo) {
    errors.vergiNo = 'Vergi no zorunludur.';
  } else if (!VERGI_NO_PATTERN.test(vergiNo)) {
    errors.vergiNo = 'Vergi no 10 veya 11 haneli rakam olmalıdır.';
  }

  const tutar = value.tutar.trim();
  if (!tutar) {
    errors.tutar = 'Sözleşme tutarı zorunludur.';
  } else if (!TUTAR_PATTERN.test(tutar)) {
    errors.tutar = 'Sözleşme tutarı sayı olmalıdır (ör. 12.500,75).';
  } else if (parseTutar(tutar) === null || parseTutar(tutar) === 0) {
    errors.tutar = 'Sözleşme tutarı sıfırdan büyük olmalıdır.';
  }

  const sozlesmeTarihi = value.sozlesmeTarihi.trim();
  if (!sozlesmeTarihi) {
    errors.sozlesmeTarihi = 'Sözleşme tarihi zorunludur.';
  } else if (!DATE_PATTERN.test(sozlesmeTarihi)) {
    errors.sozlesmeTarihi = 'Sözleşme tarihi geçerli bir tarih olmalıdır (YYYY-AA-GG).';
  }

  return errors;
}

export function createContractRecordId(): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  return uuid ?? `soz-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function addContract(
  existing: ContractRecord[],
  input: Omit<ContractRecord, 'id' | 'contractId' | 'kaydedilmeTarihi'>,
): { contracts: ContractRecord[]; contract: ContractRecord } {
  const contracts = sortContracts(existing);
  const contract: ContractRecord = {
    ...input,
    id: createContractRecordId(),
    contractId: createContractId(contracts),
    kaydedilmeTarihi: new Date().toISOString(),
  };
  return { contracts: sortContracts([...contracts, contract]), contract };
}

export function deleteContract(
  existing: ContractRecord[],
  id: string,
): { contracts: ContractRecord[]; changed: boolean } {
  if (!existing.some((contract) => contract.id === id)) {
    return { contracts: existing, changed: false };
  }
  return {
    contracts: existing.filter((contract) => contract.id !== id),
    changed: true,
  };
}

export function toContractSheetRow(contract: ContractRecord): string[] {
  return [
    contract.contractId,
    contract.recordNumber,
    contract.firmaAdi,
    contract.vergiNo,
    formatTutar(parseTutar(contract.tutar) ?? 0),
    contract.sozlesmeTarihi,
    contract.kaydedilmeTarihi ?? new Date().toISOString(),
  ];
}

// "sözleşmeler" tablosundan okunan satırı kayda çevirir; zorunlu alanlar boşsa null döner.
export function fromContractSheetRow(row: string[]): ContractRecord | null {
  const cells = row.map((cell) => (cell ?? '').trim());
  const numbered = parseContractId(cells[0] ?? '') !== null;
  const [
    contractId,
    recordNumber,
    firmaAdi,
    vergiNo,
    tutar,
    sozlesmeTarihi,
    kaydedilmeTarihi,
  ] = numbered ? cells : ['', ...cells];

  if (!firmaAdi || !vergiNo || !sozlesmeTarihi || !recordNumber) {
    return null;
  }
  if (!VERGI_NO_PATTERN.test(vergiNo) || parseTutar(tutar) === null) {
    return null;
  }
  if (!DATE_PATTERN.test(sozlesmeTarihi)) {
    return null;
  }

  return {
    id: `${recordNumber}|${contractId || firmaAdi}|${sozlesmeTarihi}|${vergiNo}`,
    contractId,
    recordNumber,
    firmaAdi,
    vergiNo,
    tutar,
    sozlesmeTarihi,
    ...(kaydedilmeTarihi ? { kaydedilmeTarihi } : {}),
  };
}

export function loadContracts(rows: string[][]): ContractRecord[] {
  return rows
    .map((row) => fromContractSheetRow(row))
    .filter((contract): contract is ContractRecord => contract !== null);
}