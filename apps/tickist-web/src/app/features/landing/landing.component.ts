import { DOCUMENT, NgOptimizedImage } from '@angular/common';
import {
  Component,
  computed,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { ThemeService } from '../../core/ui/theme.service';
import {
  lucideArrowRight as ArrowRight,
  lucideCalendarDays as CalendarDays,
  lucideCheckCircle2 as CheckCircle2,
  lucideFolderTree as FolderTree,
  lucideInbox as Inbox,
  lucideLayoutDashboard as LayoutDashboard,
  lucideListTodo as ListTodo,
  lucideMoon as Moon,
  lucideRepeat2 as Repeat2,
  lucideSearch as Search,
  lucideShield as Shield,
  lucideSun as Sun,
  lucideTag as Tag,
  lucideUsers as Users,
  lucideZap as Zap,
} from '@ng-icons/lucide';
import { simpleGithub as Github } from '@ng-icons/simple-icons';

@Component({
  selector: 'app-landing',
  imports: [RouterLink, NgIcon, NgOptimizedImage],
  templateUrl: './landing.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './landing.component.css',
})
export class LandingComponent {
  private readonly themeService = inject(ThemeService);
  private readonly document = inject(DOCUMENT);

  readonly isDarkTheme = this.themeService.isDark;
  readonly brandLogoSrc = computed(() =>
    this.isDarkTheme() ? '/images/logo_230.png' : '/images/logo-light_230.png'
  );
  readonly themeButtonLabel = computed(() =>
    this.isDarkTheme() ? 'Switch to light theme' : 'Switch to dark theme'
  );
  readonly blogLink = computed(() =>
    this.document.documentElement.lang.toLowerCase().startsWith('pl')
      ? '/pl/blog'
      : '/en/blog'
  );

  readonly icons = {
    ArrowRight,
    CheckCircle2,
    CalendarDays,
    FolderTree,
    Github,
    Inbox,
    LayoutDashboard,
    Repeat2,
    Search,
    Shield,
    Tag,
    ListTodo,
    Sun,
    Moon,
    Users,
    Zap,
  };

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
