import { ActionMessageResponse, Permission, PermissionDomain } from './interfaces';
import { PermissionStore } from './store/permission-store';

export class PermissionServiceShared {
  private store: PermissionStore;

  constructor() {
    this.store = new PermissionStore();
    this.store.load();
  }

  get(app: string) {
    return this.store.get(app);
  }

  /** Will reload the permissions, and remove permissions that has timed out. */
  async refresh() {
    await this.store.load();
    const permissions = this.store.all();

    for (let i = 0; i < permissions.length; i++) {
      var updated = false;
      const permissionSet = permissions[i];

      for (let permission in permissionSet.permissions) {
        if (permissionSet.permissions[permission].type === 'expirable' && permissionSet.permissions[permission].created < Date.now() / 1000 - 5 * 60) {
          delete permissionSet.permissions[permission];
          updated = true;
        }
      }

      if (updated) {
        this.store.set(permissionSet.app, permissionSet);
        await this.store.save();
      }
    }

    return permissions;
  }

  createPermission(message: ActionMessageResponse) {
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

  findPermissionIndexInSet(permissionSet: PermissionDomain, action: string, walletId: string, accountId: string, keyId: string) {
    const permissions = permissionSet.permissions[action] as Permission[];
    const permissionIndex = permissions.findIndex((p) => p.walletId == walletId && p.accountId == accountId && p.keyId == keyId);
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

  findPermissions(app: string, action: string) {
    let permissionSet = this.store.get(app);

    console.log(`PERMISSION SET FOR ${app}`, permissionSet);

    if (!permissionSet) {
      return [];
    }

    return permissionSet.permissions[action];
  }

  async persistPermission(permission: Permission) {
    let permissionSet = this.store.get(permission.app);

    console.log('PERMISSION SET BEFORE:');
    console.log(JSON.stringify(permissionSet));

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
      const permissions = permissionSet.permissions[permission.action] as Permission[];

      const permissionIndex = this.findPermissionIndexInSet(permissionSet, permission.action, permission.walletId, permission.accountId, permission.keyId);
      // const permissionIndex = permissions.findIndex((p) => p.walletId == permission.walletId && p.accountId == permission.accountId && p.keyId == permission.keyId);

      // Replace existing permission if exists.
      if (permissionIndex > -1) {
        permissions[permissionIndex] = permission;
      } else {
        permissions.push(permission);
      }
    }

    this.store.set(permission.app, permissionSet);
    await this.store.save();

    console.log('PERMISSION SET AFTER:');
    console.log(JSON.stringify(permissionSet));
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
