import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { TAB_ID } from './app/providers/tab-id.provider';
import { environment } from './environments/environment';

if (globalThis.chrome && globalThis.chrome.runtime && globalThis.chrome.tabs) {
  console.log('Blockcore Wallet is starting up in extension mode.');

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
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
  console.log('Blockcore Wallet is starting up in web mode.');

  if (environment.production) {
    enableProdMode();
  }

  platformBrowserDynamic()
    .bootstrapModule(AppModule)
    .catch((err) => {
      console.error(err);
    });
}
