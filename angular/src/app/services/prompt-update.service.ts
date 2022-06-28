import { Injectable } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

@Injectable()
export class PromptUpdateService {
  constructor(updates: SwUpdate) {
    updates.available.subscribe((event) => {
    //   if (promptUser(event)) {
    //     updates.activateUpdate().then(() => document.location.reload());
    //   }
    });
  }
}
