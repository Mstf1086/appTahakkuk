import { describe, expect, it } from 'vitest';
import {
  DocumentRecord,
  createRecordNumber,
  formatRecordNumber,
  fromSheetRow,
  mergeSheetRecords,
  parseRecordNumber,
  recordKey,
  toSheetRow,
  validateDocumentRecord,
} from './document-record';

const localRecord: DocumentRecord = {
  id: 'r1',
  isinAdi: 'Kırtasiye alımı',
  turu: 'mal',
  usulu: 'diger',
  alimTarihi: '2026-01-15',
};

describe('document-record', () => {
  it('sheet satırındaki etiketleri kayda çevirir', () => {
    const record = fromSheetRow([
      'Yazılım geliştirme',
      'Hizmet',
      'İhale',
      'Açık İhale',
      '2026-03-02',
      'Açıklama metni',
      '2026-11-13T10:00:00.000Z',
    ]);

    expect(record).toEqual(
      expect.objectContaining({
        isinAdi: 'Yazılım geliştirme',
        turu: 'hizmet',
        usulu: 'ihale',
        ihaleUsulu: 'acikIhale',
        alimTarihi: '2026-03-02',
        aciklama: 'Açıklama metni',
        source: 'drive',
      }),
    );
    expect(record?.exportedAt).toBeTruthy();
    expect(validateDocumentRecord(record)).toEqual({});
  });

  it('doğrudan temin alt usulünü çevirir', () => {
    const record = fromSheetRow([
      'Arıza bakımı',
      'Yapım',
      'Doğrudan Temin',
      'Doğrudan Temin - 22B',
      '2026-05-20',
      '',
    ]);

    expect(record?.turu).toBe('yapim');
    expect(record?.dogrudanTeminUsulu).toBe('dogrudanTemin22B');
    expect(record?.aciklama).toBeUndefined();
  });

  it('noktalı tarih biçimini ISO tarihe çevirir', () => {
    const record = fromSheetRow([
      'Kırtasiye alımı',
      'Mal',
      'Diğer',
      '',
      '15.01.2026',
      '',
      '',
    ]);

    expect(record?.alimTarihi).toBe('2026-01-15');
    expect(validateDocumentRecord(record)).toEqual({});
  });

  it('bölü ile yazılmış tarihi ISO tarihe çevirir', () => {
    expect(
      fromSheetRow(['Kırtasiye alımı', 'Mal', 'Diğer', '', '1/15/2026', '', ''])?.alimTarihi,
    ).toBe('2026-01-15');
    expect(
      fromSheetRow(['Kırtasiye alımı', 'Mal', 'Diğer', '', '15/01/2026', '', ''])?.alimTarihi,
    ).toBe('2026-01-15');
  });

  it('gün/ay sırası belirsizse tarihi değiştirmez', () => {
    expect(
      fromSheetRow(['Kırtasiye alımı', 'Mal', 'Diğer', '', '05/06/2026', '', ''])?.alimTarihi,
    ).toBe('05/06/2026');
  });

  it('ISO tarihi olduğu gibi bırakır', () => {
    expect(
      fromSheetRow(['Kırtasiye alımı', 'Mal', 'Diğer', '', '2026-01-15', '', ''])?.alimTarihi,
    ).toBe('2026-01-15');
  });

  it('zorunlu alanlar boşsa satırı atar', () => {
    expect(fromSheetRow(['', 'Mal', 'Diğer', '', '2026-01-15'])).toBeNull();
    expect(fromSheetRow(['Kırtasiye alımı', 'Mal', 'Diğer', '', ''])).toBeNull();
  });

  it('bilinmeyen etiketleri atar', () => {
    expect(fromSheetRow(['Kırtasiye alımı', 'Bilinmeyen', 'Diğer', '', '2026-01-15'])).toBeNull();
  });

  it('birleştirmede yinilenen kayıtları atar', () => {
    const loaded = [
      fromSheetRow(['Kırtasiye alımı', 'Mal', 'Diğer', '', '2026-01-15']) as DocumentRecord,
      fromSheetRow(['Yazılım geliştirme', 'Hizmet', 'İhale', 'Pazarlık 21-A', '2026-04-01']) as DocumentRecord,
    ];

    const merged = mergeSheetRecords([localRecord], loaded);
    expect(merged.added).toBe(1);
    expect(merged.records).toHaveLength(2);
    expect(recordKey(merged.records[1])).toBe(recordKey(loaded[1]));
    expect(merged.records[1].source).toBe('drive');
  });

  it('sheet satırı olarak kaydı geri yazar', () => {
    const row = toSheetRow({ ...localRecord, recordNumber: 'DOS-000001' });
    expect(row[0]).toBe('DOS-000001');
    expect(row[1]).toBe('Kırtasiye alımı');
    expect(row[2]).toBe('Mal');
    expect(row[3]).toBe('Diğer');
    expect(row[5]).toBe('2026-01-15');
  });

  it('DOSYA ID üretimi artan ve benzersizdir', () => {
    expect(formatRecordNumber(1)).toBe('DOS-000001');
    expect(formatRecordNumber(42)).toBe('DOS-000042');
    expect(parseRecordNumber('DOS-000007')).toBe(7);
    expect(parseRecordNumber('')).toBeNull();

    const existing = [
      { ...localRecord, recordNumber: 'DOS-000003' },
      { ...localRecord, id: 'r2', recordNumber: 'DOS-000011' },
    ];
    expect(createRecordNumber(existing)).toBe('DOS-000012');
    expect(createRecordNumber([])).toBe('DOS-000001');
  });

  it('numarasız eski satırlar kayda çevrilir, numaralı satırla karışmaz', () => {
    const legacy = fromSheetRow(['test', 'Mal', 'İhale', 'Açık İhale', '2026-11-12', 'asd']);
    expect(legacy?.isinAdi).toBe('test');
    expect(legacy?.recordNumber).toBeUndefined();

    const numbered = fromSheetRow([
      'DOS-000004',
      'test',
      'Mal',
      'İhale',
      'Açık İhale',
      '2026-11-12',
      'asd',
    ]);
    expect(numbered?.recordNumber).toBe('DOS-000004');
  });

  it('birleştirme sonrası liste DOSYA ID’ye göre sıralanır', () => {
    const base = { isinAdi: 'Kırtasiye alımı', turu: 'mal' as const, usulu: 'diger' as const, alimTarihi: '2026-01-15' };
    const a = { ...base, id: 'r1', recordNumber: 'DOS-000002' };
    const b = { ...base, id: 'r2', recordNumber: 'DOS-000001', isinAdi: 'Yazılım geliştirme', alimTarihi: '2026-03-02' };
    const c = { ...base, id: 'r3' };
    const merged = mergeSheetRecords([a, c], [b]);
    expect(merged.added).toBe(1);
    expect(merged.records.map((r) => r.id)).toEqual(['r2', 'r1', 'r3']);
  });

  it('numaralı yerel kayıt numarasız eski satırla eşleşir ve tersi de geçerlidir', () => {
    const local = { ...localRecord, recordNumber: 'DOS-000001' };
    const incoming = fromSheetRow([
      'Kırtasiye alımı',
      'Mal',
      'Diğer',
      '',
      '2026-01-15',
      '',
      '',
    ]) as DocumentRecord;
    const merged = mergeSheetRecords([local], [incoming]);
    expect(merged.added).toBe(0);
    expect(merged.records).toHaveLength(1);
    expect(merged.records[0].recordNumber).toBe('DOS-000001');
  });
});