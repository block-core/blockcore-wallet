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
  handleContentScriptMessage(message);
});

async function handleContentScriptMessage(message: ActionMessageResponse) {
  // Reload the permissions each time.
  await permissionService.refresh();

  let permission: Permission | null = null;
  let permissionSet = permissionService.get(message.app);

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
        error: { message: `Insufficient permissions, required "${message.action}".` },
      };
    }
  }

  try {
    switch (message.action) {
      case 'publicKey': {
        return watchManager.performTask(true);
        // return getPublicKey(sk);
      }
      case 'sign': {
        // let { event } = params;
        // if (!event.pubkey) event.pubkey = getPublicKey(sk);
        // if (!event.id) event.id = getEventHash(event);
        // if (!validateEvent(event)) return { error: 'invalid event' };
        return watchManager.performTask(false);
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
}

function handlePromptMessage(message: ActionMessageResponse, sender) {
  switch (message.permission) {
    case 'forever':
    case 'expirable':
      prompts[message.id]?.resolve?.();
      permissionService.updatePermission(message.app, message.action, message.permission);
      break;
    case 'once':
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
