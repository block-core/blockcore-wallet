import { Dwn } from '@tbd54566975/dwn-sdk-js';
import { Config } from '@tbd54566975/dwn-sdk-js/dist/esm/src/dwn';

export class DecentralizedWebNode {
  dwn: Dwn;

  constructor() {}

  async load() {
    if (!this.dwn) {
      this.dwn = await Dwn.create({});
    }
  }
}
