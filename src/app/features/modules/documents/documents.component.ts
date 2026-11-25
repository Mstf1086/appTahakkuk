import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { ErrorLogger } from '../../../core/error-logger';
import {
  DOCUMENTS_SHEET_NAME,
  GoogleDriveService,
  toDriveErrorMessage,
} from '../../../core/google-drive.service';
import { SeoService } from '../../../core/seo.service';
import { DocumentsService } from './documents.service';
import {
  DOCUMENT_SHEET_HEADERS,
  DOGRUDAN_TEMIN_USULU_OPTIONS,
  DocumentRecord,
  DogrudanTeminUsulu,
  IHALE_USULU_OPTIONS,
  IhaleUsulu,
  TURU_OPTIONS,
  Turu,
  USULU_OPTIONS,
  Usulu,
  fromSheetRow,
  turuLabel,
  usulDetayiLabel,
  usuluLabel,
} from './document-record';

type ModalMode = 'closed' | 'select' | 'form';
type SelectAction = 'edit' | 'delete';

@Component({
  selector: 'app-documents',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './documents.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './documents.component.css',
})
export class DocumentsComponent {
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly seoService = inject(SeoService);
  private readonly logger = inject(ErrorLogger);
  readonly documents = inject(DocumentsService);
  readonly drive = inject(GoogleDriveService);

  readonly user = this.authService.user;
  readonly records = this.documents.records;
  readonly syncError = this.documents.syncError;

  readonly turuOptions = TURU_OPTIONS;
  readonly usuluOptions = USULU_OPTIONS;
  readonly ihaleUsuluOptions = IHALE_USULU_OPTIONS;
  readonly dogrudanTeminUsuluOptions = DOGRUDAN_TEMIN_USULU_OPTIONS;

  readonly modal = signal<ModalMode>('closed');
  readonly modalAction = signal<SelectAction>('edit');
  readonly selectedId = signal<string | null>(null);
  readonly editingId = signal<string | null>(null);
  readonly formErrors = signal<Record<string, string>>({});
  readonly saveMessage = signal('');
  readonly saveError = signal('');
  private driveLoading = false;
  private driveAutoLoaded = false;

  readonly form = this.formBuilder.nonNullable.group({
    isinAdi: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    turu: ['', Validators.required],
    usulu: ['', Validators.required],
    ihaleUsulu: [''],
    dogrudanTeminUsulu: [''],
    alimTarihi: ['', Validators.required],
    aciklama: ['', Validators.maxLength(500)],
  });

  readonly modalTitle = computed(() =>
    this.modal() === 'form'
      ? this.editingId()
        ? 'Kaydı düzenle'
        : 'Yeni kayıt'
      : this.modalAction() === 'delete'
        ? 'Silinecek kaydı seçin'
        : 'Düzenlenecek kaydı seçin',
  );

  constructor() {
    this.seoService.setPage({
      title: 'Dosya Modülü | Tahakkuk',
      description:
        'İş kayıtlarını oluşturun, düzenleyin ve silin; kayıtları Google Drive içindeki "dosyalar" tablosuna kaydedin.',
      keywords: 'dosya modülü, iş kaydı, ihale, doğrudan temin, google drive',
      path: '/modules/dosya',
    });

    // Drive bağlantı kaydı (localStorage) sayfa yenilemesinden sonra geri yüklenir;
    // token bellekte tutulduğu için servis onu sessizce yeniler. Bağlantı görünür
    // hale geldiğinde (geri yükleme veya yeni bağlantı) Drive'daki kayıtlar modül
    // açılışında kendiliğinden listeye eklenir.
    effect(() => {
      if (this.driveAutoLoaded || this.driveLoading || !this.drive.isLinked()) {
        return;
      }
      this.driveAutoLoaded = true;
      void this.loadFromDrive();
    });
  }

  openNewRecord(): void {
    this.form.reset({
      isinAdi: '',
      turu: '',
      usulu: '',
      ihaleUsulu: '',
      dogrudanTeminUsulu: '',
      alimTarihi: '',
      aciklama: '',
    });
    this.editingId.set(null);
    this.formErrors.set({});
    this.modal.set('form');
  }

  openSelectModal(action: SelectAction): void {
    if (this.records().length === 0) {
      this.saveMessage.set('Listelenecek kayıt yok. Önce yeni kayıt ekleyin.');
      return;
    }
    this.modalAction.set(action);
    this.selectedId.set(null);
    this.modal.set('select');
  }

  confirmSelect(): void {
    const id = this.selectedId();
    if (!id) {
      return;
    }

    if (this.modalAction() === 'delete') {
      this.documents.remove(id);
      this.modal.set('closed');
      this.saveError.set('');
      this.saveMessage.set('Kayıt silindi.');
      return;
    }

    const record = this.documents.find(id);
    if (!record) {
      return;
    }

    this.form.reset({
      isinAdi: record.isinAdi,
      turu: record.turu,
      usulu: record.usulu,
      ihaleUsulu: record.ihaleUsulu ?? '',
      dogrudanTeminUsulu: record.dogrudanTeminUsulu ?? '',
      alimTarihi: record.alimTarihi,
      aciklama: record.aciklama ?? '',
    });
    this.editingId.set(record.id);
    this.formErrors.set({});
    this.modal.set('form');
  }

  onUsuluChange(value: string): void {
    if (value !== 'ihale') {
      this.form.controls.ihaleUsulu.setValue('');
    }
    if (value !== 'dogrudanTemin') {
      this.form.controls.dogrudanTeminUsulu.setValue('');
    }
  }

  submitForm(): void {
    const raw = this.form.getRawValue();
    const payload: Omit<DocumentRecord, 'id' | 'exportedAt'> = {
      isinAdi: raw.isinAdi.trim(),
      turu: raw.turu as Turu,
      usulu: raw.usulu as Usulu,
      ihaleUsulu: raw.usulu === 'ihale' ? (raw.ihaleUsulu as IhaleUsulu) || undefined : undefined,
      dogrudanTeminUsulu:
        raw.usulu === 'dogrudanTemin'
          ? (raw.dogrudanTeminUsulu as DogrudanTeminUsulu) || undefined
          : undefined,
      alimTarihi: raw.alimTarihi,
      aciklama: raw.aciklama.trim() || undefined,
    };

    const editingId = this.editingId();
    const errors = editingId
      ? this.documents.update({
          ...payload,
          id: editingId,
          exportedAt: this.documents.find(editingId)?.exportedAt,
        })
      : this.documents.add(payload);

    if (Object.keys(errors).length > 0) {
      this.formErrors.set(errors);
      return;
    }

    this.formErrors.set({});
    this.modal.set('closed');
    this.saveError.set('');
    this.saveMessage.set(editingId ? 'Kayıt güncellendi.' : 'Kayıt eklendi.');
  }

  async connectDrive(): Promise<void> {
    // Bağlantı akışı kendi yüklemesini yapacağı için otomatik yükleme tetiklenmez.
    this.driveAutoLoaded = true;
    await this.drive.connect();
    if (this.drive.isLinked()) {
      await this.loadFromDrive();
    }
  }

  // Dosya kaydı için sözleşme modülünü açar; DOSYA ID parametre olarak taşınır.
  openContracts(record: DocumentRecord): void {
    if (!record.recordNumber) {
      this.saveError.set('Bu kaydın DOSYA ID bilgisi yok; sözleşme açılamaz.');
      return;
    }
    void this.router.navigate(['/modules/sozlesme', record.recordNumber]);
  }

  // Drive'daki "dosyalar" tablosundaki kayıtları okur ve listeye ekler (yinilenenler atlanır).
  async loadFromDrive(): Promise<void> {
    this.saveMessage.set('');
    this.saveError.set('');
    this.driveLoading = true;

    try {
      if (!this.drive.isLinked()) {
        await this.drive.connect();
        if (!this.drive.isLinked()) {
          return;
        }
        // Bağlantı bu akışta kuruldu; otomatik yükleme ayrıca tetiklenmez.
        this.driveAutoLoaded = true;
      }
      const rows = await this.drive.loadSheetRows(DOCUMENTS_SHEET_NAME, [
        ...DOCUMENT_SHEET_HEADERS,
      ]);
      const loaded = rows
        .map((row) => fromSheetRow(row))
        .filter((record): record is DocumentRecord => record !== null);

      if (loaded.length === 0) {
        this.saveMessage.set('Drive\'daki "dosyalar" tablosunda listelenecek kayıt yok.');
        this.documents.requestMirror();
        return;
      }

      const added = this.documents.mergeLoaded(loaded);
      const skipped = loaded.length - added;
      this.saveMessage.set(
        added === 0
          ? 'Drive kayıtları zaten listede; yinelenen satır eklenmedi.'
          : `Drive'dan ${added} kayıt eklendi${skipped > 0 ? `, ${skipped} yinilenen satır atlandı` : ''}.`,
      );
      // Tablo başlıksız/eski biçimdeyse başlık satırı ve sıra numaraları tabloya yazılsın.
      this.documents.requestMirror();
    } catch (error) {
      this.logger.error('Drive\'dan kayıt yükleme başarısız', error);
      this.saveError.set(toDriveErrorMessage(error));
    } finally {
      this.driveLoading = false;
    }
  }

  closeModal(): void {
    this.modal.set('closed');
  }

  turuLabel = turuLabel;
  usuluLabel = usuluLabel;
  usulDetayiLabel = usulDetayiLabel;
}
