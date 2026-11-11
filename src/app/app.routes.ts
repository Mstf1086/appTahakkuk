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
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        title: 'Dashboard | Tahakkuk',
      },
      {
        path: 'modules/stamp-tax',
        loadComponent: () =>
          import('./features/modules/stamp-tax/stamp-tax.component').then((m) => m.StampTaxComponent),
        title: 'Damga Vergisi Hesaplama | Tahakkuk',
      },
      {
        path: 'profile',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/profile/profile.component').then((m) => m.ProfileComponent),
        title: 'Profil | Tahakkuk',
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
