import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import Big from 'big.js';
import { Subscription } from 'rxjs';
import { copyToClipboard } from 'src/app/shared/utilities';
import { Account, Contact } from 'src/shared';
import { Network } from 'src/shared/networks';
import { PaymentRequest } from 'src/shared/payment';
import { ContactStore } from 'src/shared/store/contacts-store';
import { NetworksService, SendService, UIState, WalletManager } from '../../services';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css'],
})
export class PaymentComponent implements OnInit, OnDestroy {
  network: Network;
  contact: Contact;
  subscriptions: Subscription[] = [];
  filteredAccounts: Account[];
  amount: Big;

  constructor(
    private paymentRequest: PaymentRequest,
    private walletManager: WalletManager,
    public sendService: SendService,
    private snackBar: MatSnackBar,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    public uiState: UIState,
    public networkService: NetworksService,
    private fb: FormBuilder,
    private contactStore: ContactStore,
    public translate: TranslateService
  ) {
    this.uiState.showBackButton = true;
    this.uiState.goBackHome = false;
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });

    this.subscriptions = [];
  }

  ngOnInit() {
    this.network = this.networkService.getNetworkBySymbol(this.uiState.payment.network);
    this.amount = this.paymentRequest.parseAmount(this.uiState.payment.options.amount);

    var accounts = this.walletManager.activeWallet.accounts;
    this.filteredAccounts = accounts.filter((a) => a.networkType == this.network.id);
  }

  async copy(content: string) {
    copyToClipboard(content);

    this.snackBar.open(await this.translate.get('Account.CopiedToClipboard').toPromise(), await this.translate.get('Account.CopiedToClipboardAction').toPromise(), {
      duration: 1500,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  async cancel() {
    this.uiState.payment = null;
    this.router.navigateByUrl('/dashboard');
  }

  async sendToUsing(address: string, accountId: string) {
    await this.walletManager.setActiveAccount(accountId);
    this.sendService.sendToAddress = address;
    this.sendService.sendAmount = this.uiState.payment.options.amount;
    this.sendService.payment = this.uiState.payment;

    this.router.navigate(['/', 'account', 'send']);
  }
}
