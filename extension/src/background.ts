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
import { Dwn, DataStream, DidKeyResolver, Jws, RecordsWrite, RecordsQuery } from '@tbd54566975/dwn-sdk-js';
import { Database } from '../../angular/src/shared/store/storage';

// let state: ActionState;
let prompt: any | null;
let promptMutex = new Mutex();
let releaseMutex = () => { };
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

// Message handler for extension messaging
// Use native chrome API with sendResponse for reliable async responses in MV3
chrome.runtime.onMessage.addListener((msg: ActionMessage, sender, sendResponse) => {
  // Handle async message processing
  (async () => {
    try {
      // Open the database.
      await Database.Instance.open();

      // We verify in both content.ts and here, simply because hostile website can always load the provider.ts if
      // they reference it directly manually.
      let verify = DomainVerification.verify(msg.app);

      if (verify == false) {
        console.warn('Request is not allowed on this domain.');
        sendResponse({ error: { message: 'Request is not allowed on this domain.' } });
        return;
      }

      msg.verify = verify;

      // console.log('Receive message in background:', msg);

      // When messages are coming from popups, the prompt will be set.
      if (msg.prompt) {
        if (msg.promptResponse) {
          customActionResponse = msg.promptResponse;
        }

        handlePromptMessage(msg, sender);
        sendResponse({ success: true });
        return;
      } else if (msg.source == 'provider') {
        const result = await handleContentScriptMessage(msg);
        console.log('MAIN HANDLER: Returning to content script:', result);
        sendResponse(result);
        return;
      } else if (msg.source == 'tabs') {
        // Handle messages coming from the UI.
        if (msg.type === 'keep-alive') {
          // console.debug('Received keep-alive message.');
          sendResponse({ success: true });
          return;
        } else if (msg.type === 'index') {
          await executeIndexer();
          sendResponse({ success: true });
          return;
        } else if (msg.type === 'watch') {
          await runWatcher();
          sendResponse({ success: true });
          return;
        } else if (msg.type === 'data:get') {
          await getDwnData(msg);
          sendResponse({ success: true });
          return;
        } else if (msg.type === 'network') {
          // When we get the 'network' message, we'll scan network and then run index.
          await updateNetworkStatus();
          await executeIndexer();
          sendResponse({ success: true });
          return;
        } else if (msg.type === 'activated') {
          // console.log('THE UI WAS ACTIVATED!!');
          // When UI is triggered, we'll also trigger network watcher.
          await networkStatusWatcher();
          sendResponse({ success: true });
          return;
        } else if (msg.type === 'broadcast') {
          // Grab the content returned in this message and use as custom action response.
          customActionResponse = msg.response.response;

          // If there is an active prompt, it means we should resolve it with the broadcast result:
          if (prompt) {
            prompt?.resolve?.();
            prompt = null;
            releaseMutex();
          }

          sendResponse({ success: true });
          return;
        }
        sendResponse({ success: true });
        return;
      } else {
        // console.log('Unhandled message:', msg);
        sendResponse({ error: { message: 'Unhandled message type' } });
        return;
      }
    } catch (error: any) {
      console.error('Error in message handler:', error);
      sendResponse({ error: { message: error.message } });
    }
  })();
  
  // Return true to indicate we will send response asynchronously
  return true;
});

chrome.runtime.onMessageExternal.addListener((msg: ActionMessage, sender, sendResponse): boolean => {
  (async () => {
    try {
      // We verify in both content.ts and here, simply because hostile website can always load the provider.ts if
      // they reference it directly manually.
      let verify = DomainVerification.verify(msg.app);

      if (verify == false) {
        console.warn('Request is not allowed on this domain.');
        sendResponse({ error: { message: 'Request not allowed' } });
        return;
      }

      console.log('BACKGROUND:EXTERNAL:MSG:', msg);
      let extensionId = new URL(sender.url!).host;
      msg.app = extensionId;
      const result = await handleContentScriptMessage(msg);
      sendResponse(result);
    } catch (error: any) {
      sendResponse({ error: { message: error.message } });
    }
  })();
  
  return true;
});

async function handleContentScriptMessage(message: ActionMessage) {
  console.log('handleContentScriptMessage:', message);
  
  // We only allow messages of type 'request' here.
  if (message.type !== 'request') {
    console.log('Message type is not request:', message.type);
    return { error: { message: 'Invalid message type' } };
  }

  const method = message.request.method;
  console.log('Processing method:', method);
  
  const params = message.request.params ? message.request.params[0] : undefined;

  // Create a new handler instance.
  let id = Math.random().toString().slice(4);

  // Ensure that we have a BackgroundManager available for the action handler.
  if (networkManager == null) {
    networkManager = new BackgroundManager(shared);
  }

  const state = new ActionState();
  state.id = message.id;
  state.id2 = id;

  try {
    // This will throw error if the action is not supported.
    state.handler = Handlers.getAction(method, networkManager);
  } catch (err: any) {
    console.error('Handler not found for method:', method, err);
    return { error: { message: `Unsupported method: ${method}` } };
  }
  
  state.message = message;

  // Use the handler to prepare the content to be displayed for signing.
  const prepare = await state.handler.prepare(state);
  state.content = prepare.content;

  console.log('Prepare result:', prepare);

  let permission: Permission | unknown | null = null;
  // console.log('Permission:', permission);

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
        console.log('No existing permission, prompting user...');
        // Keep a copy of the prompt message, we need it to finalize if user clicks "X" to close window.
        permission = await promptPermission(state);
        console.log('Permission granted:', permission);
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
      console.log('Existing permission found:', permission);
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
    console.log('Returning custom action response:', customActionResponse);
    const customReturn = JSON.stringify(customActionResponse);
    customActionResponse = undefined;
    return JSON.parse(customReturn);
  }

  try {
    const p = <Permission>permission;
    console.log('Executing handler with permission:', p);

    if (p) {
      const isKeyUnlocked = await networkManager.isKeyUnlocked(p.walletId);
      console.log('Key unlocked:', isKeyUnlocked);

      // The key is empty if the wallet is locked. Force user to unlock before we continue.
      if (p && prepare.consent && !isKeyUnlocked) {
        // Clone existing state for use with only unlocking.
        const unlockState = JSON.parse(JSON.stringify(state)) as ActionState;

        unlockState.message.request.method = 'wallet.unlock';
        unlockState.message.request.params = [{ walletId: p.walletId }];

        await promptUnlock(unlockState);
      }
    }

    // User have given permission to execute.
    const result = await state.handler.execute(state, p);
    console.log('ACTION RESPONSE: ', result);

    // Increase the execution counter
    const executions = await permissionService.increaseExecution(<Permission>permission);

    // If this execution required consent then display a notification.
    if (prepare.consent) {
      result.notification = `Blockcore Wallet: ${(<Permission>permission).action} (${executions})`;
    }

    console.log('Returning result:', result);
    return result;
  } catch (error: any) {
    console.error('Error executing handler:', error);
    return { error: { message: error.message, stack: error.stack } };
  }
}

async function promptUnlock(state: ActionState) {
  try {
    // Keep a copy of the prompt message, we need it to finalize if user clicks "X" to close window.
    // state.promptPermission = await promptPermission({ app: message.app, id: message.id, method: method, params: message.args.params });
    await promptPermission(state);
    // authorized, proceed
  } catch (err) {
    console.error('Permission not accepted: ', err);
  }
}

function handlePromptMessage(message: ActionMessage, sender: any) {
  console.log('handlePromptMessage:', message);
  // Create an permission instance from the message received from prompt dialog:
  const permission = permissionService.createPermission(message);
  console.log('Created permission:', permission);

  switch (message.permission) {
    case 'forever':
    case 'connect':
    case 'expirable':
      permissionService.persistPermission(permission);
      console.log('Resolving prompt with permission (persistent)');
      prompt?.resolve?.(permission);
      break;
    case 'once':
      console.log('Resolving prompt with permission (once)');
      prompt?.resolve?.(permission);
      break;
    case 'no':
      console.log('Rejecting prompt');
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
  // let url = `${browser.runtime.getURL('index.html')}?${qs.toString()}`;
  // console.log("url: ", url);

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
  if (prompt) {
    prompt?.reject?.();
    prompt = null;
    releaseMutex();
  }
});

// Run when the browser has been fully exited and opened again.
browser.runtime.onStartup.addListener(async () => {
  console.log('Extension: onStartup');
});

// Service worker suspend event - save any important state
// Note: onSuspend is Chrome-specific, use chrome namespace directly
if (typeof chrome !== 'undefined' && chrome.runtime?.onSuspend) {
  chrome.runtime.onSuspend.addListener(() => {
    console.log('Extension: onSuspend.');
  });
}

browser.runtime.onConnect.addListener((port) => {
  console.log('onConnect:', port);
});

browser.runtime.onInstalled.addListener(async ({ reason }) => {
  // Open the database.
  await Database.Instance.open();

  // Initialize the Decentralized Web Node.
  await dwn.load();

  // console.debug('onInstalled', reason);

  // Periodic alarm that will check if wallet should be locked.
  const periodicAlarm = await browser.alarms.get('periodic');
  if (!periodicAlarm) {
    await browser.alarms.create('periodic', { periodInMinutes: 1 });
  }

  // The index alarm is used to perform background scanning of the
  // whole address space of all wallets. This will check used addresses
  // that might have received transactions after used the first time.
  // TODO: Log the last UI activation date and increase the period by the time since
  // UI was last activated. If it's 1 hour since last time, set the periodInMinutes to 60.
  // And if user has not used the extension UI in 24 hours, then set interval to 24 hours.
  const indexAlarm = await browser.alarms.get('index');
  if (!indexAlarm) {
    await browser.alarms.create('index', { periodInMinutes: 10 });
  }

  if (reason === 'install') {
    // Open a new tab for initial setup, before we wait for network status watcher.
    await browser.tabs.create({ url: 'index.html' });
    await networkStatusWatcher();
    await executeIndexer();
  } else if (reason === 'update') {
    // await browser.tabs.create({ url: 'index.html' });
    // Run a full indexing when the extension has been updated/reloaded.
    await networkStatusWatcher();
    await executeIndexer();
  }
});

browser.alarms.onAlarm.addListener(async (alarm) => {
  // Open the database.
  await Database.Instance.open();

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

  // Note: Service workers don't have access to location.host, use runtime.id instead
  try {
    await browser.runtime.sendMessage({
      type: 'network-updated',
      data: { source: 'network-status-watcher' },
      ext: 'blockcore',
      source: 'background',
      target: 'tabs',
      host: browser.runtime.id,
    });
  } catch (e) {
    // Ignore errors when no listeners are registered
  }

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
    watchManager.onStopped = () => { };
    watchManager.stop();
    watchManager = null;
  }

  // Whenever indexer is executed, we'll create a new manager.
  let manager: any = new BackgroundManager(shared);
  manager.onUpdates = async (status: ProcessResult) => {
    try {
      if (status.changes) {
        await browser.runtime.sendMessage({
          type: 'indexed',
          data: { source: 'indexer-on-schedule' },
          ext: 'blockcore',
          source: 'background',
          target: 'tabs',
          host: browser.runtime.id,
        });
      } else {
        await browser.runtime.sendMessage({
          type: 'updated',
          data: { source: 'indexer-on-schedule' },
          ext: 'blockcore',
          source: 'background',
          target: 'tabs',
          host: browser.runtime.id,
        });
      }
    } catch (e) {
      // Ignore errors when no listeners are registered
    }
  };

  await manager.runIndexer();

  // Reset the manager after full indexer run.
  manager = null;
};

const getDwnData = async (msg: ActionMessage | any) => {
  const did = msg.data.did;
  console.log('Get data for DID: ', did);
  console.log(msg);

  // const didKey = await DidKeyResolver.generate(); // generate a did:key DID
  // const signatureMaterial = Jws.createSignatureInput(didKey);
  // // const data = randomBytes(32); // in node.js
  // // or in web
  // const data = Uint8Array.from(msg.data.data);

  // const query = await RecordsWrite.create({
  //   data,
  //   dataFormat: 'application/json',
  //   published: true,
  //   protocol: 'yeeter',
  //   schema: 'yeeter/post',
  //   authorizationSignatureInput: signatureMaterial,
  // });

  // const dataStream = DataStream.fromBytes(data);
  // const result = await dwn.dwn.processMessage(didKey.did, query.toJSON(), dataStream);
  // console.log(result);
  // dwn.dwn.processMessage('', msg, data);
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

    watchManager.onUpdates = async (status: ProcessResult) => {
      try {
        if (status.changes) {
          await browser.runtime.sendMessage({
            type: 'indexed',
            data: { source: 'watcher' },
            ext: 'blockcore',
            source: 'background',
            target: 'tabs',
            host: browser.runtime.id,
          });
        } else {
          await browser.runtime.sendMessage({
            type: 'updated',
            data: { source: 'watcher' },
            ext: 'blockcore',
            source: 'background',
            target: 'tabs',
            host: browser.runtime.id,
          });
        }
      } catch (e) {
        // Ignore errors when no listeners are registered
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
