import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, Input } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DisableRightClickService {
  constructor(@Inject(DOCUMENT) private document: Document) { }
  disableRightClick() {
      this.document.addEventListener("contextmenu", (event) => {
          var element = event.target as HTMLElement;
          if (element.tagName != "INPUT" && element.tagName != "TEXTAREA") {
            event.preventDefault();
          }
      }, false);
  }
}
