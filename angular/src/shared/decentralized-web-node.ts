import { Dwn } from '@tbd54566975/dwn-sdk-js';

export class DecentralizedWebNode {
  dwn: Dwn;

  constructor() {}

  async load() {
    if (!this.dwn) {
      this.dwn = await Dwn.create({});
    }
  }
}
