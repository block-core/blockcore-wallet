import { Injectable } from '@angular/core';
import { Action, ActionMessageResponse, ActionStore } from 'src/shared';
import { UIState } from './ui-state.service';
import { WalletManager } from './wallet-manager';

@Injectable({
  providedIn: 'root',
})
export class ActionService {
  constructor(private store: ActionStore, public uiState: UIState, public walletManager: WalletManager) {}

  app: string;
  content: string;

  async clearAction() {
    this.store.set(undefined);
    await this.store.save();
  }

  async setAction(data: Action, broadcast: boolean) {
    if (typeof data.action !== 'string') {
      console.error('Only objects that are string are allowed as actions.');
      return;
    }

    if (data.document != null && typeof data.document !== 'string') {
      console.error('Only objects that are string are allowed as actions.');
      return;
    }

    this.store.set(data);

    await this.store.save();

    // if (broadcast) {
    //     this.broadcastState();
    // }

    // Raise this after state has been updated, so orchestrator in UI can redirect correctly.
    // this.communication.sendToAll('action-changed', this.state.action);
  }

  authorize(permission: string) {
    // Reset params so the action can be re-triggered.
    this.uiState.params = null;

    const reply: ActionMessageResponse = {
      prompt: true, // This indicates that message comes from the popup promt.
      target: 'provider',
      src: 'tabs',
      ext: 'blockcore',
      permission: permission,
      args: ['cipher'],
      id: this.uiState.action.id,
      action: this.uiState.action.action,
      app: this.uiState.action.app,
      walletId: this.walletManager.activeWalletId,
      accountId: this.walletManager.activeAccountId,
    };

    // TODO: Move this to a communication service.
    // Inform the provider script that user has signed the data.
    chrome.runtime.sendMessage(reply);
  }
}
