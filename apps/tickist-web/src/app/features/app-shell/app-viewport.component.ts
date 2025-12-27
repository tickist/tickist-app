import { Component, computed, effect, inject, signal, DestroyRef, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { SupabaseSessionService } from '../auth/supabase-session.service';
import { SupabaseAuthService } from '../auth/supabase-auth.service';
import { NotificationDataService } from '../../data/notification-data.service';
import { AppViewStateService } from './app-view-state.service';
import { AppSidebarComponent } from './app-sidebar.component';
import { TaskFabComponent } from '../task-fab/task-fab.component';
import { filter, Subscription } from 'rxjs';
import { ToastContainerComponent } from '../../core/ui/toast-container.component';

@Component({
  selector: 'app-viewport',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    NgIf,
    NgFor,
    DatePipe,
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
  private readonly destroyRef = inject(DestroyRef);
  private routerSub: Subscription | null = null;

  readonly user = computed(() => this.session.user());
  readonly notifications = this.notificationsService.list;
  readonly notificationsLoading = this.notificationsService.loadingState;
  readonly unreadNotifications = computed(
    () => this.notifications().filter((notification) => !notification.isRead).length
  );
  readonly notificationsOpen = signal(false);
  readonly profileMenuOpen = signal(false);
  readonly searchTerm = this.viewState.searchTerm;
  readonly sidebarOpen = signal(false);

  constructor() {
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
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
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
}
