import { PermissionExecution } from '../interfaces';
import { StoreListBase } from './store-base';

export class PermissionExecutionStore extends StoreListBase<PermissionExecution> {
  constructor() {
    super('permissionexecution');
  }
}
