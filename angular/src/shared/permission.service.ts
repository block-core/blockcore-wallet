import { ActionMessage, Permission, PermissionDomain } from './interfaces';
import { PermissionExecutionStore } from './store/permission-execution-store';
import { PermissionStore } from './store/permission-store';

export class PermissionServiceShared {
  private store: PermissionStore;
  private storeExecutions: PermissionExecutionStore;

  constructor() {
    this.store = new PermissionStore();
    this.store.load();

    this.storeExecutions = new PermissionExecutionStore();
    this.storeExecutions.load();
  }

  get(app: string) {
    return this.store.get(app);
  }

  /** Will reload the permissions, and remove permissions that has timed out. */
  async refresh() {
    await this.store.load();
    await this.storeExecutions.load();
    const permissions = this.store.all();

    for (let i = 0; i < permissions.length; i++) {
      var updated = false;
      const permissionSet = permissions[i];

      for (let permission in permissionSet.permissions) {
        const perms = permissionSet.permissions[permission];

        for (let j = 0; j < perms.length; j++) {
          const perm = perms[j];

          if (perm.type === 'expirable' && perm.created < Date.now() / 1000 - 1 * 60) {
            await this.removeExecution(perm); // Remove the execution history for this permission.
            perms.splice(j, 1);
            // delete permissionSet.permissions[permission];
            updated = true;
          }
        }
      }

      if (updated) {
        this.store.set(permissionSet.app, permissionSet);
        await this.store.save();
      }
    }

    return permissions;
  }

  createPermission(message: ActionMessage) {
    let permission: Permission = {
      app: message.app,
      action: message.type,
      type: message.permission,
      created: Math.round(Date.now() / 1000),
      walletId: message.walletId,
      accountId: message.accountId,
      keyId: message.keyId,
      key: message.key,
    };

    return permission;
  }

  async increaseExecution(permission: Permission) {
    if (!permission) {
      return -1;
    }

    const key = PermissionStore.permissionKey(permission);

    let executions = this.storeExecutions.get(key);

    if (!executions) {
      executions = {
        key: key,
        executions: 0,
      };
    }

    ++executions.executions;

    this.storeExecutions.set(key, executions);
    await this.storeExecutions.save();
    return executions.executions;
  }

  async resetExecution(permission: Permission) {
    const key = PermissionStore.permissionKey(permission);
    let executions = this.storeExecutions.get(key);

    if (!executions) {
      executions = {
        key: key,
        executions: 0,
      };
    }

    executions.executions = 0;

    this.storeExecutions.set(key, executions);
    await this.storeExecutions.save();
  }

  async removeExecution(permission: Permission) {
    const key = PermissionStore.permissionKey(permission);
    this.storeExecutions.remove(key);
    await this.storeExecutions.save();
  }

  findPermissionIndexInSet(permissionSet: PermissionDomain, action: string, walletId: string, accountId: string, keyId: string) {
    const permissions = permissionSet.permissions[action] as Permission[];
    let permissionIndex = -1;

    if (!permissions) {
      return permissionIndex;
    }

    if (accountId && keyId) {
      permissionIndex = permissions.findIndex((p) => p.walletId == walletId && p.accountId == accountId && p.keyId == keyId);
    } else if (accountId) {
      permissionIndex = permissions.findIndex((p) => p.walletId == walletId && p.accountId == accountId && p.keyId == keyId);
    } else {
      permissionIndex = permissions.findIndex((p) => p.walletId == walletId);
    }

    return permissionIndex;
  }

  findPermissionIndexInSetByKey(permissionSet: PermissionDomain, action: string, key: string) {
    const permissions = permissionSet.permissions[action] as Permission[];
    if (!permissions) {
      return -1;
    }
    const permissionIndex = permissions.findIndex((p) => p.key == key);
    return permissionIndex;
  }

  findPermission(app: string, action: string, walletId: string, accountId: string, keyId: string) {
    let permissionSet = this.store.get(app);
    const permissionIndex = this.findPermissionIndexInSet(permissionSet, action, walletId, accountId, keyId);

    if (permissionIndex == -1) {
      return null;
    }

    return permissionSet.permissions[action][permissionIndex];
  }

  findPermissionByKey(app: string, action: string, key: string) {
    let permissionSet = this.store.get(app);

    if (!permissionSet) {
      return null;
    }

    const permissionIndex = this.findPermissionIndexInSetByKey(permissionSet, action, key);

    if (permissionIndex == -1) {
      return null;
    }

    return permissionSet.permissions[action][permissionIndex];
  }

  findPermissions(app: string, action: string) {
    let permissionSet = this.store.get(app);

    if (!permissionSet) {
      return [];
    }

    return permissionSet.permissions[action];
  }

  async persistPermission(permission: Permission) {
    let permissionSet = this.store.get(permission.app);

    if (!permissionSet) {
      permissionSet = {
        app: permission.app,
        permissions: {
          [permission.action]: [permission],
        },
      };
    } else {
      // let existingPermission = permissionSet.permissions.find((p: { level: number; }) => p.level == permission.level);
      // let permissions = existingPermission.permissions;

      for (let key in permissionSet.permissions) {
        console.log(key);
        // if (permissions[domain].condition === 'expirable' && permissions[domain].created < Date.now() / 1000 - 5 * 60) {
        //   delete permissions[domain];
        //   needsUpdate = true;
        // }
      }

      // First check if we already have an persisted permission for this exact key:
      let permissions = permissionSet.permissions[permission.action] as Permission[];

      // If the permissions for this action does not exists, create it and assign it.
      if (permissions == undefined || permissions == null) {
        permissions = [];
        permissionSet.permissions[permission.action] = permissions;
      }

      // This will return permission based upon either just walletId, walletId and accountId, or walletId, accountId and keyId.
      const permissionIndex = this.findPermissionIndexInSet(permissionSet, permission.action, permission.walletId, permission.accountId, permission.keyId);

      // Replace existing permission if exists.
      if (permissionIndex > -1) {
        permissions[permissionIndex] = permission;
      } else {
        permissions.push(permission);
      }
    }

    this.store.set(permission.app, permissionSet);
    await this.store.save();
  }

  // async updatePermission(app: string, action: string, type: string, walletId: string, accountId: string, keyId: string, key: string) {
  //   if (!app || !action) {
  //     return;
  //   }

  //   let permissionSet = this.store.get(app);

  //   let permission: Permission = {
  //     action: action,
  //     type: type,
  //     created: Math.round(Date.now() / 1000),
  //     walletId,
  //     accountId,
  //     keyId,
  //     key,
  //   };

  //   if (!permissionSet) {
  //     permissionSet = {
  //       app: app,
  //       permissions: {
  //         [action]: [permission],
  //       },
  //     };
  //   } else {
  //     // let existingPermission = permissionSet.permissions.find((p: { level: number; }) => p.level == permission.level);
  //     // let permissions = existingPermission.permissions;

  //     for (let key in permissionSet.permissions) {
  //       console.log(key);
  //       // if (permissions[domain].condition === 'expirable' && permissions[domain].created < Date.now() / 1000 - 5 * 60) {
  //       //   delete permissions[domain];
  //       //   needsUpdate = true;
  //       // }
  //     }

  //     permissionSet.permissions[action] = permission;

  //     // if (!existingPermission) {
  //     //   permissionSet.permissions[permission.level] = permission;
  //     // } else {
  //     //   permissionSet.permissions[permission.level] = permission;
  //     // }
  //   }

  //   this.store.set(app, permissionSet);
  //   await this.store.save();
  // }
}
