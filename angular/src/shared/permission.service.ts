import { Permission } from './interfaces';
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

  async updatePermission(app: string, action: string, type: string, walletId: string, accountId: string, keyId?: string) {
    if (!app || !action) {
      return;
    }

    let permissionSet = this.store.get(app);

    let permission: Permission = {
      action: action,
      type: type,
      created: Math.round(Date.now() / 1000),
      walletId,
      accountId,
      keyId,
    };

    if (!permissionSet) {
      permissionSet = {
        app: app,
        permissions: {
          [action]: permission,
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

      permissionSet.permissions[action] = permission;

      // if (!existingPermission) {
      //   permissionSet.permissions[permission.level] = permission;
      // } else {
      //   permissionSet.permissions[permission.level] = permission;
      // }
    }

    this.store.set(app, permissionSet);
    await this.store.save();
  }
}
