import { NetworkStatus, StateEntry } from '../interfaces';
import { StoreBase } from './store-base';

export class StateStore extends StoreBase<StateEntry> {
  constructor() {
    super('state');
  }

  override defaultItem() {
    return {};
  }
}
