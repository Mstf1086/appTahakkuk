import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/auth.service';
import { ErrorLogger } from '../../../core/error-logger';
import { DocumentRecord, createRecordId, mergeSheetRecords, validateDocumentRecord } from './document-record';

const STORAGE_KEY = 'tahakkuk.documents.v1';

@Injectable({ providedIn: 'root' })
export class DocumentsService {
  private readonly auth = inject(AuthService);
  private readonly logger = inject(ErrorLogger);
  private readonly recordsSignal = signal<DocumentRecord[]>(this.load());
  private readonly hadUser = signal(false);

  readonly records = this.recordsSignal.asReadonly();
  readonly pendingExportCount = computed(() => this.records().filter((r) => !r.exportedAt).length);

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
  }

  add(input: Omit<DocumentRecord, 'id' | 'exportedAt'>): Record<string, string> {
    const errors = validateDocumentRecord(input);
    if (Object.keys(errors).length > 0) {
      return errors;
    }

    const record: DocumentRecord = { ...input, id: createRecordId() };
    this.recordsSignal.update((records) => [record, ...records]);
    this.persist();
    return {};
  }

  update(record: DocumentRecord): Record<string, string> {
    const errors = validateDocumentRecord(record);
    if (Object.keys(errors).length > 0) {
      return errors;
    }

    this.recordsSignal.update((records) =>
      records.map((item) => (item.id === record.id ? record : item)),
    );
    this.persist();
    return {};
  }

  remove(id: string): void {
    this.recordsSignal.update((records) => records.filter((record) => record.id !== id));
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
    this.recordsSignal.set(merged.records);
    this.persist();
    return merged.added;
  }

  markExported(ids: string[]): void {
    const stamp = new Date().toISOString();
    this.recordsSignal.update((records) =>
      records.map((record) =>
        ids.includes(record.id) ? { ...record, exportedAt: stamp } : record,
      ),
    );
    this.persist();
  }

  private load(): DocumentRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw) as DocumentRecord[];
      return Array.isArray(parsed) ? parsed.filter((record) => Boolean(record?.id)) : [];
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
