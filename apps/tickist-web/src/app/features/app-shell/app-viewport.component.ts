import {
  Component,
  computed,
  effect,
  inject,
  signal,
  OnDestroy,
} from '@angular/core';
import {
  RouterOutlet,
  RouterLink,
  Router,
  NavigationEnd,
} from '@angular/router';
import { DatePipe, NgOptimizedImage } from '@angular/common';
import { SupabaseSessionService } from '../auth/supabase-session.service';
import { SupabaseAuthService } from '../auth/supabase-auth.service';
import { NotificationDataService } from '../../data/notification-data.service';
import { AppViewStateService } from './app-view-state.service';
import { AppSidebarComponent } from './app-sidebar.component';
import { TaskFabComponent } from '../task-fab/task-fab.component';
import { filter, Subscription } from 'rxjs';
import { ToastContainerComponent } from '../../core/ui/toast-container.component';
import { ThemeService } from '../../core/ui/theme.service';

@Component({
  selector: 'app-viewport',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    DatePipe,
    NgOptimizedImage,
    AppSidebarComponent,
    TaskFabComponent,
    ToastContainerComponent,
  ],
  templateUrl: './app-viewport.component.html',
  styleUrl: './app-viewport.component.css',
})
export class AppViewportComponent implements OnDestroy {
  private readonly session = inject(SupabaseSessionService);
  private readonly auth = inject(SupabaseAuthService);
  private readonly notificationsService = inject(NotificationDataService);
  private readonly viewState = inject(AppViewStateService);
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);
  private routerSub: Subscription | null = null;

  readonly user = computed(() => this.session.user());
  readonly avatarUrl = computed(() => {
    const metadata = getUserMetadata(this.user()?.user_metadata);
    const avatarUrl = asOptionalString(metadata['avatar_url']);
    if (!avatarUrl) {
      return null;
    }
    const version = asOptionalString(metadata['avatar_version']);
    return appendCacheVersion(avatarUrl, version);
  });
  readonly notifications = this.notificationsService.list;
  readonly notificationsLoading = this.notificationsService.loadingState;
  readonly unreadNotifications = computed(
    () =>
      this.notifications().filter((notification) => !notification.isRead).length
  );
  readonly notificationsOpen = signal(false);
  readonly profileMenuOpen = signal(false);
  readonly searchTerm = this.viewState.searchTerm;
  readonly sidebarOpen = signal(false);
  readonly isDarkTheme = this.themeService.isDark;
  readonly brandLogoSrc = computed(() =>
    this.isDarkTheme() ? '/images/logo_230.png' : '/images/logo-light_230.png'
  );
  readonly themeButtonLabel = computed(() =>
    this.isDarkTheme() ? 'Switch to light theme' : 'Switch to dark theme'
  );

  constructor() {
    const initialUrl = this.router.url;
    if (initialUrl.startsWith('/app') && initialUrl !== '/app/settings') {
      this.viewState.rememberLastNonSettingsAppUrl(initialUrl);
    }

    effect(() => {
      const user = this.user();
      if (user) {
        void this.notificationsService.refresh(user.id);
      } else {
        this.notificationsOpen.set(false);
        this.profileMenuOpen.set(false);
      }
    });

    this.routerSub = this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        )
      )
      .subscribe((event) => {
        if (
          event.urlAfterRedirects.startsWith('/app') &&
          event.urlAfterRedirects !== '/app/settings'
        ) {
          this.viewState.rememberLastNonSettingsAppUrl(event.urlAfterRedirects);
        }
        this.profileMenuOpen.set(false);
        this.notificationsOpen.set(false);
        this.sidebarOpen.set(false);
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  onSearchInput(event: Event) {
    const target = event.target as HTMLInputElement | null;
    this.viewState.updateSearchTerm(target?.value ?? '');
  }

  clearSearch(input?: HTMLInputElement | null): void {
    this.viewState.clearSearch();
    input?.focus();
  }

  toggleNotifications(): void {
    if (!this.notifications().length && !this.notificationsLoading()) {
      const userId = this.user()?.id;
      if (userId) {
        void this.notificationsService.refresh(userId);
      }
    }
    this.notificationsOpen.update((open) => !open);
    if (this.notificationsOpen()) {
      this.profileMenuOpen.set(false);
    }
  }

  toggleProfileMenu(): void {
    this.profileMenuOpen.update((open) => !open);
    if (this.profileMenuOpen()) {
      this.notificationsOpen.set(false);
    }
  }

  closeProfileMenu(): void {
    this.profileMenuOpen.set(false);
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await this.notificationsService.markAsRead(notificationId);
  }

  avatarInitial() {
    const email = this.user()?.email ?? '';
    return email ? email.charAt(0).toUpperCase() : '?';
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigateByUrl('/auth');
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}

function getUserMetadata(value: unknown): Record<string, unknown> {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function asOptionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null;
}

function appendCacheVersion(url: string, version: string | null): string {
  if (!version) {
    return url;
  }
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${encodeURIComponent(version)}`;
}
