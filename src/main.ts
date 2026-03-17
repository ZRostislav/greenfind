import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

declare const ngDevMode: boolean | undefined;

if (typeof ngDevMode !== 'undefined' && ngDevMode) {
  import('@angular/compiler').catch(() => undefined);
}

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
