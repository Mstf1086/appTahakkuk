import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth.service';
import { ErrorLogger } from '../../../core/error-logger';
import {
  CONTRACTS_SHEET_NAME,
  GoogleDriveService,
  toDriveErrorMessage,
} from '../../../core/google-drive.service';
import { SeoService } from '../../../core/seo.service';
import { DocumentsService } from '../documents/documents.service';
import { DocumentRecord } from '../documents/document-record';
import {
  CONTRACT_SHEET_HEADERS,
  ContractRecord,
  addContract,
  deleteContract,
  listContractsForRecord,
  loadContracts,
  sortContracts,
  toContractSheetRow,
  tutarLabel,
  validateContractInput,
} from './contract-record';

type ModalMode = 'closed' | 'form' | 'delete';

@Component({
  selector: 'app-contracts',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './contracts.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './contracts.component.css',
})
export class ContractsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly seoService = inject(SeoService);
  private readonly logger = inject(ErrorLogger);
  private readonly documentsService = inject(DocumentsService);
  private readonly drive = inject(GoogleDriveService);

  readonly user = this.authService.user;
  readonly records = this.documentsService.records;

  private readonly allContracts = signal<ContractRecord[]>([]);
  private readonly loading = signal(false);
  private readonly autoLoaded = signal(false);

  readonly modal = signal<ModalMode>('closed');
  readonly selectedId = signal<string | null>(null);
  readonly formErrors = signal<Record<string, string>>({});
  readonly saveMessage = signal('');
  readonly saveError = signal('');

  readonly form = this.formBuilder.nonNullable.group({
    firmaAdi: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    vergiNo: ['', [Validators.required, Validators.pattern(/^\d{10,11}$/)]],
    tutar: ['', [Validators.required, Validators.pattern(/^\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?$|^\d+(?:[.,]\d{1,2})?$/)]],
    sozlesmeTarihi: ['', Validators.required],
  });

  // Adresten gelen Sıra No parametresi; dosya kaydı listeden bulunur.
  readonly recordNumber = computed(
    () => this.route.snapshot.paramMap.get('recordNumber') ?? '',
  );

  readonly record = computed<DocumentRecord | null>(
    () =>
      this.documentsService
        .records()
        .find((record) => record.recordNumber === this.recordNumber()) ?? null,
  );

  readonly contracts = computed(() =>
    listContractsForRecord(this.allContracts(), this.recordNumber()),
  );

  constructor() {
    this.seoService.setPage({
      title: 'Sözleşme Modülü | Tahakkuk',
      description:
        'Dosya kayıtlarına bağlı sözleşmeleri yönetin; firma adı, vergi no, sözleşme tutarı ve tarihini Google Drive\'daki "sözleşmeler" tablosuna kaydedin.',
      keywords: 'sözleşme modülü, dosya kaydı, sözleşme, vergi no, google drive',
      path: '/modules/sozlesme',
    });

    // Kayıt listesi gelmeden sözleşmeler yüklenemez; dosya kaydı göründüğünde ve Drive
    // bağlıysa tablo okunur. Kullanıcı giriş yaptığında bağlantı zaten otomatik kurulur.
    effect(() => {
      const record = this.record();
      const linked = this.drive.isLinked() && this.drive.hasSessionToken();
      if (this.autoLoaded() || this.loading() || !linked || !record) {
        return;
      }
      this.autoLoaded.set(true);
      void this.loadFromDrive();
    });
  }

  openNewContract(): void {
    this.form.reset({ firmaAdi: '', vergiNo: '', tutar: '', sozlesmeTarihi: '' });
    this.selectedId.set(null);
    this.formErrors.set({});
    this.modal.set('form');
  }

  openDeleteModal(id: string): void {
    this.selectedId.set(id);
    this.modal.set('delete');
  }

  closeModal(): void {
    this.modal.set('closed');
    this.selectedId.set(null);
  }

  submitForm(): void {
    const raw = this.form.getRawValue();
    const errors = validateContractInput(raw);
    this.formErrors.set(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    const number = this.recordNumber();
    if (!number) {
      this.saveError.set('Sözleşme açmak için bir dosya kaydı seçin.');
      return;
    }

    const created = addContract(this.allContracts(), {
      recordNumber: number,
      firmaAdi: raw.firmaAdi.trim(),
      vergiNo: raw.vergiNo.trim(),
      tutar: raw.tutar.trim(),
      sozlesmeTarihi: raw.sozlesmeTarihi,
    });
    this.allContracts.set(created.contracts);
    this.modal.set('closed');
    this.saveError.set('');
    this.saveMessage.set('Sözleşme eklendi.');
    void this.mirrorToDrive();
  }

  confirmDelete(): void {
    const id = this.selectedId();
    if (!id) {
      return;
    }
    const updated = deleteContract(this.allContracts(), id);
    if (updated.changed) {
      this.allContracts.set(updated.contracts);
      this.saveMessage.set('Sözleşme silindi.');
      void this.mirrorToDrive();
    }
    this.closeModal();
  }

  async loadFromDrive(): Promise<void> {
    this.saveMessage.set('');
    this.saveError.set('');
    this.loading.set(true);

    try {
      if (!this.drive.isLinked()) {
        await this.drive.connect();
        if (!this.drive.isLinked()) {
          return;
        }
        this.autoLoaded.set(true);
      }
      const rows = await this.drive.loadSheetRows(CONTRACTS_SHEET_NAME, [
        ...CONTRACT_SHEET_HEADERS,
      ]);
      this.allContracts.set(sortContracts(loadContracts(rows)));
      this.saveMessage.set('Drive\'daki "sözleşmeler" tablosu yüklendi.');
    } catch (error) {
      this.logger.error('Drive\'dan sözleşme yükleme başarısız', error);
      this.saveError.set(toDriveErrorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  private async mirrorToDrive(): Promise<void> {
    try {
      await this.drive.writeSheet(
        CONTRACTS_SHEET_NAME,
        [...CONTRACT_SHEET_HEADERS],
        this.allContracts().map((contract) => toContractSheetRow(contract)),
      );
      this.saveError.set('');
    } catch (error) {
      this.logger.error('Drive "sözleşmeler" tablosuna yazma başarısız', error);
      this.saveError.set(toDriveErrorMessage(error));
    }
  }

  tutarLabel = tutarLabel;
}