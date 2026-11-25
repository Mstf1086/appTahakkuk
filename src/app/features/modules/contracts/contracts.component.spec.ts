import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../../core/auth.service';
import { GoogleDriveService } from '../../../core/google-drive.service';
import { DocumentsService } from '../documents/documents.service';
import { DocumentRecord } from '../documents/document-record';
import { ContractsComponent } from './contracts.component';

const authStub = {
  user: signal<{ uid: string; email: string } | null>({ uid: 'u1', email: 'a@b.com' }),
  waitForAuthState: async () => null,
};

const driveStub = {
  status: signal('disconnected'),
  busy: signal(false),
  error: signal(''),
  info: signal(null as unknown),
  isLinked: signal(false),
  hasSessionToken: signal(false),
  loadSheetRows: vi.fn(async () => [] as string[][]),
  writeSheet: vi.fn(async () => undefined),
  connect: vi.fn(async () => undefined),
  disconnect: vi.fn(),
};

const documentRecord: DocumentRecord = {
  id: 'r1',
  recordNumber: 'REC-000001',
  isinAdi: 'Kırtasiye alımı',
  turu: 'mal',
  usulu: 'diger',
  alimTarihi: '2026-01-15',
  aciklama: '',
};

function clickButton(fixture: { nativeElement: HTMLElement }, text: string): HTMLButtonElement {
  const button = (
    Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[]
  ).find((candidate) => candidate.textContent?.trim() === text);
  if (!button) {
    throw new Error(`Buton bulunamadı: ${text}`);
  }
  button.click();
  return button;
}

function setValue(fixture: { nativeElement: HTMLElement }, selector: string, value: string): void {
  const element = fixture.nativeElement.querySelector(selector) as HTMLInputElement | null;
  if (!element) {
    throw new Error(`Alan bulunamadı: ${selector}`);
  }
  element.value = value;
  element.dispatchEvent(new Event('input'));
}

describe('ContractsComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    driveStub.loadSheetRows.mockReset();
    driveStub.loadSheetRows.mockResolvedValue([]);
    driveStub.writeSheet.mockClear();
    driveStub.connect.mockClear();
    driveStub.isLinked.set(false);
    driveStub.hasSessionToken.set(false);

    await TestBed.configureTestingModule({
      imports: [ContractsComponent],
      providers: [
        { provide: AuthService, useValue: authStub },
        { provide: GoogleDriveService, useValue: driveStub },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ recordNumber: 'REC-000001' }) } },
        },
      ],
    }).compileComponents();
  });

  it('bilinmeyen Sıra No için uyarı gösterir', () => {
    const fixture = TestBed.createComponent(ContractsComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Bu adres bir dosya kaydına işaret etmiyor');
  });

  it('seçili dosya kaydının bilgilerini gösterir', async () => {
    await TestBed.inject(DocumentsService).add({
      isinAdi: 'Kırtasiye alımı',
      turu: 'mal',
      usulu: 'diger',
      alimTarihi: '2026-01-15',
    });
    const fixture = TestBed.createComponent(ContractsComponent);
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector('.record-panel') as HTMLElement;
    expect(panel.textContent).toContain('REC-000001');
    expect(panel.textContent).toContain('Kırtasiye alımı');
    expect(panel.textContent).toContain('Alım tarihi');
  });

  it('bağlantı açıksa Drive’daki sözleşmeleri otomatik yükler ve listeler', async () => {
    const service = TestBed.inject(DocumentsService);
    await service.add({
      isinAdi: 'Kırtasiye alımı',
      turu: 'mal',
      usulu: 'diger',
      alimTarihi: '2026-01-15',
    });
    driveStub.isLinked.set(true);
    driveStub.hasSessionToken.set(true);
    driveStub.loadSheetRows.mockResolvedValue([
      ['SOZ-000001', 'REC-000001', 'ABC Ltd. Şti.', '1234567890', '1.250,75', '2026-03-15', ''],
    ]);
    const fixture = TestBed.createComponent(ContractsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(driveStub.loadSheetRows).toHaveBeenCalledWith('sözleşmeler', expect.any(Array));
    const table = fixture.nativeElement.querySelector('.records') as HTMLTableElement;
    expect(table.textContent).toContain('SOZ-000001');
    expect(table.textContent).toContain('ABC Ltd. Şti.');
    expect(table.textContent).toContain('REC-000001');
    expect(table.textContent).toContain('1.250,75 ₺');
  });

  it('yeni sözleşme ekler ve "sözleşmeler" tablosuna yazar', async () => {
    const service = TestBed.inject(DocumentsService);
    await service.add({
      isinAdi: 'Kırtasiye alımı',
      turu: 'mal',
      usulu: 'diger',
      alimTarihi: '2026-01-15',
    });
    driveStub.isLinked.set(true);
    driveStub.hasSessionToken.set(true);
    const fixture = TestBed.createComponent(ContractsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    driveStub.writeSheet.mockClear();

    clickButton(fixture, 'Yeni sözleşme');
    fixture.detectChanges();
    setValue(fixture, '#firmaAdi', 'ABC Ltd. Şti.');
    setValue(fixture, '#vergiNo', '1234567890');
    setValue(fixture, '#tutar', '1.250,75');
    setValue(fixture, '#sozlesmeTarihi', '2026-03-15');
    clickButton(fixture, 'Kaydet');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Sözleşme eklendi');
    const table = fixture.nativeElement.querySelector('.records') as HTMLTableElement;
    expect(table.textContent).toContain('SOZ-000001');
    expect(driveStub.writeSheet).toHaveBeenCalledTimes(1);
    const [sheetName, header, rows] = driveStub.writeSheet.mock.calls[0] as unknown as [
      string,
      string[],
      string[][],
    ];
    expect(sheetName).toBe('sözleşmeler');
    expect(header[0]).toBe('Sözleşme ID');
    expect(header[1]).toBe('Sıra No');
    expect(rows[0][1]).toBe('REC-000001');
  });

  it('geçersiz girdide hata gösterir ve yazmaz', async () => {
    const service = TestBed.inject(DocumentsService);
    await service.add({
      isinAdi: 'Kırtasiye alımı',
      turu: 'mal',
      usulu: 'diger',
      alimTarihi: '2026-01-15',
    });
    driveStub.isLinked.set(true);
    driveStub.hasSessionToken.set(true);
    const fixture = TestBed.createComponent(ContractsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    clickButton(fixture, 'Yeni sözleşme');
    fixture.detectChanges();
    setValue(fixture, '#vergiNo', '123');
    clickButton(fixture, 'Kaydet');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.field-error').length).toBeGreaterThan(0);
    // Sadece sözleşme yazımı yapılmamalı (dosyalar tablosu aynalaması hariç).
    const contractWrite = driveStub.writeSheet.mock.calls.find(
      (call) => (call as unknown as string[])[0] === 'sözleşmeler',
    );
    expect(contractWrite).toBeUndefined();
  });

  it('silme onayı sözleşmeyi listeden ve tablodan kaldırır', async () => {
    const service = TestBed.inject(DocumentsService);
    await service.add({
      isinAdi: 'Kırtasiye alımı',
      turu: 'mal',
      usulu: 'diger',
      alimTarihi: '2026-01-15',
    });
    driveStub.isLinked.set(true);
    driveStub.hasSessionToken.set(true);
    driveStub.loadSheetRows.mockResolvedValue([
      ['SOZ-000001', 'REC-000001', 'ABC Ltd. Şti.', '1234567890', '1.250,75', '2026-03-15', ''],
    ]);
    const fixture = TestBed.createComponent(ContractsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    driveStub.writeSheet.mockClear();

    clickButton(fixture, 'Sil');
    fixture.detectChanges();
    clickButton(fixture, 'Seçili sözleşmeyi sil');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Sözleşme silindi');
    expect(fixture.nativeElement.textContent).toContain('Bu kayda ait sözleşme yok');
    expect(driveStub.writeSheet).toHaveBeenCalledTimes(1);
  });

  it('kullanıcı misafirse sözleşme işlemleri gösterilmez', () => {
    authStub.user.set(null);
    const service = TestBed.inject(DocumentsService);
    void service.add({
      isinAdi: 'Kırtasiye alımı',
      turu: 'mal',
      usulu: 'diger',
      alimTarihi: '2026-01-15',
    });
    const fixture = TestBed.createComponent(ContractsComponent);
    fixture.detectChanges();

    expect(
      (Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[]).some(
        (button) => button.textContent?.includes('Yeni sözleşme'),
      ),
    ).toBe(false);
  });
});
