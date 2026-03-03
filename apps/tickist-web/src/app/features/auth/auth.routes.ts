import { Route } from '@angular/router';
import { AuthShellComponent } from './auth-shell.component';
import { redirectIfAuthenticatedGuard } from './redirect-if-authenticated.guard';

export const AUTH_ROUTES: Route[] = [
  {
    path: '',
    component: AuthShellComponent,
    canActivate: [redirectIfAuthenticatedGuard],
  },
  {
    path: 'signup',
    canActivate: [redirectIfAuthenticatedGuard],
    loadComponent: () =>
      import('./auth-signup.component').then((m) => m.AuthSignupComponent),
  },
  {
    path: 'reset',
    canActivate: [redirectIfAuthenticatedGuard],
    loadComponent: () =>
      import('./auth-reset.component').then((m) => m.AuthResetComponent),
  },
  {
    path: 'update-password',
    loadComponent: () =>
      import('./auth-update-password.component').then(
        (m) => m.AuthUpdatePasswordComponent
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
