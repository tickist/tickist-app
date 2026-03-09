import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../core/ui/theme.service';
import { LucideAngularModule, ArrowRight, CheckCircle2, FolderTree, LayoutDashboard, Github, Shield, Layers, Settings, Tag, ListTodo, Sun, Moon } from 'lucide-angular';

@Component({
  selector: 'app-landing',
  imports: [RouterLink, LucideAngularModule, NgOptimizedImage],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
})
export class LandingComponent {
  private readonly themeService = inject(ThemeService);

  readonly isDarkTheme = this.themeService.isDark;
  readonly brandLogoSrc = computed(() =>
    this.isDarkTheme() ? '/images/logo_230.png' : '/images/logo-light_230.png'
  );
  readonly themeButtonLabel = computed(() =>
    this.isDarkTheme() ? 'Switch to light theme' : 'Switch to dark theme'
  );

  readonly icons = {
    ArrowRight, CheckCircle2, FolderTree, LayoutDashboard, Github, Shield, Layers, Settings, Tag, ListTodo, Sun, Moon
  };

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
