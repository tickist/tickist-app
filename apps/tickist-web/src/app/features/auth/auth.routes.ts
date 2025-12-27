import { Route } from '@angular/router';
import { AuthShellComponent } from './auth-shell.component';

export const AUTH_ROUTES: Route[] = [
  {
    path: '',
    component: AuthShellComponent,
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./auth-signup.component').then((m) => m.AuthSignupComponent),
  },
  {
    path: 'reset',
    loadComponent: () =>
      import('./auth-reset.component').then((m) => m.AuthResetComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
