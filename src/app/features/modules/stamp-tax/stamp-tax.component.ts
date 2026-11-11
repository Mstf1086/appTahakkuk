import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { startWith } from 'rxjs';
import { AuthService } from '../../../core/auth.service';
import { SeoService } from '../../../core/seo.service';

const STAMP_TAX_RATE = 9.48 / 1000;

@Component({
  selector: 'app-stamp-tax',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './stamp-tax.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './stamp-tax.component.css',
})
export class StampTaxComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly seoService = inject(SeoService);

  readonly user = this.authService.user;
  readonly stampTaxRate = STAMP_TAX_RATE;

  constructor() {
    this.seoService.setPage({
      title: 'Damga Vergisi Hesaplama | Tahakkuk',
      description:
        'KDV hariç fatura bedeli üzerinden 9,48/1000 oranında damga vergisi kesintisi hesaplayın; KDV dahil fatura bedeli, tevkifat kesintisi ve ödenecek tutarı anında görün.',
      keywords:
        'damga vergisi hesaplama, damga vergisi kesintisi, KDV hariç fatura bedeli, tevkifat kesintisi, ödenecek tutar',
      path: '/modules/stamp-tax',
    });
  }

  readonly form = this.formBuilder.nonNullable.group({
    amountExcludingVat: [0, [Validators.required, Validators.min(0)]],
    vatAmount: [0, [Validators.required, Validators.min(0)]],
    withholdingDeduction: [0, [Validators.required, Validators.min(0)]],
  });

  private readonly currencyFormatter = new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  private readonly formValue = toSignal(
    this.form.valueChanges.pipe(startWith(this.form.getRawValue())),
    { initialValue: this.form.getRawValue() },
  );

  readonly amountExcludingVat = computed(() => this.formValue().amountExcludingVat ?? 0);
  readonly vatAmount = computed(() => this.formValue().vatAmount ?? 0);
  readonly amountIncludingVat = computed(() => this.amountExcludingVat() + this.vatAmount());
  readonly stampTaxDeduction = computed(() =>
    this.roundCurrency(this.amountExcludingVat() * STAMP_TAX_RATE),
  );
  readonly withholdingDeduction = computed(() => this.formValue().withholdingDeduction ?? 0);
  readonly payableAmount = computed(() =>
    this.roundCurrency(
      this.amountIncludingVat() - this.stampTaxDeduction() - this.withholdingDeduction(),
    ),
  );

  reset(): void {
    this.form.reset({ amountExcludingVat: 0, vatAmount: 0, withholdingDeduction: 0 });
  }

  formatCurrency(value: number): string {
    return this.currencyFormatter.format(value);
  }

  private roundCurrency(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
