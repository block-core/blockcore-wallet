import { HDKey } from '@scure/bip32';
import { Message } from '../../angular/src/shared/interfaces';
import { BackgroundManager, ProcessResult } from '../../angular/src/shared/background-manager';
import { SharedManager } from '../../angular/src/shared/shared-manager';
import { RunState } from '../../angular/src/shared/task-runner';
import { WalletStore } from '../../angular/src/shared/store/wallet-store';
import * as browser from 'webextension-polyfill';

const prompts = {};
let watchManager: BackgroundManager = new BackgroundManager();

// Don't mark this method async, it will result in caller not being called in "sendResponse".
browser.runtime.onMessage.addListener(async (req, sender) => {
  console.log('BACKGROUND:MSG:', req);
  let { prompt } = req;
  // let promise: Promise<any> | null = null;
  // let result: any = null;

  if (prompt) {
    console.log('handlePromptMessage!!');
    return handlePromptMessage(req, sender);
  } else {
    console.log('handleContentScriptMessage!!');
    return handleContentScriptMessage(req);
  }

  // if (req.type === 'getpublickey') {
  //   result = await watchManager.performTask();
  // } else {
  //   console.log('UNKNOWN EVENT!');
  //   result = { error: `Event type ${req.type} is not handled.` };
  // }

  // return result;
});

browser.runtime.onMessageExternal.addListener(async ({ type, params }, sender) => {
  console.log('BACKGROUND:EXTERNAL:MSG:', type);
  let extensionId = new URL(sender.url!).host;
  handleContentScriptMessage({ type, params, host: extensionId });
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

async function handleContentScriptMessage({ type, params, host }) {
  let level = await readPermissionLevel(host);

  if (level >= PERMISSIONS_REQUIRED[type]) {
    // authorized, proceed
  } else {
    // ask for authorization
    try {
      await promptPermission(host, PERMISSIONS_REQUIRED[type], params);
      // authorized, proceed
    } catch (_) {
      // not authorized, stop here
      return {
        error: `insufficient permissions, required ${PERMISSIONS_REQUIRED[type]}`,
      };
    }
  }

  let results = await browser.storage.local.get('private_key');
  if (!results || !results.private_key) {
    return { error: 'no private key found' };
  }

  let sk = results.private_key;

  try {
    switch (type) {
      case 'publicKey': {
        return watchManager.performTask();
        // return getPublicKey(sk);
      }
      case 'sign': {
        let { event } = params;

        // if (!event.pubkey) event.pubkey = getPublicKey(sk);
        // if (!event.id) event.id = getEventHash(event);

        // if (!validateEvent(event)) return { error: 'invalid event' };
        return watchManager.performTask();
        // return await signEvent(event, sk);
      }
      case 'encrypt': {
        let { peer, plaintext } = params;
        // return encrypt(sk, peer, plaintext);
        return 'encrypt';
      }
      case 'decrypt': {
        let { peer, ciphertext } = params;
        // return decrypt(sk, peer, ciphertext);
        return 'decrypt';
      }
    }
  } catch (error) {
    return { error: { message: error.message, stack: error.stack } };
  }
}

function handlePromptMessage({ id, condition, host, level }, sender) {
  switch (condition) {
    case 'forever':
    case 'expirable':
      prompts[id]?.resolve?.();
      updatePermission(host, {
        level,
        condition,
      });
      break;
    case 'single':
      prompts[id]?.resolve?.();
      break;
    case 'no':
      prompts[id]?.reject?.();
      break;
  }

  delete prompts[id];
  browser.windows.remove(sender.tab.windowId);
}

function promptPermission(host, level, args) {
  let id = Math.random().toString().slice(4);

  let qs = new URLSearchParams({
    host,
    level,
    id,
    args: JSON.stringify(args),
  });

  console.log('QS:', qs);

  return new Promise((resolve, reject) => {
    browser.windows.create({
      url: `${browser.runtime.getURL('index.html')}?action=sign&${qs.toString()}`,
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

export function getPermissionsString(permission) {
  let capabilities = getAllowedCapabilities(permission);

  if (capabilities.length === 0) return 'none';
  if (capabilities.length === 1) return capabilities[0];

  const sliced = capabilities.slice(0, -1) as any;
  return sliced.join(', ') + ' and ' + capabilities[capabilities.length - 1];
}

export async function readPermissions() {
  let { permissions = {} } = await browser.storage.local.get('permissions');

  // delete expired
  var needsUpdate = false;
  for (let host in permissions) {
    if (permissions[host].condition === 'expirable' && permissions[host].created_at < Date.now() / 1000 - 5 * 60) {
      delete permissions[host];
      needsUpdate = true;
    }
  }
  if (needsUpdate) browser.storage.local.set({ permissions });

  return permissions;
}

export async function readPermissionLevel(host) {
  return (await readPermissions())[host]?.level || 0;
}

export async function updatePermission(host, permission) {
  const existingPermissions = await browser.storage.local.get('permissions');

  browser.storage.local.set({
    permissions: {
      ...(existingPermissions.permissions || {}),
      [host]: {
        ...permission,
        created_at: Math.round(Date.now() / 1000),
      },
    },
  });
}
