import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { GoogleDriveService } from './google-drive.service';

const authStub = {
  user: signal<{ uid: string; email: string } | null>({ uid: 'u1', email: 'asd@asd.com' }),
  waitForAuthState: () => Promise.resolve(),
};

const sheetState = { created: false };
let sheetAppendOverride: { ok: boolean; json: () => Promise<unknown> } | null = null;

const folderListResponse = {
  ok: true,
  json: async () => ({
    files: [
      { id: 'folder1', webViewLink: 'https://drive.google.com/drive/folders/folder1' },
    ],
  }),
};

const folderCreateResponse = {
  ok: true,
  json: async () => ({
    id: 'folder1',
    webViewLink: 'https://drive.google.com/drive/folders/folder1',
  }),
};

const sheetCreateResponse = {
  ok: true,
  json: async () => ({ id: 'sheet1', webViewLink: 'https://docs.google.com/spreadsheets/d/sheet1' }),
};

const sheetAppendResponse = { ok: true, json: async () => ({ updates: { updatedRows: 1 } }) };
const sheetReadResponse = {
  ok: true,
  json: async () => ({
    values: [
      ['İşin Adı', 'Türü', 'Usulü', 'Usul Detayı', 'Alım Tarihi', 'Açıklama', 'Kaydedilme Tarihi'],
      ['Kırtasiye alımı', 'Mal', 'Diğer', '', '2026-01-15', '', '2026-11-13T10:00:00.000Z'],
      ['Yazılım geliştirme', 'Hizmet', 'İhale', 'Açık İhale', '2026-03-02', 'Açıklama', ''],
    ],
  }),
};

describe('GoogleDriveService', () => {
  let initTokenClient: ReturnType<typeof vi.fn>;

  const createService = () => {
    const service = TestBed.inject(GoogleDriveService);
    Object.defineProperty(service, 'isConfigured', { value: true });
    return service;
  };

  beforeEach(() => {
    sheetState.created = false;
    sheetAppendOverride = null;
    initTokenClient = vi.fn(
      (config: { callback: (response: { access_token?: string }) => void }) => ({
        requestAccessToken: vi.fn(() => config.callback({ access_token: 'test-token' })),
      }),
    );
    window.google = {
      accounts: { oauth2: { initTokenClient } },
    } as typeof window.google;

    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string | URL, init?: { method?: string; body?: string }) => {
        const target = String(url);
        if (target.includes('oauth2/v3/userinfo')) {
          return { ok: true, json: async () => ({ email: 'drive@gmail.com' }) };
        }
        if (target.includes('sheets.googleapis.com') && init?.method === 'POST') {
          return sheetAppendOverride ?? sheetAppendResponse;
        }
        if (target.includes('sheets.googleapis.com')) {
          return sheetReadResponse;
        }
        const isPost = init?.method === 'POST';
        const body = init?.body ? JSON.parse(init.body) : {};
        if (isPost && body.mimeType === 'application/vnd.google-apps.spreadsheet') {
          sheetState.created = true;
          return sheetCreateResponse;
        }
        if (isPost) {
          return folderCreateResponse;
        }
        if (target.includes('dosyalar')) {
          return {
            ok: true,
            json: async () => ({
              files: sheetState.created ? [{ id: 'sheet1' }] : [],
            }),
          };
        }
        return folderListResponse;
      }),
    );

    TestBed.configureTestingModule({
      providers: [GoogleDriveService, { provide: AuthService, useValue: authStub }],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    localStorage.clear();
    document
      .querySelectorAll<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]')
      .forEach((element) => element.remove());
    Reflect.deleteProperty(window, 'google');
  });

  it('GIS API yüklüyken Drive bağlantısı token istemcisiyle kurulur', async () => {
    const service = createService();

    await service.connect();

    expect(initTokenClient).toHaveBeenCalledWith(
      expect.objectContaining({ client_id: environment.google.clientId }),
    );
    expect(service.status()).toBe('linked');
    expect(service.info()?.email).toBe('drive@gmail.com');
  });

  it('GIS API yüklenmezse zaman aşımı hatası verir', async () => {
    Reflect.deleteProperty(window, 'google');
    vi.useFakeTimers();
    const service = createService();

    const pending = service.connect();
    await vi.advanceTimersByTimeAsync(45000);
    await pending;

    expect(service.status()).toBe('error');
    expect(service.error()).toContain('Google Identity Services scripti');
  });

  it('oturum kapandığında bağlantı bilgisi ve localStorage temizlenir', async () => {
    const service = createService();

    await service.connect();
    expect(service.status()).toBe('linked');
    expect(localStorage.getItem('tahakkuk.driveLink')).toBeTruthy();

    authStub.user.set(null);
    TestBed.inject(ApplicationRef).tick();

    expect(service.status()).toBe('disconnected');
    expect(service.info()).toBeNull();
    expect(localStorage.getItem('tahakkuk.driveLink')).toBeNull();
  });

  it('sayfa yenilendiğinde bağlantı localStorage üzerinden geri yüklenir', async () => {
    authStub.user.set({ uid: 'u1', email: 'asd@asd.com' });
    localStorage.setItem(
      'tahakkuk.driveLink',
      JSON.stringify({
        uid: 'u1',
        email: 'drive@gmail.com',
        folderName: 'tahakkuk.web.app',
        folderId: 'folder1',
        folderUrl: 'https://drive.google.com/drive/folders/folder1',
        connectedAt: '2026-11-12T10:00:00.000Z',
      }),
    );

    const service = createService();
    TestBed.inject(ApplicationRef).tick();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(service.status()).toBe('linked');
    expect(service.info()?.email).toBe('drive@gmail.com');
  });

  it('sayfa yenilemesi sonrası link varken loadSheetRows sessizce token yeniler', async () => {
    localStorage.setItem(
      'tahakkuk.driveLink',
      JSON.stringify({
        uid: 'u1',
        email: 'drive@gmail.com',
        folderName: 'tahakkuk.web.app',
        folderId: 'folder1',
        folderUrl: 'https://drive.google.com/drive/folders/folder1',
        connectedAt: '2026-11-12T10:00:00.000Z',
      }),
    );
    const promptSpy = vi.fn();
    initTokenClient.mockImplementationOnce(
      (config: { callback: (response: { access_token?: string }) => void }) => ({
        requestAccessToken: vi.fn((overrides?: { prompt?: string }) => {
          promptSpy(overrides?.prompt);
          config.callback({ access_token: 'test-token' });
        }),
      }),
    );

    const service = createService();
    TestBed.inject(ApplicationRef).tick();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(service.status()).toBe('linked');
    expect(service.hasSessionToken()).toBe(false);

    sheetState.created = true;
    const rows = await service.loadSheetRows([
      'İşin Adı',
      'Türü',
      'Usulü',
      'Usul Detayı',
      'Alım Tarihi',
      'Açıklama',
      'Kaydedilme Tarihi',
    ]);

    expect(promptSpy).toHaveBeenCalledWith('none');
    expect(service.hasSessionToken()).toBe(true);
    expect(rows).toHaveLength(2);
  });

  it('Drive linki yokken loadSheetRows SESSION_TOKEN_REQUIRED hatası verir', async () => {
    const service = createService();
    sheetState.created = true;

    await expect(service.loadSheetRows(['İşin Adı'])).rejects.toThrow('SESSION_TOKEN_REQUIRED');
    expect(service.status()).toBe('disconnected');
  });

  it('Sheets API kapalıysa anlaşılır hata kodu üretir', async () => {
    const service = createService();
    await service.connect();

    sheetAppendOverride = {
      ok: false,
      json: async () => ({
        error: {
          code: 403,
          message:
            'Google Sheets API has not been used in project 55867773573 before or it is disabled.',
          status: 'PERMISSION_DENIED',
        },
      }),
    } as unknown as { ok: boolean; json: () => Promise<unknown> };

    await expect(
      service.saveDocumentsToSheet({
        header: ['İşin Adı'],
        rows: [['Kırtasiye alımı']],
      }),
    ).rejects.toThrow('SHEET_API_DISABLED');
  });

  it('tahakkuk.web.app klasörü varsa tekrar oluşturulmaz', async () => {
    const service = createService();

    await service.connect();

    const folderCreates = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.filter(
      ([, init]) =>
        init?.method === 'POST' &&
        !String(init?.body ?? '').includes('application/vnd.google-apps.spreadsheet'),
    );
    expect(folderCreates).toHaveLength(0);
  });

  it('dosyalar tablosunun tamamını okur ve başlık satırını atlar', async () => {
    const service = createService();
    await service.connect();
    await service.saveDocumentsToSheet({
      header: ['İşin Adı', 'Türü'],
      rows: [['Kırtasiye alımı', 'Mal']],
    });

    const rows = await service.loadSheetRows([
      'İşin Adı',
      'Türü',
      'Usulü',
      'Usul Detayı',
      'Alım Tarihi',
      'Açıklama',
      'Kaydedilme Tarihi',
    ]);

    expect(rows).toEqual([
      ['Kırtasiye alımı', 'Mal', 'Diğer', '', '2026-01-15', '', '2026-11-13T10:00:00.000Z'],
      ['Yazılım geliştirme', 'Hizmet', 'İhale', 'Açık İhale', '2026-03-02', 'Açıklama', ''],
    ]);

    const readCall = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.find(([url, init]) =>
      String(url).includes('/values/A:ZZ') && !init?.method,
    );
    expect(String(readCall?.[0])).toContain('sheets.googleapis.com/v4/spreadsheets/sheet1/values/A:ZZ');
    expect(String(readCall?.[0])).toContain('majorDimension=ROWS');
  });

  it('tablo yoksa boş dizi döner', async () => {
    const service = createService();
    await service.connect();

    sheetState.created = false;
    const rows = await service.loadSheetRows(['İşin Adı']);

    expect(rows).toEqual([]);
  });

  it('dosyalar tablosu yoksa oluşturulur, sonraki kaydetmede başlık yazılmaz', async () => {
    const service = createService();
    await service.connect();

    const first = await service.saveDocumentsToSheet({
      header: ['İşin Adı', 'Türü'],
      rows: [['Kırtasiye alımı', 'Mal']],
    });
    expect(first.spreadsheetId).toBe('sheet1');

    const appendCalls = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.filter(([url]) =>
      String(url).includes('sheets.googleapis.com'),
    );
    expect(appendCalls).toHaveLength(1);
    const firstBody = JSON.parse(appendCalls[0][1].body as string) as { values: string[][] };
    expect(firstBody.values).toEqual([
      ['İşin Adı', 'Türü'],
      ['Kırtasiye alımı', 'Mal'],
    ]);

    const second = await service.saveDocumentsToSheet({
      header: ['İşin Adı', 'Türü'],
      rows: [['Yazılım geliştirme', 'Hizmet']],
    });
    expect(second.spreadsheetId).toBe('sheet1');

    const allAppendCalls = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.filter(([url]) =>
      String(url).includes('sheets.googleapis.com'),
    );
    expect(allAppendCalls).toHaveLength(2);
    const secondBody = JSON.parse(allAppendCalls[1][1].body as string) as { values: string[][] };
    expect(secondBody.values).toEqual([['Yazılım geliştirme', 'Hizmet']]);

    const createCalls = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.filter(
      ([, init]) => String(init?.body ?? '').includes('spreadsheet'),
    );
    expect(createCalls).toHaveLength(1);
  });
});
