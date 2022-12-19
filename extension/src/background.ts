import { ActionMessage, ActionUrlParameters, Permission } from '../../angular/src/shared/interfaces';
import { BackgroundManager, ProcessResult } from '../../angular/src/shared/background-manager';
import { SharedManager } from '../../angular/src/shared/shared-manager';
import { RunState } from '../../angular/src/shared/task-runner';
import { WalletStore } from '../../angular/src/shared/store/wallet-store';
import { PermissionServiceShared } from '../../angular/src/shared/permission.service';
import * as browser from 'webextension-polyfill';
import { ActionState, DecentralizedWebNode, DomainVerification, Handlers } from '../../angular/src/shared';
import { Mutex } from 'async-mutex';
import { StorageService } from '../../angular/src/shared/storage.service';
import { RuntimeService } from '../../angular/src/shared/runtime.service';
import { NetworkLoader } from '../../angular/src/shared/network-loader';
import { MessageService } from '../../angular/src/shared';
import { EventBus } from '../../angular/src/shared/event-bus';

// let state: ActionState;
let prompt: any | null;
let promptMutex = new Mutex();
let releaseMutex = () => {};
let permissionService = new PermissionServiceShared();
let watchManager: BackgroundManager | null;
let networkManager: BackgroundManager;
let indexing = false;
let customActionResponse = undefined;

let networkLoader = new NetworkLoader();
let runtimeService = new RuntimeService();
let messageService = new MessageService(runtimeService, new EventBus());
let dwn = new DecentralizedWebNode();

let shared = new SharedManager(new StorageService(runtimeService), new WalletStore(), networkLoader, messageService);
const networkUpdateInterval = 45000;
let walletStore: WalletStore;

// Since the mutex happens right before popup is shown, we need to keep more than a single entry available.
// let prompts: ActionState[] = [];

// Don't mark this method async, it will result in caller not being called in "sendResponse".
browser.runtime.onMessage.addListener(async (msg: ActionMessage, sender) => {
  // We verify in both content.ts and here, simply because hostile website can always load the provider.ts if
  // they reference it directly manually.
  let verify = DomainVerification.verify(msg.app);

  if (verify == false) {
    console.warn('Request is not allowed on this domain.');
    return;
  }

  msg.verify = verify;

  // console.log('Receive message in background:', msg);

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
      // When we get the 'network' message, we'll scan network and then run index.
      await updateNetworkStatus();
      await executeIndexer();
    } else if (msg.type === 'activated') {
      // console.log('THE UI WAS ACTIVATED!!');
      // When UI is triggered, we'll also trigger network watcher.
      await networkStatusWatcher();
    } else if (msg.type === 'broadcast') {
      // Grab the content returned in this message and use as custom action response.
      customActionResponse = msg.response.response;

      // If there is an active prompt, it means we should resolve it with the broadcast result:
      if (prompt) {
        prompt?.resolve?.();
        prompt = null;
        releaseMutex();
      }

      // if (sender) {
      //   // Remove the popup window that was opened:
      //   browser.windows.remove(sender.tab.windowId);
      // }
    }
  } else {
    // console.log('Unhandled message:', msg);
  }
});

browser.runtime.onMessageExternal.addListener(async (msg: ActionMessage, sender) => {
  // We verify in both content.ts and here, simply because hostile website can always load the provider.ts if
  // they reference it directly manually.
  let verify = DomainVerification.verify(msg.app);

  if (verify == false) {
    console.warn('Request is not allowed on this domain.');
    return;
  }

  console.log('BACKGROUND:EXTERNAL:MSG:', msg);
  let extensionId = new URL(sender.url!).host;
  msg.app = extensionId;
  return handleContentScriptMessage(msg);
});

async function handleContentScriptMessage(message: ActionMessage) {
  // console.log('handleContentScriptMessage:', message);
  // We only allow messages of type 'request' here.
  if (message.type !== 'request') {
    return null;
  }

  const method = message.request.method;
  const params = message.request.params[0];

  // Create a new handler instance.
  // const handler = Handlers.getAction(method);
  let id = Math.random().toString().slice(4);

  // Ensure that we have a BackgroundManager available for the action handler.
  if (networkManager == null) {
    networkManager = new BackgroundManager(shared);
  }

  const state = new ActionState();
  state.id = message.id;
  state.id2 = id;

  // This will throw error if the action is not supported.
  state.handler = Handlers.getAction(method, networkManager); // watchManager can sometimes be null.
  state.message = message;

  // Make sure we reload wallets at this point every single process.
  // await this.walletStore.load();
  // await this.accountStateStore.load();
  // const wallets = this.walletStore.getWallets();
  // ActionStateHolder.prompts.push(state);

  // Use the handler to prepare the content to be displayed for signing.
  const prepare = await state.handler.prepare(state);
  state.content = prepare.content;

  let permission: Permission | unknown | null = null;

  if (prepare.consent) {
    // Reload the permissions each time.
    await permissionService.refresh();

    if (params?.key) {
      permission = permissionService.findPermissionByKey(message.app!, method, params.key);
    } else {
      // Get all existing permissions that exists for this app and method:
      let permissions = permissionService.findPermissions(message.app!, method) as any[];

      // If there are no specific key specified in the signing request, just grab the first permission that is approved for this
      // website and use that. Normally there will only be a single one if the web app does not request specific key.
      // This key is selected based upon app and method.
      if (permissions?.length > 0) {
        permission = permissions[0];
      }
    }

    // Check if user have already approved this kind of access on this domain/host.
    if (!permission) {
      try {
        // Keep a copy of the prompt message, we need it to finalize if user clicks "X" to close window.
        // state.promptPermission = await promptPermission({ app: message.app, id: message.id, method: method, params: message.args.params });
        permission = await promptPermission(state);
        // authorized, proceed
      } catch (err) {
        console.error('Permission not accepted: ', err);

        // When the user clicks X during a payment request, the user might still have completed the process, and
        // we should return a successful response here. For other actions, clicking X means "Cancel"/"Deny".

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
  }

  if (customActionResponse) {
    // Clone and clean.
    const customReturn = JSON.stringify(customActionResponse);
    customActionResponse = undefined;
    return JSON.parse(customReturn);
  }

  try {
    // User have given permission to execute.
    const result = await state.handler.execute(state, <Permission>permission);
    console.log('ACTION RESPONSE: ', result);

    // Increase the execution counter
    permissionService.increaseExecution(<Permission>permission);

    // If this execution required consent then display a notification.
    if (prepare.consent) {
      result.notification = `App executed ${(<Permission>permission).action}`;
    }

    return result;
  } catch (error) {
    return { error: { message: error.message, stack: error.stack } };
  }
}

function handlePromptMessage(message: ActionMessage, sender) {
  // console.log('handlePromptMessage!!!:', message);
  // Create an permission instance from the message received from prompt dialog:
  const permission = permissionService.createPermission(message);

  switch (message.permission) {
    case 'forever':
    case 'connect':
    case 'expirable':
      // const permission = permissionService.persistPermission(permission); // .updatePermission(message.app, message.type, message.permission, message.walletId, message.accountId, message.keyId, message.key);
      permissionService.persistPermission(permission);
      prompt?.resolve?.(permission);
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

  if (sender) {
    // Remove the popup window that was opened:
    browser.windows.remove(sender.tab.windowId);
  }
}

async function promptPermission(state: ActionState) {
  releaseMutex = await promptMutex.acquire();

  console.log('ActionState:', state);

  var parameters: ActionUrlParameters | any = {
    id: state.message.id,
    app: state.message.app!,
    action: state.message.request.method,
    content: JSON.stringify(state.content), // Content prepared by the handler to be displayed for user.
    params: JSON.stringify(state.message.request.params), // Params is used to display structured information for signing.
    verify: state.message.verify,
  };

  let qs = new URLSearchParams(parameters);

  return new Promise((resolve, reject) => {
    // Set the global prompt object:
    prompt = { resolve, reject };

    browser.windows.create({
      url: `${browser.runtime.getURL('index.html')}?${qs.toString()}`,
      type: 'popup',
      width: 628,
      height: 800,
    });
  });
}

browser.windows.onRemoved.addListener(function (windowId) {
  console.log('WINDOW ON REMOVED!!!');

  if (prompt) {
    console.log('REJECT THE PROMPT AND RELEASE MUTEX!!!');
    prompt?.reject?.();
    prompt = null;
    releaseMutex();
  }
});

// Run when the browser has been fully exited and opened again.
browser.runtime.onStartup.addListener(async () => {
  console.log('Extension: onStartup');
});

chrome.runtime.onSuspend.addListener(() => {
  console.log('Extension: onSuspend.');
});

chrome.runtime.onConnect.addListener((port) => {
  console.log('onConnect:', port);
});

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  // Initialize the Decentralized Web Node.
  await dwn.load();

  // console.debug('onInstalled', reason);

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
    // chrome.tabs.create({ url: 'index.html' });
    // Run a full indexing when the extension has been updated/reloaded.
    await networkStatusWatcher();
    await executeIndexer();
  }
});

chrome.alarms.onAlarm.addListener(async (alarm: chrome.alarms.Alarm) => {
  if (alarm.name === 'periodic') {
    await shared.checkLockTimeout();
  } else if (alarm.name === 'index') {
    await executeIndexer();
  }
});

let networkWatcherRef;

const updateNetworkStatus = async () => {
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

  // Whenever the network status has updated, also trigger indexer.
  // 2022-02-12: We don't need to force indexer it, it just adds too many extra calls to indexing.
  // await executeIndexer();
};

const networkStatusWatcher = async () => {
  // const manifest = chrome.runtime.getManifest();

  if (networkWatcherRef) {
    globalThis.clearTimeout(networkWatcherRef);
    networkWatcherRef = null;
  }

  if (networkManager == null) {
    networkManager = new BackgroundManager(shared);
  }

  var interval = async () => {
    await updateNetworkStatus();

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
  let manager: any = new BackgroundManager(shared);
  manager.onUpdates = (status: ProcessResult) => {
    if (status.changes) {
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
    watchManager = new BackgroundManager(shared);

    // Whenever the manager has successfully stopped, restart the watcher process.
    watchManager.onStopped = () => {
      // console.log('Watch Manager actually stopped, re-running!!');
      watchManager = null;
      runWatcher();
    };

    watchManager.onUpdates = (status: ProcessResult) => {
      if (status.changes) {
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
