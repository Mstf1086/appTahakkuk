import { describe, expect, it } from 'vitest';
import {
  CONTRACT_SHEET_HEADERS,
  ContractRecord,
  addContract,
  createContractId,
  deleteContract,
  fromContractSheetRow,
  listContractsForRecord,
  loadContracts,
  parseContractId,
  parseTutar,
  sortContracts,
  toContractSheetRow,
  tutarLabel,
  validateContractInput,
} from './contract-record';

const base: Omit<ContractRecord, 'id' | 'contractId'> = {
  recordNumber: 'REC-000001',
  firmaAdi: 'ABC Ltd. Şti.',
  vergiNo: '1234567890',
  tutar: '1.250,75',
  sozlesmeTarihi: '2026-03-15',
};

const contract = (overrides: Partial<ContractRecord>): ContractRecord => ({
  ...base,
  id: overrides.id ?? 'id-1',
  contractId: overrides.contractId ?? 'SOZ-000001',
  ...overrides,
});

describe('contract-record', () => {
  it('contractId biçimlendirme ve ayrıştırma', () => {
    expect(parseContractId('SOZ-000042')).toBe(42);
    expect(parseContractId('SOZ-42')).toBe(42);
    expect(parseContractId('REC-000001')).toBeNull();
    expect(parseContractId('  SOZ-7  ')).toBe(7);
  });

  it('createContractId mevcut en büyük numaranın bir artanıdır', () => {
    expect(createContractId([])).toBe('SOZ-000001');
    expect(
      createContractId([contract({ contractId: 'SOZ-000004' }), contract({ contractId: 'SOZ-000002' })]),
    ).toBe('SOZ-000005');
    expect(createContractId([contract({ contractId: 'geçersiz' })])).toBe('SOZ-000001');
  });

  it('tutar ayrıştırma Türkçe biçimleri destekler', () => {
    expect(parseTutar('1.250,75')).toBe(1250.75);
    expect(parseTutar('1250.75')).toBe(1250.75);
    expect(parseTutar('1250')).toBe(1250);
    expect(parseTutar('')).toBeNull();
    expect(parseTutar('abc')).toBeNull();
    expect(tutarLabel('1.250,75')).toBe('1.250,75 ₺');
  });

  it('validateContractInput zorunlu alanları ve biçimleri denetler', () => {
    expect(validateContractInput({ firmaAdi: ' ', vergiNo: '', tutar: '', sozlesmeTarihi: '' })).toEqual({
      firmaAdi: 'Firma adı zorunludur.',
      vergiNo: 'Vergi no zorunludur.',
      tutar: 'Sözleşme tutarı zorunludur.',
      sozlesmeTarihi: 'Sözleşme tarihi zorunludur.',
    });
    expect(validateContractInput({ ...base, vergiNo: '12345' }).vergiNo).toBe(
      'Vergi no 10 veya 11 haneli rakam olmalıdır.',
    );
    expect(validateContractInput({ ...base, tutar: '0' }).tutar).toBe(
      'Sözleşme tutarı sıfırdan büyük olmalıdır.',
    );
    expect(validateContractInput({ ...base, sozlesmeTarihi: '15.03.2026' }).sozlesmeTarihi).toBe(
      'Sözleşme tarihi geçerli bir tarih olmalıdır (YYYY-AA-GG).',
    );
    expect(validateContractInput(base)).toEqual({});
  });

  it('addContract benzersiz id ve artan sözleşme numarası atar', () => {
    const existing = [contract({ contractId: 'SOZ-000001' })];
    const { contracts, contract: created } = addContract(existing, {
      ...base,
      firmaAdi: 'XYZ A.Ş.',
    });
    expect(created.contractId).toBe('SOZ-000002');
    expect(created.id).toBeTruthy();
    expect(created.kaydedilmeTarihi).toBeTruthy();
    expect(contracts).toHaveLength(2);
  });

  it('deleteContract yalnızca eşleşen kaydı kaldırır', () => {
    const existing = [contract({ id: 'a' }), contract({ id: 'b', contractId: 'SOZ-000002' })];
    expect(deleteContract(existing, 'yok').changed).toBe(false);
    const { contracts, changed } = deleteContract(existing, 'a');
    expect(changed).toBe(true);
    expect(contracts).toHaveLength(1);
    expect(contracts[0].id).toBe('b');
  });

  it('sortContracts sözleşme numarasına göre artan sıralar', () => {
    const sorted = sortContracts([
      contract({ contractId: 'SOZ-000003', id: 'c' }),
      contract({ contractId: 'SOZ-000001', id: 'a' }),
      contract({ contractId: 'SOZ-000002', id: 'b' }),
    ]);
    expect(sorted.map((item) => item.id)).toEqual(['a', 'b', 'c']);
  });

  it('listContractsForRecord yalnızca verilen dosyanın sözleşmelerini döner', () => {
    const contracts = [
      contract({ recordNumber: 'REC-000001' }),
      contract({ recordNumber: 'REC-000002', id: 'x' }),
    ];
    expect(listContractsForRecord(contracts, 'REC-000001')).toHaveLength(1);
    expect(listContractsForRecord(contracts, '')).toEqual([]);
  });

  it('toContractSheetRow başlık düzeniyle uyumlu satır üretir', () => {
    expect(CONTRACT_SHEET_HEADERS).toEqual([
      'Sözleşme ID',
      'Sıra No',
      'Firma Adı',
      'Vergi No',
      'Sözleşme Tutarı',
      'Sözleşme Tarihi',
      'Kaydedilme Tarihi',
    ]);
    const row = toContractSheetRow(contract({ tutar: '1250.75' }));
    expect(row[0]).toBe('SOZ-000001');
    expect(row[1]).toBe('REC-000001');
    expect(row[4]).toBe('1.250,75');
  });

  it('fromContractSheetRow başlıklı ve başlıksız satırları okur, bozuk satırları atar', () => {
    const parsed = fromContractSheetRow([
      'SOZ-000001',
      'REC-000001',
      'ABC Ltd. Şti.',
      '1234567890',
      '1.250,75',
      '2026-03-15',
      '2026-11-25T10:00:00.000Z',
    ]);
    expect(parsed?.contractId).toBe('SOZ-000001');
    expect(parsed?.kaydedilmeTarihi).toBe('2026-11-25T10:00:00.000Z');

    const legacy = fromContractSheetRow([
      'REC-000001',
      'ABC Ltd. Şti.',
      '1234567890',
      '1250,75',
      '2026-03-15',
      '',
    ]);
    expect(legacy?.contractId).toBe('');
    expect(parseTutar(legacy?.tutar ?? '')).toBe(1250.75);

    expect(fromContractSheetRow(['', ''])).toBeNull();
    expect(
      fromContractSheetRow(['SOZ-000001', 'REC-000001', 'ABC', 'abc', '1', '2026-03-15']),
    ).toBeNull();
  });

  it('loadContracts geçersiz satırları atlayarak liste kurar', () => {
    const contracts = loadContracts([
      ['SOZ-000001', 'REC-000001', 'ABC Ltd. Şti.', '1234567890', '1.250,75', '2026-03-15', ''],
      ['bozuk'],
    ]);
    expect(contracts).toHaveLength(1);
    expect(contracts[0].firmaAdi).toBe('ABC Ltd. Şti.');
  });
});
