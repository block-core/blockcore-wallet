import { ActionMessageResponse, Permission } from '../../angular/src/shared/interfaces';
import { BackgroundManager, ProcessResult } from '../../angular/src/shared/background-manager';
import { SharedManager } from '../../angular/src/shared/shared-manager';
import { RunState } from '../../angular/src/shared/task-runner';
import { WalletStore } from '../../angular/src/shared/store/wallet-store';
import { PermissionServiceShared } from '../../angular/src/shared/permission.service';
import * as browser from 'webextension-polyfill';
import { ActionState, Handlers } from '../../angular/src/shared';
import { Mutex } from 'async-mutex';

// let state: ActionState;
let prompt: any | null;
let promptMutex = new Mutex();
let releaseMutex = () => {};
let permissionService = new PermissionServiceShared();
let watchManager: BackgroundManager | null;
let networkManager: BackgroundManager;
let indexing = false;
let shared = new SharedManager();
const networkUpdateInterval = 45000;
let walletStore: WalletStore;

// Since the mutex happens right before popup is shown, we need to keep more than a single entry available.
// let prompts: ActionState[] = [];

// Don't mark this method async, it will result in caller not being called in "sendResponse".
browser.runtime.onMessage.addListener(async (msg: ActionMessageResponse, sender) => {
  console.log('Receive message in background:', msg);

  // When messages are coming from popups, the prompt will be set.
  if (msg.prompt) {
    return handlePromptMessage(msg, sender);
  } else if (msg.source == 'provider') {
    return handleContentScriptMessage(msg);
  } else if (msg.source == 'tabs') {
    // Handle messages coming from the UI.
    if (msg.type === 'keep-alive') {
      // console.debug('Received keep-alive message.');
    } else if (msg.type === 'index') {
      await executeIndexer();
    } else if (msg.type === 'watch') {
      await runWatcher();
    } else if (msg.type === 'network') {
      await networkStatusWatcher();
    } else if (msg.type === 'activated') {
      // console.log('THE UI WAS ACTIVATED!!');
      // When UI is triggered, we'll also trigger network watcher.
      await networkStatusWatcher();
    }
  } else {
    console.log('Unhandled message:', msg);
  }
});

browser.runtime.onMessageExternal.addListener(async (message: ActionMessageResponse, sender) => {
  console.log('BACKGROUND:EXTERNAL:MSG:', message);
  let extensionId = new URL(sender.url!).host;
  message.app = extensionId;
  return handleContentScriptMessage(message);
});

async function handleContentScriptMessage(message: ActionMessageResponse) {
  console.log('handleContentScriptMessage:', message);
  // console.log('prompts:', JSON.stringify(ActionStateHolder.prompts));
  // console.log('prompts (length):', ActionStateHolder.prompts.length);

  // We only allow messages of type 'request' here.
  if (message.type !== 'request') {
    return null;
  }

  const method = message.args.method;
  const params = message.args.params[0]; // Currently we only support a single entry in params, just be array.
  console.log('METHOD:', method);
  console.log('PARAMS:', params);

  // Create a new handler instance.
  // const handler = Handlers.getAction(method);
  let id = Math.random().toString().slice(4);

  const state = new ActionState();
  state.id = message.id;
  state.id2 = id;
  state.handler = Handlers.getAction(method);
  state.message = message;

  // ActionStateHolder.prompts.push(state);

  // console.log('prompts:', JSON.stringify(ActionStateHolder.prompts));
  // console.log('prompts (length):', ActionStateHolder.prompts.length);

  // Reload the permissions each time.
  await permissionService.refresh();

  let permission: Permission | unknown | null = null;

  if (params.key) {
    console.log('FIND PERMISSION BY KEY', message.app, method, params.key);
    permission = permissionService.findPermissionByKey(message.app, method, params.key);
    console.log('FOUND PERMISSION BY KEY!!!', permission);
  } else {
    // Get all existing permissions that exists for this app and method:
    let permissions = permissionService.findPermissions(message.app, method);

    console.log('PERMISSIONS!!', permissions);

    // If there are no specific key specified in the signing request, just grab the first permission that is approved for this
    // website and use that. Normally there will only be a single one if the web app does not request specific key.
    if (permissions.length > 0) {
      permission = permissions[0];
    }
  }

  // permissionService.findPermission(message.app, method, message.walletId, message.accountId, message.keyId);
  // let permissionSet = permissionService.get(message.app);

  // if (permissionSet) {
  //   permission = permissionSet.permissions[method];
  // }

  // Check if user have already approved this kind of access on this domain/host.
  if (!permission) {
    try {
      console.log(JSON.stringify(state));
      // Keep a copy of the prompt message, we need it to finalize if user clicks "X" to close window.
      // state.promptPermission = await promptPermission({ app: message.app, id: message.id, method: method, params: message.args.params });
      permission = await promptPermission(state);
      console.log('PERMISSION:', permission);
      console.log(JSON.stringify(state));
      // authorized, proceed
    } catch (_) {
      console.log(JSON.stringify(state));
      console.log('NO PERMISSION!!');
      // not authorized, stop here
      return {
        error: { message: `Insufficient permissions, required "${method}".` },
      };
    }
  } else {
    // TODO: This logic can be put into the query into permission set, because permissions
    // must be stored with more keys than just "action", it must contain wallet/account and potentially keyId.

    // If there exists an permission, verify that the permission applies to the specified (or active) wallet and account.
    // If the caller has supplied walletId and accountId, use that.
    if (message.walletId && message.accountId) {
    } else {
      // If nothing is supplied, verify against the current active wallet/account.
    }
  }

  // console.log('AUTHORIZED22!!', state.handler);

  try {
    // User have given permission to execute.
    console.log('VERIFY:', message);
    console.log('VERIFY2:', state);
    console.log('VERIFY3:', permission);
    const result = state.handler.execute(permission, message.args.params);

    console.log('RESULT RETURNING:', result);

    return result;
    // switch (method) {
    //   case 'request': {
    //     return 'Your REQUEST!';
    //     // return getPublicKey(sk);
    //   }
    //   case 'publicKey': {
    //     return 'Your Public Key!';
    //     // return getPublicKey(sk);
    //   }
    //   case 'sign': {
    //     return 'Signature!';
    //     // let { event } = params;
    //     // if (!event.pubkey) event.pubkey = getPublicKey(sk);
    //     // if (!event.id) event.id = getEventHash(event);
    //     // if (!validateEvent(event)) return { error: 'invalid event' };
    //     // return await signEvent(event, sk);
    //   }
    //   case 'encrypt': {
    //     // let { peer, plaintext } = params;
    //     // return encrypt(sk, peer, plaintext);
    //     return 'encrypt';
    //   }
    //   case 'decrypt': {
    //     // let { peer, ciphertext } = params;
    //     // return decrypt(sk, peer, ciphertext);
    //     return 'decrypt';
    //   }
    // }
  } catch (error) {
    return { error: { message: error.message, stack: error.stack } };
  }
}

function handlePromptMessage(message: ActionMessageResponse, sender) {
  // console.log('handlePromptMessage!!!:', message);
  // console.log('prompts:', JSON.stringify(ActionStateHolder.prompts));
  // console.log('prompts (length):', ActionStateHolder.prompts.length);

  // var stateIndex = ActionStateHolder.prompts.findIndex((p) => p.id === message.id);
  // console.log('STATE INDEX:', stateIndex);

  // var state = ActionStateHolder.prompts[stateIndex];

  // console.log('MESSAGE ID:', message.id);
  // console.log('STATE:', state);

  // console.log('MESSAGE .PERMISSION', message.permission);

  // Create an permission instance from the message received from prompt dialog:
  const permission = permissionService.createPermission(message);

  switch (message.permission) {
    case 'forever':
    case 'expirable':
      // const permission = permissionService.persistPermission(permission); // .updatePermission(message.app, message.type, message.permission, message.walletId, message.accountId, message.keyId, message.key);
      permissionService.persistPermission(permission);
      prompt?.resolve?.(permission);
      // prompts[message.id]?.resolve?.();
      break;
    case 'once':
      prompt?.resolve?.(permission);
      break;
    case 'no':
      prompt?.reject?.();
      break;
  }

  prompt = null;
  releaseMutex();
  // console.log('MUTEX UNLOCKED!!!!');

  // console.log('REMOVING PROMPT FROM ARRAY!!!!', stateIndex);
  // ActionStateHolder.prompts.splice(stateIndex, 1);

  if (sender) {
    // Remove the popup window that was opened:
    browser.windows.remove(sender.tab.windowId);
  }
}

async function promptPermission(state: ActionState) {
  console.log('MUTEX BEGIN!');
  releaseMutex = await promptMutex.acquire();
  console.log('MUTEX RELEASED!!');

  // let qs = new URLSearchParams({
  //   app: state.message.app,
  //   action: state.message.args.method,
  //   id: state.id,
  //   args: JSON.stringify(state.message.args.params),
  // });

  let qs = new URLSearchParams({
    app: state.message.app,
    action: state.message.args.method,
    id: state.message.id,
    args: JSON.stringify(state.message.args.params),
  });

  return new Promise((resolve, reject) => {
    // Set the global prompt object:
    prompt = { resolve, reject };

    browser.windows.create({
      url: `${browser.runtime.getURL('index.html')}?${qs.toString()}`,
      type: 'popup',
      width: 628,
      height: 800,
    });
    // .then((w) => {
    //   console.log('POPUP CREATE CALLBACK STATE:', state);
    //   // Keep track of the prompt based upon the window ID.
    //   state.windowId = w.id;
    // });
  });

  // console.log('Setting the promptPermission!!');
  // state.promptPermission = p;

  // return p;
}

browser.windows.onRemoved.addListener(function (windowId) {
  if (prompt) {
    prompt?.reject?.();
    prompt = null;
    releaseMutex();
    console.log('PROMPT EMPTY, PROMPT REJECT, RELEASE MUTEX!');
  } else {
    console.log('ALREADY FINISHED!');
  }

  // console.log('prompts:', JSON.stringify(ActionStateHolder.prompts));
  // console.log('prompts (length):', ActionStateHolder.prompts.length);

  // var stateIndex = ActionStateHolder.prompts.findIndex((p) => p.windowId === windowId);
  // console.log('STATE INDEX ON REMOVED WINDOW:', stateIndex);

  // if (stateIndex > -1) {
  //   var state = ActionStateHolder.prompts[stateIndex];
  //   // If the state has not been processed yet, it means user clicked X and did not follow normal flow.
  //   console.log('WE MUST HANDLE EXIT!!', windowId);

  //   console.log('STATE IN WINDOW CLOSE', state);

  //   // Important that we set the permission so the promise is rejected.
  //   state.message.permission = 'no';

  //   // Handle the prompt message.
  //   handlePromptMessage(state.message, null);

  //   // We should reject the prompt permission and allow that logic to continue where it is halting:
  //   // state.prompt.reject();
  //   // state.promptPermission.reject();
  //   //
  //   // ActionStateHolder.prompts.splice(stateIndex, 1);
  // } else {
  //   console.log('WE DONT NEED TO HANDLE EXIT!', windowId);
  // }

  // if (promptId === windowId) {
  //   // The closed window was the prompt window, verify if we must unlock the mutex:
  //   console.log('WE MUST HANDLE EXIT!!', windowId);

  //   handlePromptMessage(promptMessage, null);
});

// Run when the browser has been fully exited and opened again.
browser.runtime.onStartup.addListener(async () => {
  console.log('Extension: onStartup');
});

chrome.runtime.onSuspend.addListener(() => {
  console.log('Extension: onSuspend.');
});

async function getTabId() {
  var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0].id;
}

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  console.debug('onInstalled', reason);

  // Periodic alarm that will check if wallet should be locked.
  chrome.alarms.get('periodic', (a) => {
    if (!a) chrome.alarms.create('periodic', { periodInMinutes: 1 });
  });

  // The index alarm is used to perform background scanning of the
  // whole address space of all wallets. This will check used addresses
  // that might have received transactions after used the first time.
  // TODO: Log the last UI activation date and increase the period by the time since
  // UI was last activated. If it's 1 hour since last time, set the periodInMinutes to 60.
  // And if user has not used the extension UI in 24 hours, then set interval to 24 hours.
  chrome.alarms.get('index', (a) => {
    if (!a) chrome.alarms.create('index', { periodInMinutes: 10 });
  });

  if (reason === 'install') {
    // Open a new tab for initial setup, before we wait for network status watcher.
    chrome.tabs.create({ url: 'index.html' });
    await networkStatusWatcher();
    await executeIndexer();
  } else if (reason === 'update') {
    chrome.tabs.create({ url: 'index.html' });
    // Run a full indexing when the extension has been updated/reloaded.
    await networkStatusWatcher();
    await executeIndexer();
  }
});

chrome.alarms.onAlarm.addListener(async (alarm: chrome.alarms.Alarm) => {
  // console.debug('onAlarm', alarm);

  if (alarm.name === 'periodic') {
    await shared.checkLockTimeout();
  } else if (alarm.name === 'index') {
    await executeIndexer();
  }
});

// chrome.runtime.onMessage.addListener(async (req, sender) => {
//   let { prompt } = req;

//   if (prompt) {
//     console.log('handlePromptMessage');
//     // return handlePromptMessage(req, sender);
//   } else {
//     console.log('handleContentScriptMessage');
//     // return handleContentScriptMessage(req);
//   }
// });

// chrome.runtime.onMessage.addListener(async (message: Message, sender, sendResponse) => {

// });

// let store = new NetworkStatusStore();
let networkWatcherRef;

const networkStatusWatcher = async () => {
  // const manifest = chrome.runtime.getManifest();

  if (networkWatcherRef) {
    globalThis.clearTimeout(networkWatcherRef);
    networkWatcherRef = null;
  }

  if (networkManager == null) {
    networkManager = new BackgroundManager();
  }

  var interval = async () => {
    // We don't have the Angular environment information available in the service worker,
    // so we'll default to the default blockcore accounts, which should include those that
    // are default on CoinVault.
    await networkManager.updateNetworkStatus('blockcore');

    chrome.runtime.sendMessage(
      {
        type: 'network-updated',
        data: { source: 'network-status-watcher' },
        ext: 'blockcore',
        source: 'background',
        target: 'tabs',
        host: location.host,
      },
      function (response) {
        // console.log('Extension:sendMessage:response:indexed:', response);
      }
    );

    // Continue running the watcher if it has not been cancelled.
    networkWatcherRef = globalThis.setTimeout(interval, networkUpdateInterval);
  };

  // First interval we'll wait for complete run.
  await interval();

  // networkWatcherRef = globalThis.setTimeout(async () => {
  //     await interval();
  // }, 0);
};

const executeIndexer = async () => {
  // If we are already indexing, simply ignore this request.
  if (indexing) {
    return;
  }

  indexing = true;
  await runIndexer();
  indexing = false;

  // When the indexer has finished, run watcher automatically.
  await runWatcher();
};

const runIndexer = async () => {
  // Stop and ensure watcher doesn't start up while indexer is running.
  if (watchManager) {
    watchManager.onStopped = () => {};
    watchManager.stop();
    watchManager = null;
  }

  // Whenever indexer is executed, we'll create a new manager.
  let manager: any = new BackgroundManager();
  manager.onUpdates = (status: ProcessResult) => {
    if (status.changes) {
      console.log('Indexer found changes. Send message!');

      chrome.runtime.sendMessage(
        {
          type: 'indexed',
          data: { source: 'indexer-on-schedule' },
          ext: 'blockcore',
          source: 'background',
          target: 'tabs',
          host: location.host,
        },
        function (response) {
          // console.log('Extension:sendMessage:response:indexed:', response);
        }
      );
    } else {
      console.log('Indexer found zero changes. We will still inform the UI to refresh wallet to get latest scan state.');

      chrome.runtime.sendMessage(
        {
          type: 'updated',
          data: { source: 'indexer-on-schedule' },
          ext: 'blockcore',
          source: 'background',
          target: 'tabs',
          host: location.host,
        },
        function (response) {
          // console.log('Extension:sendMessage:response:updated:', response);
        }
      );
    }
  };

  await manager.runIndexer();

  // Reset the manager after full indexer run.
  manager = null;
};

const runWatcher = async () => {
  // If we are indexing, simply ignore all calls to runWatcher.
  if (indexing) {
    return;
  }

  // If there are multiple requests incoming to stop the watcher at the same time
  // they will all simply mark the watch manager to stop processing, which will
  // automatically start a new instance when finished.
  if (watchManager != null) {
    // First stop the existing watcher process.
    watchManager.stop();
    // console.log('Calling to stop watch manager...');
  } else {
    watchManager = new BackgroundManager();

    // Whenever the manager has successfully stopped, restart the watcher process.
    watchManager.onStopped = () => {
      // console.log('Watch Manager actually stopped, re-running!!');
      watchManager = null;
      runWatcher();
    };

    watchManager.onUpdates = (status: ProcessResult) => {
      if (status.changes) {
        console.log('Watcher found changes. Sending message to UI!');

        chrome.runtime.sendMessage(
          {
            type: 'indexed',
            data: { source: 'watcher' },
            ext: 'blockcore',
            source: 'background',
            target: 'tabs',
            host: location.host,
          },
          function (response) {
            // console.log('Extension:sendMessage:response:indexed:', response);
          }
        );
      } else {
        console.debug('Watcher found zero changes. We will still inform the UI to refresh wallet to get latest scan state.');

        chrome.runtime.sendMessage(
          {
            type: 'updated',
            data: { source: 'watcher' },
            ext: 'blockcore',
            source: 'background',
            target: 'tabs',
            host: location.host,
          },
          function (response) {
            // console.log('Extension:sendMessage:response:updated:', response);
          }
        );
      }
    };

    let runState: RunState = {};

    await watchManager.runWatcher(runState);
  }
};

// // For future usage when Point-of-Sale window is added, opening the window should just focus that tab.
// await chrome.tabs.update(tabs[0].id, { active: true });

// // Setting the badge
// await chrome.action.setBadgeText({ text: '44' });
// await chrome.action.setBadgeBackgroundColor({ color: 'red' });
