import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { AuthService } from '../../../core/auth.service';
import { ErrorLogger } from '../../../core/error-logger';
import {
  DOCUMENTS_SHEET_NAME,
  GoogleDriveService,
  toDriveErrorMessage,
} from '../../../core/google-drive.service';
import {
  DOCUMENT_SHEET_HEADERS,
  DocumentRecord,
  createRecordId,
  createRecordNumber,
  mergeSheetRecords,
  sortRecords,
  toSheetRow,
  validateDocumentRecord,
} from './document-record';

const STORAGE_KEY = 'tahakkuk.documents.v1';

@Injectable({ providedIn: 'root' })
export class DocumentsService {
  private readonly auth = inject(AuthService);
  private readonly logger = inject(ErrorLogger);
  readonly drive = inject(GoogleDriveService);
  private readonly recordsSignal = signal<DocumentRecord[]>(this.load());
  private readonly hadUser = signal(false);
  private readonly pendingMirror = signal(false);
  private mirroring = false;

  readonly records = this.recordsSignal.asReadonly();
  readonly syncError = signal('');

  constructor() {
    // Yalnızca giriş yapılmışken oturum kapanırsa kayıtlar temizlenir; misafir kullanımında
    // (hiç giriş yapılmamışken) kayıtlar korunur.
    effect(() => {
      const user = this.auth.user();
      if (!user && this.hadUser()) {
        this.recordsSignal.set([]);
      }
      this.hadUser.set(user !== null);
    });

    // Kayıtlar değiştiğinde ve Drive bağlıysa "dosyalar" tablosu baştan yazılır:
    // başlık satırı + DOSYA ID'li tüm satırlar. Manuel kaydet/yükle adımı yoktur.
    effect(() => {
      const records = this.recordsSignal();
      const ready =
        this.drive.isLinked() && this.drive.hasSessionToken() && this.pendingMirror();
      if (!ready) {
        return;
      }
      untracked(() => this.mirrorToDrive(records));
    });
  }

  add(input: Omit<DocumentRecord, 'id' | 'exportedAt'>): Record<string, string> {
    const errors = validateDocumentRecord(input);
    if (Object.keys(errors).length > 0) {
      return errors;
    }

    const current = this.recordsSignal();
    const record: DocumentRecord = {
      ...input,
      id: createRecordId(),
      recordNumber: createRecordNumber(current),
    };
    this.recordsSignal.set(sortRecords([...current, record]));
    this.pendingMirror.set(true);
    this.persist();
    return {};
  }

  update(record: DocumentRecord): Record<string, string> {
    const errors = validateDocumentRecord(record);
    if (Object.keys(errors).length > 0) {
      return errors;
    }

    this.recordsSignal.set(
      sortRecords(this.recordsSignal().map((item) => (item.id === record.id ? record : item))),
    );
    this.pendingMirror.set(true);
    this.persist();
    return {};
  }

  remove(id: string): void {
    this.recordsSignal.update((records) => records.filter((record) => record.id !== id));
    this.pendingMirror.set(true);
    this.persist();
  }

  find(id: string): DocumentRecord | undefined {
    return this.recordsSignal().find((record) => record.id === id);
  }

  // Drive'dan okunan kayıtları listeye ekler (yinelenenler atlanır); eklenen sayıyı döner.
  mergeLoaded(loaded: DocumentRecord[]): number {
    if (loaded.length === 0) {
      return 0;
    }

    const merged = mergeSheetRecords(this.recordsSignal(), loaded);
    this.recordsSignal.set(this.assignMissingNumbers(merged.records));
    this.persist();
    return merged.added;
  }

  // Bir sonraki yazma turu için tabloyu yeniden yazmayı ister (ör. modül açılışındaki
  // otomatik yükleme sonrası başlık satırının tabloya yazılması için).
  requestMirror(): void {
    this.pendingMirror.set(true);
  }

  // Numarasız eski kayıtlara artan sıra no atar (tablo her zaman numaralı yazılsın diye).
  private assignMissingNumbers(records: DocumentRecord[]): DocumentRecord[] {
    const working = [...records];
    let changed = false;
    for (let index = 0; index < working.length; index += 1) {
      const record = working[index];
      if (record.recordNumber) {
        continue;
      }
      working[index] = { ...record, recordNumber: createRecordNumber(working) };
      changed = true;
    }
    return changed ? sortRecords(working) : sortRecords(records);
  }

  private async mirrorToDrive(records: DocumentRecord[]): Promise<void> {
    if (this.mirroring) {
      // Yazma sürerken yeni değişiklik geldi: bitince tekrar yazılması için beklet.
      this.pendingMirror.set(true);
      return;
    }
    this.mirroring = true;
    this.pendingMirror.set(false);

    try {
      // Yazma anındaki zaman damgası kayıtlara da işlenir; satırlar tabloyla tutarlı olur.
      const stamp = new Date().toISOString();
      const exported = records.map((record) =>
        record.exportedAt ? record : { ...record, exportedAt: stamp },
      );
      this.recordsSignal.set(sortRecords(exported));
      this.persist();

      await this.drive.writeSheet(
        DOCUMENTS_SHEET_NAME,
        [...DOCUMENT_SHEET_HEADERS],
        exported.map((record) => toSheetRow(record)),
      );
      this.syncError.set('');
    } catch (error) {
      this.logger.error('Drive "dosyalar" tablosuna yazma başarısız', error);
      this.syncError.set(toDriveErrorMessage(error));
    } finally {
      this.mirroring = false;
    }
  }

  private load(): DocumentRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw) as DocumentRecord[];
      return Array.isArray(parsed)
        ? this.assignMissingNumbers(parsed.filter((record) => Boolean(record?.id)))
        : [];
    } catch (error) {
      this.logger.warn('Kayıtlar okunamadı, boş liste kullanılıyor', error);
      return [];
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.recordsSignal()));
    } catch (error) {
      // Depolama kapali olabilir; kayitlar yalnizca bellekte tutulur.
      this.logger.error('Kayıtlar localStorage\'a yazılamadı', error);
    }
  }
}