import { Permission } from './interfaces';
import { PermissionStore } from './store/permission-store';

export class PermissionServiceShared {
  private store: PermissionStore;

  constructor() {
    this.store = new PermissionStore();
    this.store.load();
  }

  updatePermission(app: string, action: string, type: string) {
    if (!app || !action) {
      return;
    }

    let permissionSet = this.store.get(app);

    let permission: Permission = {
      action: action,
      type: type,
      created: Math.round(Date.now() / 1000),
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
    this.store.save();
  }
}
