import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent),
    title: 'Giriş | Tahakkuk',
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'anasayfa' },
      {
        path: 'anasayfa',
        loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
        title: 'Anasayfa | Tahakkuk',
      },
      {
        path: 'modules/damga-vergisi-modulu',
        loadComponent: () =>
          import('./features/modules/stamp-tax/stamp-tax.component').then((m) => m.StampTaxComponent),
        title: 'Damga Vergisi Hesaplama | Tahakkuk',
      },
      {
        path: 'modules/dosya',
        loadComponent: () =>
          import('./features/modules/documents/documents.component').then(
            (m) => m.DocumentsComponent,
          ),
        title: 'Dosya Modülü | Tahakkuk',
      },
      {
        path: 'modules/sozlesme/:recordNumber',
        loadComponent: () =>
          import('./features/modules/contracts/contracts.component').then(
            (m) => m.ContractsComponent,
          ),
        title: 'Sözleşme Modülü | Tahakkuk',
      },
      {
        path: 'profile',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/profile/profile.component').then((m) => m.ProfileComponent),
        title: 'Profil | Tahakkuk',
      },
      {
        path: 'policy',
        loadComponent: () =>
          import('./features/legal/policy.component').then((m) => m.PolicyComponent),
        title: 'Gizlilik Politikası | Tahakkuk',
      },
      {
        path: 'terms',
        loadComponent: () =>
          import('./features/legal/terms.component').then((m) => m.TermsComponent),
        title: 'Kullanım Koşulları | Tahakkuk',
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
