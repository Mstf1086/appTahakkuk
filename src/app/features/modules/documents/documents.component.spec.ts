import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../../core/auth.service';
import { GoogleDriveService } from '../../../core/google-drive.service';
import { DocumentsComponent } from './documents.component';

const STORAGE_KEY = 'tahakkuk.documents.v1';

const authStub = {
  user: signal(null),
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
  connect: vi.fn(async () => undefined),
  disconnect: vi.fn(),
  saveDocumentsToSheet: vi.fn(
    async (_options: { header: string[]; rows: string[][] }) => ({
      spreadsheetId: 'sheet1',
      spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/sheet1',
      appendedRows: 2,
    }),
  ),
};

function seed(records: unknown[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function clickButton(fixture: { nativeElement: HTMLElement }, text: string): HTMLButtonElement {
  const button = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
    (candidate) => candidate.textContent?.trim() === text,
  ) as HTMLButtonElement | undefined;
  if (!button) {
    throw new Error(`Buton bulunamadı: ${text}`);
  }
  button.click();
  return button;
}

function setValue(fixture: { nativeElement: HTMLElement }, selector: string, value: string): void {
  const element = fixture.nativeElement.querySelector(selector) as
    | HTMLInputElement
    | HTMLSelectElement
    | HTMLTextAreaElement
    | null;
  if (!element) {
    throw new Error(`Alan bulunamadı: ${selector}`);
  }
  element.value = value;
  element.dispatchEvent(new Event(element instanceof HTMLSelectElement ? 'change' : 'input'));
}

const sample = {
  id: 'r1',
  recordNumber: 'REC-000001',
  isinAdi: 'Kırtasiye alımı',
  turu: 'mal',
  usulu: 'diger',
  alimTarihi: '2026-01-15',
  aciklama: '',
};

describe('DocumentsComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    driveStub.saveDocumentsToSheet.mockClear();
    driveStub.connect.mockClear();
    driveStub.connect.mockImplementation(async () => undefined);
    driveStub.isLinked.set(false);
    driveStub.hasSessionToken.set(false);
    driveStub.loadSheetRows.mockReset();
    driveStub.loadSheetRows.mockResolvedValue([]);

    await TestBed.configureTestingModule({
      imports: [DocumentsComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authStub },
        { provide: GoogleDriveService, useValue: driveStub },
      ],
    }).compileComponents();
  });

  it('kayıtları tablo halinde listeler', () => {
    seed([sample]);
    const fixture = TestBed.createComponent(DocumentsComponent);
    fixture.detectChanges();

    const table = fixture.nativeElement.querySelector('.records') as HTMLTableElement;
    expect(table.textContent).toContain('Kırtasiye alımı');
    expect(table.textContent).toContain('Mal');
    expect(fixture.nativeElement.textContent).toContain('1 kayıt Drive\'a kaydedilmeyi bekliyor');
  });

  it('kayıt yoksa boş durum mesajı gösterir', () => {
    const fixture = TestBed.createComponent(DocumentsComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Henüz kayıt yok');
  });

  it('yeni kayıt ekler ve kaydı listeye yazar', () => {
    const fixture = TestBed.createComponent(DocumentsComponent);
    fixture.detectChanges();

    clickButton(fixture, 'Yeni kayıt');
    fixture.detectChanges();

    setValue(fixture, '#isinAdi', 'Yazılım geliştirme');
    setValue(fixture, '#turu', 'hizmet');
    setValue(fixture, '#alimTarihi', '2026-02-10');
    setValue(fixture, '#usulu', 'ihale');
    fixture.detectChanges();
    setValue(fixture, '#ihaleUsulu', 'acikIhale');

    clickButton(fixture, 'Kaydet');
    fixture.detectChanges();

    const table = fixture.nativeElement.querySelector('.records') as HTMLTableElement;
    expect(table.textContent).toContain('Yazılım geliştirme');
    expect(table.textContent).toContain('Açık İhale');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')).toHaveLength(1);
  });

  it('eksik alanlarda şema doğrulaması hatası gösterir', () => {
    const fixture = TestBed.createComponent(DocumentsComponent);
    fixture.detectChanges();

    clickButton(fixture, 'Yeni kayıt');
    fixture.detectChanges();
    clickButton(fixture, 'Kaydet');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.field-error').length).toBeGreaterThan(0);
    expect(fixture.nativeElement.textContent).toContain('İşin adı zorunludur');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('düzenle akışı seçim modalı açar ve kaydı güncellenir', () => {
    seed([sample]);
    const fixture = TestBed.createComponent(DocumentsComponent);
    fixture.detectChanges();

    clickButton(fixture, 'Düzenle');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Düzenlenecek kaydı seçin');

    const radio = fixture.nativeElement.querySelector('input[type="radio"]') as HTMLInputElement;
    radio.click();
    radio.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    clickButton(fixture, 'Seçili kaydı düzenle');
    fixture.detectChanges();

    const nameInput = fixture.nativeElement.querySelector('#isinAdi') as HTMLInputElement;
    expect(nameInput.value).toBe('Kırtasiye alımı');

    setValue(fixture, '#isinAdi', 'Kırtasiye alımı (güncel)');
    clickButton(fixture, 'Kaydet');
    fixture.detectChanges();

    const table = fixture.nativeElement.querySelector('.records') as HTMLTableElement;
    expect(table.textContent).toContain('Kırtasiye alımı (güncel)');
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].isinAdi).toBe('Kırtasiye alımı (güncel)');
  });

  it('sil akışı seçilen kaydı kaldırır', () => {
    seed([sample]);
    const fixture = TestBed.createComponent(DocumentsComponent);
    fixture.detectChanges();

    clickButton(fixture, 'Sil');
    fixture.detectChanges();

    const radio = fixture.nativeElement.querySelector('input[type="radio"]') as HTMLInputElement;
    radio.click();
    radio.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    clickButton(fixture, 'Seçili kaydı sil');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Kayıt silindi');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('[]');
  });

  it('Drive kaydet bekleyen kayıtları gönderir ve işaretler', async () => {
    seed([sample]);
    driveStub.isLinked.set(true);
    const fixture = TestBed.createComponent(DocumentsComponent);
    fixture.detectChanges();

    clickButton(fixture, 'Drive\'a Kaydet');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(driveStub.saveDocumentsToSheet).toHaveBeenCalledTimes(1);
    const call = driveStub.saveDocumentsToSheet.mock.calls[0]?.[0];
    expect(call?.header).toContain('İşin Adı');
    expect(call?.rows).toHaveLength(1);
    expect(call?.rows[0][0]).toMatch(/^REC-\d{6}$/);
    expect(call?.rows[0][1]).toBe('Kırtasiye alımı');

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    expect(stored[0].exportedAt).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('tablosuna eklendi');
  });

  it('kayıt yokken Drive kaydet butonu kapalıdır', () => {
    const fixture = TestBed.createComponent(DocumentsComponent);
    fixture.detectChanges();

    const button = clickButton(fixture, 'Drive\'a Kaydet');
    expect(button.disabled).toBe(true);
    expect(driveStub.saveDocumentsToSheet).not.toHaveBeenCalled();
  });

  it('Drive bağlantısı açıkken modül açılışında satırlar otomatik listeye eklenir', async () => {
    seed([sample]);
    driveStub.isLinked.set(true);
    driveStub.loadSheetRows.mockResolvedValue([
      ['Kırtasiye alımı', 'Mal', 'Diğer', '', '2026-01-15', ''],
      ['Yazılım geliştirme', 'Hizmet', 'İhale', 'Açık İhale', '2026-03-02', 'Açıklama metni'],
    ]);
    const fixture = TestBed.createComponent(DocumentsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(driveStub.loadSheetRows).toHaveBeenCalledTimes(1);
    const table = fixture.nativeElement.querySelector('.records') as HTMLTableElement;
    expect(table.textContent).toContain('Yazılım geliştirme');
    expect(table.textContent).toContain('Açık İhale');
    expect(fixture.nativeElement.textContent).toContain('Drive\'dan 1 kayıt eklendi');

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    expect(stored).toHaveLength(2);
    expect(stored[1].source).toBe('drive');
  });

  it('Drive bağlantısı kapalıyken modül açılışında otomatik yükleme yapılmaz', async () => {
    seed([sample]);
    driveStub.loadSheetRows.mockResolvedValue([
      ['Arıza bakımı', 'Yapım', 'Doğrudan Temin', 'Doğrudan Temin - 22B', '2026-05-20', ''],
    ]);
    const fixture = TestBed.createComponent(DocumentsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(driveStub.loadSheetRows).not.toHaveBeenCalled();
    expect(driveStub.connect).not.toHaveBeenCalled();
  });

  it('Drive\'dan Yükle bağlantı kapalıyken bağlantı kurup satırları listeye ekler', async () => {
    seed([]);
    driveStub.connect.mockImplementation(async () => {
      driveStub.isLinked.set(true);
    });
    driveStub.loadSheetRows.mockResolvedValue([
      ['Yazılım geliştirme', 'Hizmet', 'İhale', 'Açık İhale', '2026-03-02', 'Açıklama metni'],
    ]);
    const fixture = TestBed.createComponent(DocumentsComponent);
    fixture.detectChanges();

    clickButton(fixture, 'Drive\'dan Yükle');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(driveStub.connect).toHaveBeenCalledTimes(1);
    expect(driveStub.loadSheetRows).toHaveBeenCalledTimes(1);
    const table = fixture.nativeElement.querySelector('.records') as HTMLTableElement;
    expect(table.textContent).toContain('Yazılım geliştirme');
    expect(fixture.nativeElement.textContent).toContain('Drive\'dan 1 kayıt eklendi');
  });

  it('Drive\'dan Yükle yinilenen satırları atlar', async () => {
    seed([sample]);
    driveStub.isLinked.set(true);
    driveStub.loadSheetRows.mockResolvedValue([
      ['Kırtasiye alımı', 'Mal', 'Diğer', '', '2026-01-15', ''],
    ]);
    const fixture = TestBed.createComponent(DocumentsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Drive kayıtları zaten listede');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')).toHaveLength(1);
  });
});
