import { SharedManager } from './shared-manager';
import * as browser from 'webextension-polyfill';

export class RuntimeService {
  isExtension;

  constructor() {
    // Check for browser extension environment
    this.isExtension = !!(globalThis.chrome?.runtime?.id);
  }

  async getManifest(): Promise<browser.Manifest.WebExtensionManifest> {
    if (this.isExtension) {
      return browser.runtime.getManifest();
    } else {
      // Default options are marked with *
      const response = await fetch('/manifest.webmanifest', {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
      });

      const manifest = await response.json();
      return manifest;
    }
  }
}
