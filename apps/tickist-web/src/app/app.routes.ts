import { Route } from '@angular/router';
import { LandingComponent } from './features/landing/landing.component';
import { supabaseAuthGuard } from './features/auth/auth.guard';
import { redirectIfAuthenticatedGuard } from './features/auth/redirect-if-authenticated.guard';
import { NotFoundComponent } from './features/not-found/not-found.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { AppViewportComponent } from './features/app-shell/app-viewport.component';

export const appRoutes: Route[] = [
  {
    path: '',
    component: LandingComponent,
    canActivate: [redirectIfAuthenticatedGuard],
  },
  {
    path: 'app',
    canActivate: [supabaseAuthGuard],
    component: AppViewportComponent,
    children: [
      {
        path: '',
        component: DashboardComponent,
      },
      {
        path: 'tasks',
        loadComponent: () =>
          import('./features/app-shell/app-shell.component').then(
            (m) => m.AppShellComponent
          ),
      },
      {
        path: 'tasks/:projectId',
        loadComponent: () =>
          import('./features/app-shell/app-shell.component').then(
            (m) => m.AppShellComponent
          ),
      },
      {
        path: 'tree',
        loadComponent: () =>
          import('./features/tree-view/tree-view.component').then(
            (m) => m.TreeViewComponent
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/app-shell/settings.component').then(
            (m) => m.SettingsComponent
          ),
      },
      {
        path: 'tags',
        loadComponent: () =>
          import('./features/tags/tag-view.component').then(
            (m) => m.TagViewComponent
          ),
      },
    ],
  },
  {
    path: 'auth',
    canActivate: [redirectIfAuthenticatedGuard],
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: '**',
    component: NotFoundComponent,
  },
];
