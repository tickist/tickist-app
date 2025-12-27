import 'zone.js';
import './styles.css';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Ensure DaisyUI theme is applied when mounting in Vite
document.documentElement.setAttribute('data-theme', 'tickist');
document.body.setAttribute('data-theme', 'tickist');

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
