import { AUTO_TIMEOUT, INDEXER_URL, VAULT_URL } from '../../app/shared/constants';
import { Settings } from '../interfaces';
import { StoreBase } from './store-base';
import { environment } from '../../environments/environment';

export class SettingStore extends StoreBase<Settings> {
  constructor() {
    super('setting');
  }

  override defaultItem() {
    let serverGroup = 'group1';

    if (environment.instance === 'coinvault') {
      serverGroup = 'group2';
    }

    return {
      autoTimeout: AUTO_TIMEOUT,
      indexer: INDEXER_URL,
      dataVault: VAULT_URL,
      server: serverGroup,
      theme: 'dark',
      themeColor: 'primary',
      language: 'en',
      amountFormat: 'bitcoin',
      developer: false,
    };
  }
}
