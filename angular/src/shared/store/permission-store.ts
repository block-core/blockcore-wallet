import { Permission, PermissionDomain } from '../interfaces';
import { StoreListBase } from './store-base';

export class PermissionStore extends StoreListBase<PermissionDomain> {
  constructor() {
    super('permission');
  }

  static permissionKey(permission: Permission) {
    return `${permission.app}|${permission.action}|${permission.walletId}|${permission.accountId}|${permission.key}`;
  }
}
