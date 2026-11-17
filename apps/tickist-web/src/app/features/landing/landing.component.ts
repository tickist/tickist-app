import { DOCUMENT, NgOptimizedImage } from '@angular/common';
import {
  Component,
  computed,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { simpleGithub } from '@ng-icons/simple-icons';
import { ThemeService } from '../../core/ui/theme.service';
import { formatDay } from '../../core/time/date-format';
import { LANDING_ICONS, type LandingIconName } from './landing-icons';

interface LandingFeature {
  icon: LandingIconName;
  title: string;
  text: string;
}

interface PreviewTask {
  name: string;
  project: string;
  /** Priority ring colour, as on a real task card. */
  priority: string;
  scheduled: boolean;
  time?: string;
  pinned?: boolean;
}

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

  readonly icons = LANDING_ICONS;
  readonly githubIcon = simpleGithub;
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
  /** The preview shows today's date, as the dashboard would. */
  readonly today = formatDay(new Date()) ?? '';

  readonly previewTasks: readonly PreviewTask[] = [
    {
      name: 'Book the electrician',
      project: 'Home renovation',
      priority: '#ef4444',
      scheduled: false,
      pinned: true,
    },
    {
      name: 'Write the launch announcement',
      project: 'Website launch',
      priority: '#fbbf24',
      scheduled: true,
      time: '25m / 1h',
    },
    {
      name: 'Evening run',
      project: 'Health',
      priority: '#22c55e',
      scheduled: true,
    },
  ];

  readonly features: readonly LandingFeature[] = [
    {
      icon: 'house',
      title: 'A dashboard for today',
      text: 'Tasks due today, pinned work, what slipped past its date and what you have already finished, on one screen.',
    },
    {
      icon: 'calendarDays',
      title: 'A plan for every day',
      text: 'Weekdays lists each day’s scheduled tasks and deadlines. Drag tasks into the order you want to do them.',
    },
    {
      icon: 'listTree',
      title: 'Projects inside projects',
      text: 'Collect everything in Inbox, then sort it into nested projects. The dashboard points out projects without a next action.',
    },
    {
      icon: 'repeat',
      title: 'Deadlines and repeats',
      text: 'Give a task a deadline or a day to do it. Repeat it daily, on workdays, weekly, monthly or yearly.',
    },
    {
      icon: 'timer',
      title: 'Focus timer and time reports',
      text: 'Start a timer from any task and see where your time went by day, week or month, per project or tag.',
    },
    {
      icon: 'users',
      title: 'Shared projects',
      text: 'Invite people to a project and assign its tasks. Everything else stays private.',
    },
    {
      icon: 'bot',
      title: 'Works with AI assistants',
      text: 'Connect Claude or another MCP client to read and update your tasks, with your permission.',
    },
    {
      icon: 'smartphone',
      title: 'On every device',
      text: 'Use Tickist in the browser or install it as an app on your phone and computer.',
    },
  ];

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
