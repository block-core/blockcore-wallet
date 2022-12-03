import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActionService } from 'src/app/services/action.service';
import { ActionMessage, MessageService } from 'src/shared';
import { SendService, UIState } from '../../../services';

@Component({
  selector: 'app-account-send-success',
  templateUrl: './send-success.component.html',
  styleUrls: ['./send-success.component.css'],
})
export class AccountSendSuccessComponent implements OnInit, OnDestroy {
  constructor(public sendService: SendService, private message: MessageService, public uiState: UIState, private actionService: ActionService) {
    // When the transaction is done, we'll make sure the back button sends back to home.
    this.uiState.showBackButton = true;
    this.uiState.goBackHome = false;
    this.uiState.backUrl = '/account/view/' + sendService.account.identifier;
  }

  ngOnDestroy() {}

  async ngOnInit() {
    // If there are no errors, broadcast the transaction to the website:
    if (!this.sendService.transactionError && this.uiState.isPaymentAction) {
      const reply: any = {
        prompt: false, // This indicates that message comes from the popup promt.
        target: 'provider',
        source: 'tabs',
        ext: 'blockcore',
        // permission: 'once',
        request: { method: 'payment', params: undefined }, // Re-create the request object.
        type: 'broadcast',
        response: { content: { transactionId: this.sendService.transactionId, transactionHex: this.sendService.transactionHex } },
        // response: { content: action.content },
        // id: this.uiState.action.id,
        // type: this.uiState.action.action,
        // app: this.uiState.action.app,
        // walletId: this.walletManager.activeWalletId,
        // accountId: this.accountId,
        // keyId: this.sendService.transactionId,
        // key: this.sendService.transactionHex,
      };

      // Inform the provider script that user has signed the data.
      this.message.send(reply);
    }
  }

  closeWindow() {
    // this.actionService.authorize('once');
    window.close();
  }
}
