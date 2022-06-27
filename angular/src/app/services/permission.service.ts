import { Injectable } from '@angular/core';
import { Permission } from 'src/shared';
import { PermissionStore } from 'src/shared/store/permission-store';
import { PERMISSIONS } from '../shared/constants';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  constructor(private store: PermissionStore) {}

  getLevel(permissionType: string): number {
    return PERMISSIONS[permissionType];
  }

  updatePermission(permission: Permission) {
    debugger;

    if (!permission) {
      return;
    }

    const domain = permission.domain;
    let permissionSet = this.store.get(permission.domain);

    if (!permissionSet) {
      debugger;
      permissionSet = {
        domain: domain,
        permissions: {
          [permission.level]: permission,
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

      permissionSet.permissions[permission.level] = permission;

      // if (!existingPermission) {
      //   permissionSet.permissions[permission.level] = permission;
      // } else {
      //   permissionSet.permissions[permission.level] = permission;
      // }
    }

    this.store.set(permission.domain, permissionSet);
    this.store.save();
  }
}
