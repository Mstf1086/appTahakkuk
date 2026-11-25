import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { ErrorLogger } from './error-logger';

export type DriveLinkStatus = 'disconnected' | 'connecting' | 'linked' | 'error';

export interface DriveLinkInfo {
  uid: string;
  email: string;
  folderName: string;
  folderId: string;
  folderUrl: string;
  connectedAt: string;
}

const STORAGE_KEY = 'tahakkuk.driveLink';
const FOLDER_NAME = 'tahakkuk.web.app';
export const DOCUMENTS_SHEET_NAME = 'dosyalar';
export const CONTRACTS_SHEET_NAME = 'sözleşmeler';
const SHEET_MIME_TYPE = 'application/vnd.google-apps.spreadsheet';
const CONSENT_TOKEN_TIMEOUT = 45000;
const SILENT_TOKEN_TIMEOUT = 15000;
const GIS_SCRIPT = 'https://accounts.google.com/gsi/client';
const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'email',
  'profile',
].join(' ');

interface GoogleAccounts {
  accounts?: {
    oauth2?: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        login_hint?: string;
        callback: (response: { access_token?: string; error?: string }) => void;
      }) => { requestAccessToken: (overrides?: { prompt?: string }) => void };
    };
  };
}

declare global {
  interface Window {
    google?: GoogleAccounts;
  }
}

// İlk satır başlık satırıysa okurken atlanır (hücreler boşluktan arındırılmış karşılaştırılır).
function isHeaderRow(row: string[] | undefined, header: string[]): boolean {
  if (!row || row.length !== header.length) {
    return false;
  }
  return header.every((cell, index) => cell === row[index]);
}

@Injectable({ providedIn: 'root' })
export class GoogleDriveService {
  private readonly auth: AuthService;
  private readonly statusSignal = signal<DriveLinkStatus>('disconnected');
  private readonly busySignal = signal(false);
  private readonly errorSignal = signal('');
  // Erişim token'ı yalnızca bellekte tutulur, kalıcı saklanmaz. Sinyal olması
  // "oturum hazır" bilgisinin şablonda anında güncellenmesini sağlar.
  private readonly accessTokenSignal = signal<string | null>(null);
  private readonly infoSignal = signal<DriveLinkInfo | null>(null);

  readonly isConfigured = Boolean(environment.google.clientId);
  readonly status = this.statusSignal.asReadonly();
  readonly busy = this.busySignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly info = this.infoSignal.asReadonly();
  readonly isLinked = computed(
    () => this.status() === 'linked' && this.infoSignal() !== null,
  );
  readonly hasSessionToken = computed(() => this.accessTokenSignal() !== null);

  constructor(auth: AuthService, private readonly logger: ErrorLogger) {
    this.auth = auth;
    void auth.waitForAuthState().then(() => this.restore());
    // Oturum kapandığında bellek içi token düşürülür; bağlantı bilgisi (localStorage)
    // bilinçli olarak korunur: kullanıcı yeniden giriş yaptığında bağlantı yeniden
    // kurulmadan kaldığı yerden devam edebilir (connect() olmadan).
    effect(() => {
      if (!this.auth.user()) {
        this.accessTokenSignal.set(null);
        this.statusSignal.set('disconnected');
        this.errorSignal.set('');
        this.infoSignal.set(null);
      }
    });
  }

  async connect(): Promise<void> {
    const user = this.auth.user();
    if (!user) {
      this.statusSignal.set('error');
      this.errorSignal.set('Google Drive bağlamak için önce giriş yapın.');
      return;
    }
    if (!this.isConfigured || this.busySignal()) {
      if (!this.isConfigured) {
        this.statusSignal.set('error');
        this.errorSignal.set('Google OAuth istemci kimliği yapılandırılmamış (VITE_GOOGLE_CLIENT_ID).');
      }
      return;
    }

    this.busySignal.set(true);
    this.errorSignal.set('');
    this.statusSignal.set('connecting');

    try {
      const token = await this.requestToken();
      this.accessTokenSignal.set(token);
      const account = await this.fetchAccount(token);

      if (!account.email) {
        throw new Error('USERINFO_ERROR');
      }

      const folder = await this.ensureFolder(token);

      const info: DriveLinkInfo = {
        uid: user.uid,
        email: account.email,
        folderName: FOLDER_NAME,
        folderId: folder.id,
        folderUrl: folder.webViewLink,
        connectedAt: new Date().toISOString(),
      };

      this.infoSignal.set(info);
      this.statusSignal.set('linked');
      // Bağlantı bilgisi oturum boyunca (sekmeler arası ve sayfa yenilemede) açık kalsın diye
      // localStorage'da tutulur; çıkışta AuthService tarafından silinir. Token saklanmaz.
      localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
    } catch (error) {
      this.logger.error('Drive bağlantısı kurulamadı', error);
      this.statusSignal.set('error');
      this.errorSignal.set(toDriveErrorMessage(error));
    } finally {
      this.busySignal.set(false);
    }
  }

  disconnect(): void {
    this.accessTokenSignal.set(null);
    localStorage.removeItem(STORAGE_KEY);
    this.infoSignal.set(null);
    this.errorSignal.set('');
    this.statusSignal.set('disconnected');
  }

  private restore(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    try {
      const info = JSON.parse(raw) as DriveLinkInfo;
      if (info.uid && this.auth.user()?.uid === info.uid) {
        this.infoSignal.set(info);
        this.statusSignal.set('linked');
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      this.logger.warn('Drive bağlantı bilgisi bozuk, temizlendi', error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  // Oturum açıldığında çağrılır: bağlantı kaydı varsa izni sessizce yeniler (her seferinde
  // Google penceresi açılmaz), kayıt yoksa ilk kez için etkileşimli bağlantı kurar.
  async connectAfterSignIn(): Promise<void> {
    const user = this.auth.user();
    if (!user || this.busySignal() || this.accessTokenSignal() !== null) {
      return;
    }
    await this.auth.waitForAuthState();
    if (this.auth.user()?.uid !== user.uid) {
      return;
    }
    if (this.restoreStoredLink(user.uid)) {
      // Kayıt var: yalnızca bellek içi token'ı sessizce yenilemeyi dener.
      if (await this.silentConnect()) {
        return;
      }
    }
    await this.connect();
  }

  private restoreStoredLink(uid: string): boolean {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return false;
    }
    try {
      const info = JSON.parse(raw) as DriveLinkInfo;
      if (info.uid === uid && info.folderId) {
        this.infoSignal.set(info);
        this.statusSignal.set('linked');
        return true;
      }
    } catch (error) {
      this.logger.warn('Drive bağlantı bilgisi bozuk, temizlendi', error);
      localStorage.removeItem(STORAGE_KEY);
    }
    return false;
  }

  // Sayfa yenilemeden sonra bellek içi token kaybolduğunda, kullanıcıya bir şey
  // sormadan daha önce verilen izinle (prompt: 'none') sessizce yeni token alınmasını
  // dener. Başarılıysa true döner; izin yoksa ya da zaman aşımına uğrarsa arayüz
  // değişmeden false döner.
  async silentConnect(): Promise<boolean> {
    if (this.accessTokenSignal() !== null) {
      return true;
    }
    if (!this.isLinked() || !this.isConfigured || this.busySignal()) {
      return false;
    }

    try {
      this.accessTokenSignal.set(await this.requestToken('none'));
      return true;
    } catch (error) {
      this.logger.warn('Sessiz Drive token yenileme başarısız', error);
      this.accessTokenSignal.set(null);
      return false;
    }
  }

  // login_hint verilmez: kullanıcı Google penceresinde serbestçe hesap seçer veya
  // "hesap oluştur" ile yeni bir Google hesabı açar; Firebase e-postasıyla uyuşması
  // beklenmez. 'none' sessiz yenilemedir: arayüz açılmaz, izin yoksa hata döner.
  private async requestToken(prompt: 'consent' | 'none' = 'consent'): Promise<string> {
    await this.loadGisScript();

    return new Promise<string>((resolve, reject) => {
      let settled = false;

      const settle = (action: () => void) => {
        if (settled) {
          return;
        }
        settled = true;
        window.clearTimeout(timeout);
        action();
      };

      // Yetkilendirme penceresi yanıt vermezse (pop-up engellendi, pencere kapatıldı,
      // orijin Cloud Console'da kayıtlı değil) GIS callback'i tetiklenmeyebilir.
      // Aşağıdaki zaman aşımı durumun "Bağlanıyor..." şeklinde asılı kalmasını engeller.
      // 'none' sessiz yenileme beklenmez: uzun yetkilendirme zaman aşımını beklememek
      // için kısa süre verilir.
      const timeout = window.setTimeout(
        () => {
          settle(() => reject(new Error('TOKEN_WAIT_TIMEOUT')));
        },
        prompt === 'none' ? SILENT_TOKEN_TIMEOUT : CONSENT_TOKEN_TIMEOUT,
      );

      const tokenClient = window.google?.accounts?.oauth2?.initTokenClient({
        client_id: environment.google.clientId,
        scope: SCOPES,
        callback: (response) => {
          settle(() => {
            if (response.access_token) {
              resolve(response.access_token);
            } else {
              reject(new Error(response.error || 'TOKEN_ERROR'));
            }
          });
        },
      });

      if (!tokenClient) {
        settle(() => reject(new Error('GIS_NOT_READY')));
        return;
      }

      try {
        tokenClient.requestAccessToken({ prompt });
      } catch (error) {
        settle(() => reject(error instanceof Error ? error : new Error('TOKEN_START_ERROR')));
      }
    });
  }

  // Sayfada duran script ölü bir yüklemeden kalmış olabilir (error/hesaplanamaz
  // içerik): aralıklarla yeniden deneriz, en son denemede zaman aşımı olursa
  // script'i sayfadan söküp temiz bir yükleme yaparız.
  private loadGisScript(): Promise<void> {
    if (window.google?.accounts?.oauth2) {
      return Promise.resolve();
    }

    const attempt = (removeExisting: boolean): Promise<void> =>
      new Promise<void>((resolve, reject) => {
        const poll = window.setInterval(() => {
          if (window.google?.accounts?.oauth2) {
            window.clearInterval(poll);
            window.clearTimeout(timeout);
            resolve();
          }
        }, 100);

        const timeout = window.setTimeout(() => {
          window.clearInterval(poll);
          reject(new Error('GIS_TIMEOUT'));
        }, 20000);

        if (removeExisting) {
          document
            .querySelectorAll<HTMLScriptElement>(`script[src="${GIS_SCRIPT}"]`)
            .forEach((element) => element.remove());
        }

        const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SCRIPT}"]`);
        if (existing) {
          return;
        }

        const script = document.createElement('script');
        script.src = GIS_SCRIPT;
        script.async = true;
        script.addEventListener(
          'error',
          () => {
            window.clearInterval(poll);
            window.clearTimeout(timeout);
            reject(new Error('GIS_SCRIPT_ERROR'));
          },
          { once: true },
        );
        document.head.appendChild(script);
      });

    return attempt(false).catch((firstError) => {
      this.logger.warn('GIS script ilk yükleme denemesi başarısız', firstError);
      return attempt(true);
    });
  }

  private async fetchAccount(token: string): Promise<{ email: string }> {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error('USERINFO_ERROR');
    }
    const data = (await response.json()) as { email?: string };
    return { email: data.email ?? '' };
  }

  private async ensureFolder(token: string): Promise<{ id: string; webViewLink: string }> {
    const query = encodeURIComponent(
      `name = '${FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    );
    const list = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,webViewLink)&pageSize=1`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!list.ok) {
      throw new Error('FOLDER_LOOKUP_ERROR');
    }

    const data = (await list.json()) as {
      files?: { id: string; webViewLink?: string }[];
    };
    const existing = data.files?.[0];
    if (existing) {
      return {
        id: existing.id,
        webViewLink: existing.webViewLink ?? `https://drive.google.com/drive/folders/${existing.id}`,
      };
    }

    const create = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,webViewLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    if (!create.ok) {
      throw new Error('FOLDER_CREATE_ERROR');
    }

    const created = (await create.json()) as { id: string; webViewLink?: string };
    return {
      id: created.id,
      webViewLink: created.webViewLink ?? `https://drive.google.com/drive/folders/${created.id}`,
    };
  }

  // "dosyalar"/"sözleşmeler" tablosunu (Google Sheets) bulur, yoksa tahakkuk.web.app
  // klasörü içinde oluşturur; başlık satırı ve tüm satırları baştan yazar. Böylece
  // ekleme/düzenleme/silme işlemleri tabloya birebir yansır.
  async writeSheet(sheetName: string, header: string[], rows: string[][]): Promise<void> {
    const token = await this.resolveSheetToken();
    const folder = await this.ensureFolder(token);
    const sheet = await this.findOrCreateSheet(token, folder.id, sheetName);

    // Önce mevcut içerik temizlenir; yoksa silinen satırlar tabloda geride kalır.
    await this.clearSheetValues(token, sheet.id);

    const padded = rows.map((row) => [
      ...row,
      ...new Array(Math.max(0, header.length - row.length)).fill(''),
    ]);
    const values = [header, ...padded];
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheet.id}/values/A1?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ range: 'A1', majorDimension: 'ROWS', values }),
      },
    );
    if (!response.ok) {
      throw new Error(await this.sheetErrorCode(response, 'SHEET_WRITE_ERROR'));
    }
  }

  private async clearSheetValues(token: string, spreadsheetId: string): Promise<void> {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A:ZZ:clear`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      },
    );
    if (!response.ok) {
      throw new Error(await this.sheetErrorCode(response, 'SHEET_CLEAR_ERROR'));
    }
  }

  // Tablo okuma/yazma öncesi token: bellekte varsa kullanılır; yoksa sessizce
  // yenilenir. Sessiz yenileme de olmazsa çağıran anlamlı bir hata kodu alır ve
  // kullanıcıyı yeniden bağlanmaya yönlendirir.
  private async resolveSheetToken(): Promise<string> {
    const current = this.accessTokenSignal();
    if (current !== null) {
      return current;
    }
    if (await this.silentConnect()) {
      return this.accessTokenSignal() as string;
    }
    throw new Error('SESSION_TOKEN_REQUIRED');
  }

  // "dosyalar" tablosundaki veri satırlarını okur. Aralık açık uçlu yazılır: A1 notasyonunda
  // "A1" tek bir hücreye karşılık geldiği için sekmeli aralık kullanılır. İlk satır başlık
  // satırıysa atlanır; tablo yoksa boş dizi döner.
  async loadSheetRows(sheetName: string, header: string[] = []): Promise<string[][]> {
    const token = await this.resolveSheetToken();
    const folder = await this.ensureFolder(token);
    const sheet = await this.findSheet(token, folder.id, sheetName);
    if (!sheet) {
      return [];
    }

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheet.id}/values/A:ZZ?majorDimension=ROWS`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!response.ok) {
      throw new Error(await this.sheetErrorCode(response, 'SHEET_READ_ERROR'));
    }

    const data = (await response.json()) as { values?: string[][] };
    const rows = (data.values ?? []).map((row) => row.map((cell) => (cell ?? '').trim()));
    return isHeaderRow(rows[0], header) ? rows.slice(1) : rows;
  }

  private async findSheet(
    token: string,
    folderId: string,
    sheetName: string,
  ): Promise<{ id: string; webViewLink: string } | null> {
    const query = encodeURIComponent(
      `name = '${sheetName}' and mimeType = '${SHEET_MIME_TYPE}' and trashed = false and '${folderId}' in parents`,
    );
    const found = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,webViewLink)&pageSize=1`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!found.ok) {
      throw new Error('SHEET_LOOKUP_ERROR');
    }

    const data = (await found.json()) as { files?: { id: string; webViewLink?: string }[] };
    const existing = data.files?.[0];
    if (!existing) {
      return null;
    }
    return {
      id: existing.id,
      webViewLink: existing.webViewLink ?? `https://docs.google.com/spreadsheets/d/${existing.id}`,
    };
  }

  private async findOrCreateSheet(
    token: string,
    folderId: string,
    sheetName: string,
  ): Promise<{ id: string; webViewLink: string; isNew: boolean }> {
    const existing = await this.findSheet(token, folderId, sheetName);
    if (existing) {
      return { ...existing, isNew: false };
    }

    const create = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,webViewLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: sheetName,
        mimeType: SHEET_MIME_TYPE,
        parents: [folderId],
      }),
    });

    if (!create.ok) {
      throw new Error('SHEET_CREATE_ERROR');
    }

    const created = (await create.json()) as { id: string; webViewLink?: string };
    return {
      id: created.id,
      webViewLink: created.webViewLink ?? `https://docs.google.com/spreadsheets/d/${created.id}`,
      isNew: true,
    };
  }

  private async sheetErrorCode(response: Response, fallback: string): Promise<string> {
    try {
      const data = (await response.json()) as { error?: { message?: string; status?: string } };
      const message = data.error?.message ?? data.error?.status ?? '';
      if (/has not been used|is disabled|accessNotConfigured|PERMISSION_DENIED/i.test(message)) {
        return 'SHEET_API_DISABLED';
      }
    } catch (error) {
      // Yanıt gövdesi okunamazsa çağıranın verdiği genel hata kullanılır.
      this.logger.warn('Drive yanıt gövdesi okunamadı', error);
    }
    return fallback;
  }
}

export function toDriveErrorMessage(error: unknown): string {
  const code = error instanceof Error ? error.message : String(error ?? '');
  switch (code) {
    case 'access_denied':
      return 'Google Drive izni geri çekildi. Tekrar deneyin.';
    case 'GIS_NOT_READY':
    case 'TOKEN_WAIT_TIMEOUT':
      return (
        'Google yetkilendirme penceresi yanıt vermedi. Pencere açıldıysa izin verin; açılmadıysa pop-up ' +
        'engelleyicisini kapatın ve Cloud Console → Credentials → Web istemcisi → Authorized JavaScript origins ' +
        'içinde bulunduğunuz adresin (ör. http://localhost:4200) kayıtlı olduğundan emin olun. Google Drive ' +
        "API'nin etkin olduğundan ve OAuth consent ekranında hesabınızın Test users listesinde olduğundan emin olun."
      );
    case 'GIS_SCRIPT_ERROR':
      return (
        'Google Identity Services scripti yüklenemedi. İnternet bağlantınızı ve Google (accounts.google.com) ' +
        'erişimini kontrol edin; bazı ağlar/ISP\'ler bu adresi engeller.'
      );
    case 'GIS_TIMEOUT':
      return (
        'Google Identity Services scripti yüklenemedi (her deneme 20 sn, 2 deneme yapıldı). Sayfayı ' +
        'yenileyip tekrar deneyin; sorun sürerse tarayıcı geliştirici konsolunun Network sekmesinde ' +
        'accounts.google.com isteğinin sonucunu ve ağınızın Google erişimini (VPN/ISP engeli) kontrol edin.'
      );
    case 'FOLDER_LOOKUP_ERROR':
      return (
        'Drive klasörü sorgulanamadı. Ağ bağlantınızı kontrol edip tekrar deneyin; klasör ' +
        'bilinmiyorsa yanlışlıkla ikinci bir klasör oluşturulmaması için işlem durduruldu.'
      );
    case 'FOLDER_CREATE_ERROR':
      return (
        'Google Drive klasörü oluşturulamadı (kod: ' + code + '). Cloud Console → APIs & Services → Library ' +
        'içinde Google Drive API etkin mi kontrol edin ve yetkide drive dosyalarına erişim izni verin.'
      );
    case 'SHEET_NO_ROWS':
      return 'Kaydedilecek kayıt yok.';
    case 'SHEET_CREATE_ERROR':
      return (
        'Drive içinde "dosyalar" tablosu oluşturulamadı. Google Drive API ve Sheets erişimini ' +
        'kontrol edip tekrar deneyin.'
      );
    case 'SHEET_READ_ERROR':
      return (
        'Drive\'daki "dosyalar" tablosu okunamadı. Ağ bağlantınızı kontrol edip tekrar ' +
        'deneyin; sorun sürerse Cloud Console → APIs & Services → Library → "Google Sheets API" ' +
        'etkin mi kontrol edin.'
      );
    case 'SHEET_WRITE_ERROR':
      return (
        'Drive içindeki tabloya yazılamadı. Tablo silinmiş veya erişim kısıtlanmış ' +
        'olabilir; tekrar deneyin.'
      );
    case 'SHEET_CLEAR_ERROR':
      return 'Drive içindeki tablo güncellenemedi (temizleme adımı başarısız). Tekrar deneyin.';
    case 'SHEET_LOOKUP_ERROR':
      return (
        'Drive\'daki "dosyalar" tablosu sorgulanamadı. Ağ bağlantınızı kontrol edip tekrar ' +
        'deneyin; sorgu hatasında tablo bilinmediği için işlem güvenli şekilde durduruldu.'
      );
    case 'SHEET_API_DISABLED':
      return (
        'Google Sheets API bu projede etkin değil. Google Cloud Console → proje tahakkuk-bc03b ' +
        '→ APIs & Services → Library → "Google Sheets API" → Enable yapın, birkaç dakika ' +
        'bekleyip tekrar deneyin. Kod tarafında değişiklik gerekmez.'
      );
    case 'SESSION_TOKEN_REQUIRED':
      return (
        'Google Drive oturum izni sessizce yenilenemedi. Yeniden bağlanmak için ' +
        '"Google Drive\'a bağlan" düğmesini kullanın.'
      );
    case 'USERINFO_ERROR':
      return 'Google hesabı bilgisi alınamadı (kod: ' + code + '). Tekrar deneyin.';
    default:
      return 'Google Drive bağlantısı kurulamadı (kod: ' + (code || 'bilinmiyor') + ').';
  }
}
