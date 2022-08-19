import { SharedManager } from './shared-manager';

export class RuntimeService {
  isExtension;

  constructor() {
    this.isExtension = globalThis.chrome && globalThis.chrome.runtime && globalThis.chrome.tabs;
  }

  async getManifest(): Promise<chrome.runtime.Manifest> {
    if (this.isExtension) {
      return chrome.runtime.getManifest();
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
