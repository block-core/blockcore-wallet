import { HDKey } from '@scure/bip32';
import { ActionMessageResponse, Message, Permission } from '../../angular/src/shared/interfaces';
import { BackgroundManager, ProcessResult } from '../../angular/src/shared/background-manager';
import { SharedManager } from '../../angular/src/shared/shared-manager';
import { RunState } from '../../angular/src/shared/task-runner';
import { WalletStore } from '../../angular/src/shared/store/wallet-store';
import { PermissionStore } from '../../angular/src/shared/store/permission-store';
import { PermissionServiceShared } from '../../angular/src/shared/permission.service';
import * as browser from 'webextension-polyfill';
import { PERMISSIONS } from '../../angular/src/app/shared/constants';

const prompts = {};
let watchManager: BackgroundManager = new BackgroundManager();
let permissionStore = new PermissionStore();
let permissionService = new PermissionServiceShared();

// Don't mark this method async, it will result in caller not being called in "sendResponse".
browser.runtime.onMessage.addListener(async (msg: ActionMessageResponse, sender) => {
  console.log('BACKGROUND:MSG:', msg);

  if (msg.prompt) {
    console.log('handlePromptMessage!!');
    return handlePromptMessage(msg, sender);
  } else {
    console.log('handleContentScriptMessage!!');
    return handleContentScriptMessage(msg);
  }
});

browser.runtime.onMessageExternal.addListener(async (message: ActionMessageResponse, sender) => {
  console.log('BACKGROUND:EXTERNAL:MSG:', message);
  let extensionId = new URL(sender.url!).host;
  message.app = extensionId;
  handleContentScriptMessage(message); // { message.type, message.params, host: extensionId }
});

// browser.runtime.onMessageExternal.addListener(async (req, sender) => {
//   console.log('BACKGROUND:EXTERNAL:MSG:', req);
//   let extensionId = new URL(sender.url!).host;
//   console.log('EXTERNAL: handleContentScriptMessage222!!');

//   const result = {
//     result: 'ok!',
//   };

//   console.log('RETURNING: ', result);

//   return result;

//   // handleContentScriptMessage({type, params, host: extensionId})
// });

async function handleContentScriptMessage(message: ActionMessageResponse) {
  debugger;
  // { type, params, host }
  // Reload the permissions each time.
  permissionStore.load();

  let permission: Permission | null = null;
  let permissionSet = permissionStore.get(message.app);

  console.log('PermissionSet:', permissionSet);

  if (permissionSet) {
    permission = permissionSet.permissions[message.action];
  }

  // Check if user have already approved this kind of access on this domain/host.
  if (permission) {
    console.log('User already granted permission.');
  } else {
    try {
      await promptPermission(message.app, message.action, message.args);
      // authorized, proceed
    } catch (_) {
      // not authorized, stop here
      return {
        error: `insufficient permissions, required ${message.action}`,
      };
    }
  }

  try {
    switch (message.action) {
      case 'publicKey': {
        return watchManager.performTask();
        // return getPublicKey(sk);
      }
      case 'sign': {
        // let { event } = params;

        // if (!event.pubkey) event.pubkey = getPublicKey(sk);
        // if (!event.id) event.id = getEventHash(event);

        // if (!validateEvent(event)) return { error: 'invalid event' };
        return watchManager.performTask();
        // return await signEvent(event, sk);
      }
      case 'encrypt': {
        // let { peer, plaintext } = params;
        // return encrypt(sk, peer, plaintext);
        return 'encrypt';
      }
      case 'decrypt': {
        // let { peer, ciphertext } = params;
        // return decrypt(sk, peer, ciphertext);
        return 'decrypt';
      }
    }
  } catch (error) {
    return { error: { message: error.message, stack: error.stack } };
  }

  // if (!currentLevel) {
  //   currentLevel = 0;
  // }

  // if (currentLevel >= PERMISSIONS[type]) {
  // }

  // PERMISSIONS[type];

  // let currentLevel = await readPermissionLevel(host);
  // let level = await readPermissionLevel(host);

  // if (level >= PERMISSIONS_REQUIRED[type]) {
  //   // authorized, proceed
  // } else {
  //   // ask for authorization
  //   try {
  //     await promptPermission(host, PERMISSIONS_REQUIRED[type], params);
  //     // authorized, proceed
  //   } catch (_) {
  //     // not authorized, stop here
  //     return {
  //       error: `insufficient permissions, required ${PERMISSIONS_REQUIRED[type]}`,
  //     };
  //   }
  // }

  // let results = await browser.storage.local.get('private_key');
  // if (!results || !results.private_key) {
  //   return { error: 'no private key found' };
  // }

  // let sk = results.private_key;
}

function handlePromptMessage(message: ActionMessageResponse, sender) {
  switch (message.permission) {
    case 'forever':
    case 'expirable':
      prompts[message.id]?.resolve?.();
      permissionService.updatePermission(message.app, message.action, message.permission);
      break;
    case 'single':
      prompts[message.id]?.resolve?.();
      break;
    case 'no':
      prompts[message.id]?.reject?.();
      break;
  }

  delete prompts[message.id];
  browser.windows.remove(sender.tab.windowId);
}

function promptPermission(app, action, args) {
  let id = Math.random().toString().slice(4);

  console.log('CHECK:');
  console.log(app);
  console.log(action);
  console.log(args);
  console.log('QS:', JSON.stringify(args));

  let qs = new URLSearchParams({
    app,
    action,
    id,
    args: JSON.stringify(args),
  });

  return new Promise((resolve, reject) => {
    browser.windows.create({
      url: `${browser.runtime.getURL('index.html')}?${qs.toString()}`,
      type: 'popup',
      width: 600,
      height: 600,
    });

    prompts[id] = { resolve, reject };
    console.log('promts:', prompts);
  });
}

export const PERMISSIONS_REQUIRED = {
  getPublicKey: 1,
  signEvent: 10,
  encrypt: 20,
  decrypt: 20,
};

const ORDERED_PERMISSIONS = [
  [1, ['getPublicKey']],
  [10, ['signEvent']],
  [20, ['encrypt']],
  [20, ['decrypt']],
];

const PERMISSION_NAMES = {
  getPublicKey: 'read your public key',
  signEvent: 'sign events using your private key',
  encrypt: 'encrypt messages to peers',
  decrypt: 'decrypt messages from peers',
};

export function getAllowedCapabilities(permission) {
  let requestedMethods = [];
  for (let i = 0; i < ORDERED_PERMISSIONS.length; i++) {
    let [perm, methods] = ORDERED_PERMISSIONS[i];
    if (perm > permission) break;
    requestedMethods = requestedMethods.concat(methods as any);
  }

  if (requestedMethods.length === 0) return 'nothing';

  return requestedMethods.map((method) => PERMISSION_NAMES[method]);
}

export async function readPermissions() {
  let { permissions = {} } = await browser.storage.local.get('permissions');

  // delete expired
  var needsUpdate = false;
  for (let app in permissions) {
    if (permissions[app].condition === 'expirable' && permissions[app].created_at < Date.now() / 1000 - 5 * 60) {
      delete permissions[app];
      needsUpdate = true;
    }
  }
  if (needsUpdate) browser.storage.local.set({ permissions });

  return permissions;
}
