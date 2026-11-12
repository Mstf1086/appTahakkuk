import { Injectable, computed, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

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
const GIS_SCRIPT = 'https://accounts.google.com/gsi/client';
const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'email',
  'profile',
].join(' ');

interface GoogleAccounts {
  oauth2?: {
    initTokenClient: (config: {
      client_id: string;
      scope: string;
      callback: (response: { access_token?: string; error?: string }) => void;
    }) => { requestAccessToken: (overrides?: { prompt?: string }) => void };
  };
}

declare global {
  interface Window {
    google?: GoogleAccounts;
  }
}

@Injectable({ providedIn: 'root' })
export class GoogleDriveService {
  private readonly auth: AuthService;
  private readonly statusSignal = signal<DriveLinkStatus>('disconnected');
  private readonly busySignal = signal(false);
  private readonly errorSignal = signal('');

  readonly isConfigured = Boolean(environment.google.clientId);
  readonly status = this.statusSignal.asReadonly();
  readonly busy = this.busySignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly info = signal<DriveLinkInfo | null>(null);
  readonly isLinked = computed(() => this.status() === 'linked' && this.info() !== null);

  constructor(auth: AuthService) {
    this.auth = auth;
    void auth.waitForAuthState().then(() => this.restore());
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
      const account = await this.fetchAccount(token);
      const folder = await this.ensureFolder(token);

      const info: DriveLinkInfo = {
        uid: user.uid,
        email: account.email,
        folderName: FOLDER_NAME,
        folderId: folder.id,
        folderUrl: folder.webViewLink,
        connectedAt: new Date().toISOString(),
      };

      this.info.set(info);
      this.statusSignal.set('linked');
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(info));
    } catch (error) {
      this.statusSignal.set('error');
      this.errorSignal.set(toDriveErrorMessage(error));
    } finally {
      this.busySignal.set(false);
    }
  }

  disconnect(): void {
    sessionStorage.removeItem(STORAGE_KEY);
    this.info.set(null);
    this.errorSignal.set('');
    this.statusSignal.set('disconnected');
  }

  private restore(): void {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    try {
      const info = JSON.parse(raw) as DriveLinkInfo;
      if (info.uid && this.auth.user()?.uid === info.uid) {
        this.info.set(info);
        this.statusSignal.set('linked');
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }

  private async requestToken(): Promise<string> {
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
      // orijin Cloud Console'da kayıtlı değil) GIS callback'i tetiklemeyebilir. Aşağıdaki
      // zaman aşımı durumun "Bağlanıyor..." şeklinde asılı kalmasını engeller.
      const timeout = window.setTimeout(() => {
        settle(() => reject(new Error('TOKEN_WAIT_TIMEOUT')));
      }, 45000);

      const tokenClient = window.google?.oauth2?.initTokenClient({
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
        tokenClient.requestAccessToken({ prompt: 'consent' });
      } catch (error) {
        settle(() => reject(error instanceof Error ? error : new Error('TOKEN_START_ERROR')));
      }
    });
  }

  private loadGisScript(): Promise<void> {
    if (window.google?.oauth2) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const poll = window.setInterval(() => {
        if (window.google?.oauth2) {
          window.clearInterval(poll);
          window.clearTimeout(timeout);
          resolve();
        }
      }, 50);

      const timeout = window.setTimeout(() => {
        window.clearInterval(poll);
        reject(new Error('GIS_TIMEOUT'));
      }, 8000);

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
  }

  private async fetchAccount(token: string): Promise<{ email: string }> {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error('USERINFO_ERROR');
    }
    const data = (await response.json()) as { email?: string };
    return { email: data.email ?? this.auth.user()?.email ?? '' };
  }

  private async ensureFolder(token: string): Promise<{ id: string; webViewLink: string }> {
    const query = encodeURIComponent(
      `name = '${FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    );
    const list = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,webViewLink)&pageSize=1`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (list.ok) {
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
}

function toDriveErrorMessage(error: unknown): string {
  const code = error instanceof Error ? error.message : String(error ?? '');
  switch (code) {
    case 'access_denied':
      return 'Google Drive izni geri çekildi. Tekrar deneyin.';
    case 'GIS_NOT_READY':
    case 'GIS_SCRIPT_ERROR':
    case 'GIS_TIMEOUT':
      return (
        'Google ile yetkilendirme tamamlanmadı (kod: ' + code + '). Tarayıcının pop-up engelleyicisini kapatın; ' +
        'Cloud Console → Credentials → Web istemcisi → Authorized JavaScript origins listesinde bulunduğunuz adres ' +
        '(ör. http://localhost:4200) kayıtlı olmalı.'
      );
    case 'TOKEN_WAIT_TIMEOUT':
      return (
        'Google yetkilendirme penceresi yanıt vermedi. Pencere açıldıysa izin verin; açılmadıysa pop-up ' +
        'engelleyicisini kapatın ve Cloud Console → Credentials → Web istemcisi → Authorized JavaScript origins ' +
        "içinde bulunduğunuz adresin (ör. http://localhost:4200) kayıtlı olduğundan emin olun. Google Drive API'nin " +
        'etkin olduğundan ve OAuth consent ekranının doğru hesabın test kullanıcısı olarak eklendiğinden emin olun.'
      );
    case 'FOLDER_CREATE_ERROR':
      return (
        'Google Drive klasörü oluşturulamadı (kod: ' + code + '). Cloud Console → APIs & Services → Library ' +
        'içinde Google Drive API etkin mi kontrol edin ve yetkide drive dosyalarına erişim izni verin.'
      );
    case 'USERINFO_ERROR':
      return 'Google hesabı bilgisi alınamadı (kod: ' + code + '). Tekrar deneyin.';
    default:
      return 'Google Drive bağlantısı kurulamadı (kod: ' + (code || 'bilinmiyor') + ').';
  }
}
