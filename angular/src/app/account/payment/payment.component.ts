import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { copyToClipboard } from 'src/app/shared/utilities';
import { Account, Contact } from 'src/shared';
import { Network } from 'src/shared/networks';
import { ContactStore } from 'src/shared/store/contacts-store';
import { NetworksService, SendService, UIState, WalletManager } from '../../services';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css'],
})
export class PaymentComponent implements OnInit, OnDestroy {
  network: Network;
  public contact: Contact;
  subscriptions: Subscription[] = [];
  filteredAccounts: Account[];

  constructor(private walletManager: WalletManager, public sendService: SendService, private snackBar: MatSnackBar, private activatedRoute: ActivatedRoute, private router: Router, private uiState: UIState, public networkService: NetworksService, private fb: FormBuilder, private contactStore: ContactStore) {
    this.uiState.showBackButton = true;
    this.uiState.goBackHome = false;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });

    this.subscriptions = [];
  }

  async ngOnInit(): Promise<void> {
    this.network = this.networkService.getNetworkBySymbol(this.uiState.payment.network);

    console.log(this.network);
    console.log(this.uiState.payment);

    var accounts = this.walletManager.activeWallet.accounts;
    this.filteredAccounts = accounts.filter((a) => a.networkType == this.network.id);

    console.log(accounts);
    console.log(this.filteredAccounts);
  }

  copy(content: string) {
    copyToClipboard(content);

    this.snackBar.open('Copied to clipboard', 'Hide', {
      duration: 1500,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  async remove() {
    this.contactStore.remove(this.contact.id);
    await this.contactStore.save();
    this.router.navigateByUrl('/contacts');
  }

  async sendToUsing(address: string, accountId: string) {
    await this.walletManager.setActiveAccount(accountId);
    this.sendService.sendToAddress = address;
    this.router.navigate(['/', 'account', 'send']);
  }
}
