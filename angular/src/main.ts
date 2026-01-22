import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { TAB_ID } from './app/providers/tab-id.provider';
import { environment } from './environments/environment';
import * as browser from 'webextension-polyfill';

// Check for extension environment
const isExtension = !!(globalThis.chrome?.runtime?.id || (typeof browser !== 'undefined' && browser.runtime?.id));

if (isExtension) {
  browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    if (environment.production) {
      enableProdMode();
    }

    const { id: tabId } = [...tabs].pop();

    // provides the current Tab ID so you can send messages to the content page
    platformBrowserDynamic([{ provide: TAB_ID, useValue: tabId }])
      .bootstrapModule(AppModule)
      .catch((error) => {
        console.error(error);
      });
  });
} else {
  if (environment.production) {
    enableProdMode();
  }

  platformBrowserDynamic()
    .bootstrapModule(AppModule)
    .catch((err) => {
      console.error(err);
    });
}
