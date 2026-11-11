import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthService } from '../../../core/auth.service';
import { StampTaxComponent } from './stamp-tax.component';

describe('StampTaxComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StampTaxComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { user: signal(null) } },
      ],
    }).compileComponents();
  });

  it('KDV hariç fatura bedeli üzerinden damga vergisi kesintisi hesaplar', async () => {
    const fixture = TestBed.createComponent(StampTaxComponent);
    fixture.componentInstance.form.setValue({
      amountExcludingVat: 10000,
      vatAmount: 2000,
      withholdingDeduction: 9.48,
    });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.stampTaxDeduction()).toBe(94.8);
  });

  it('KDV dahil fatura bedelini KDV hariç bedel ve KDV bedelinden hesaplar', async () => {
    const fixture = TestBed.createComponent(StampTaxComponent);
    fixture.componentInstance.form.setValue({
      amountExcludingVat: 10000,
      vatAmount: 2000,
      withholdingDeduction: 0,
    });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.amountIncludingVat()).toBe(12000);
  });

  it('ödenecek tutarı KDV dahil bedelden kesintileri düşerek hesaplar', async () => {
    const fixture = TestBed.createComponent(StampTaxComponent);
    fixture.componentInstance.form.setValue({
      amountExcludingVat: 10000,
      vatAmount: 2000,
      withholdingDeduction: 9.48,
    });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.payableAmount()).toBe(11895.72);
  });

  it('sonuç satırlarını istenen sırada gösterir', async () => {
    const fixture = TestBed.createComponent(StampTaxComponent);
    fixture.detectChanges();

    const labels = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.result-row dt'),
    ).map((element) => element.textContent?.trim());

    expect(labels).toEqual([
      'KDV hariç fatura bedeli',
      'KDV bedeli',
      'KDV dahil fatura bedeli',
      'Damga vergisi kesintisi (9,48/1000)',
      'Tevkifat kesintisi',
      'Ödenecek tutar',
    ]);
  });

  it('tutarları Türkçe biçimde gösterir', () => {
    const fixture = TestBed.createComponent(StampTaxComponent);

    expect(fixture.componentInstance.formatCurrency(1000)).toBe('₺1.000,00');
  });

  it('formu temizlediğinde tutarları sıfırlar', async () => {
    const fixture = TestBed.createComponent(StampTaxComponent);
    fixture.componentInstance.form.setValue({
      amountExcludingVat: 5000,
      vatAmount: 1000,
      withholdingDeduction: 10,
    });
    await fixture.whenStable();

    fixture.componentInstance.reset();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.amountExcludingVat()).toBe(0);
    expect(fixture.componentInstance.vatAmount()).toBe(0);
    expect(fixture.componentInstance.withholdingDeduction()).toBe(0);
    expect(fixture.componentInstance.payableAmount()).toBe(0);
  });
});
