import { Component, Inject, HostBinding, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AccountStateStore, Identity } from 'src/shared';
import { CommunicationService, CryptoService, SettingsService, UIState, WalletManager } from 'src/app/services';
import { copyToClipboard } from 'src/app/shared/utilities';
import { Network } from '../../../shared/networks';
import { IdentityService } from 'src/app/services/identity.service';
import { BlockcoreIdentity, BlockcoreIdentityTools } from 'src/shared/identity';

@Component({
  selector: 'app-identity',
  templateUrl: './identity.component.html',
  styleUrls: ['./identity.component.css'],
})
export class IdentityComponent implements OnInit, OnDestroy {
  mnemonic = '';
  password = '';
  unlocked = '';
  unlockPassword = '';
  alarmName = 'refresh';
  wallet: any;
  account!: any;
  previousIndex!: number;
  identity: Identity | undefined;
  identifier: string;
  network: Network;
  verifiableDataRegistryUrl = '';
  prefix = '';
  profile = {
    name: '',
    email: '',
    website: '',
  };

  get identityUrl(): string {
    if (!this.identity?.published) {
      return '';
    }

    return this.settings.values.dataVault + '/identity/' + this.identity.id;
  }

  constructor(
    public uiState: UIState,
    public walletManager: WalletManager,
    private snackBar: MatSnackBar,
    private crypto: CryptoService,
    private router: Router,
    private communication: CommunicationService,
    private activatedRoute: ActivatedRoute,
    private accountStateStore: AccountStateStore,
    private settings: SettingsService,
    private identityService: IdentityService,
    private cd: ChangeDetectorRef
  ) {
    this.uiState.title = 'Account: ';
    this.uiState.showBackButton = true;

    // if (!this.walletManager.hasAccounts) {
    //     this.router.navigateByUrl('/account/create');
    // }

    this.activatedRoute.paramMap.subscribe(async (params) => {
      const accountIdentifier: any = params.get('index');

      if (!this.walletManager.activeWallet) {
        return;
      }

      await this.walletManager.setActiveAccount(accountIdentifier);

      // If we are currently viewing an account and the user changes, we'll refresh this view.
      // if (this.previousIndex != data.index) {
      //   this.router.navigate(['account', 'view', data.index]);
      // }

      // console.log('PARAMS:', params);
      // const index: any = params.get('index');
      // // const index = data.index;

      // console.log('Index to view:', index);

      // // if (!this.uiState.activeWallet) {
      // //   return;
      // // }

      // this.manager.setActiveAccountId(index);
      this.uiState.title = 'Account: ' + this.walletManager.activeAccount?.name;

      this.network = this.walletManager.getNetwork(this.walletManager.activeAccount.networkType);

      const accountState = this.accountStateStore.get(this.walletManager.activeAccount.identifier);

      console.log('accountState:', this.accountStateStore.all());

      // The very first receive address is the actual identity of the account.
      const address = accountState.receive[0];

      this.identifier = `${this.network.symbol}:${address.address}`;

      console.log(this.identifier);

      // this.uiState.persisted.activeAccountIndex = Number(index);

      // Persist when changing accounts.
      // this.uiState.save();

      // this.previousIndex = index;

      // var did = this.walletManager.activeAccount?.identifier;
      // this.identity = this.uiState.store.identities.find(i => i.id == did);

      let service = this.identity?.services.find((s) => s.type == 'VerifiableDataRegistry');

      if (service) {
        this.verifiableDataRegistryUrl = service.serviceEndpoint;
      }
    });
  }

  copy() {
    copyToClipboard(this.identifier);

    this.snackBar.open('Identifier copied to clipboard', 'Hide', {
      duration: 1500,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  ngOnDestroy(): void {}

  save() {
    if (!this.identity) {
      return;
    }

    var vdr = null;

    if (this.verifiableDataRegistryUrl && this.verifiableDataRegistryUrl.length > 0) {
      vdr = {
        id: this.identity.id + '#vdr',
        type: 'VerifiableDataRegistry',
        serviceEndpoint: this.verifiableDataRegistryUrl,
      };
    }

    if (this.verifiableDataRegistryUrl && this.verifiableDataRegistryUrl.length > 0) {
      // Attempt to find existing VerifiableDataRegistry service. We do not want to replace any third party
      // services the user might have added to their DID Document through other means.
      if (this.identity.services.length > 0) {
        var existingIndex = this.identity.services.findIndex((s) => s.type == 'VerifiableDataRegistry');

        if (existingIndex > -1) {
          if (vdr) {
            // Replace existing.
            this.identity.services.splice(existingIndex, 1);
            this.identity.services.push(vdr);
            // this.identity.services[existingIndex] = vdr;
          } else {
            // Remove it if the user has emptied the input field.
            this.identity.services.splice(existingIndex, 1);
          }
        } else {
          if (vdr) {
            this.identity.services.push(vdr);
          }
        }
      } else {
        if (vdr) {
          this.identity.services = [vdr];
        }
      }
    } else {
      // If there is no URL, we'll reset the services list.
      this.identity.services = [];
    }

    console.log(this.identity);
    // this.manager.updateIdentity(this.identity);
  }

  publish() {
    if (this.identity) {
      // this.manager.publishIdentity(this.identity);
    }
  }

  async copyDIDDocument() {
    const tools = new BlockcoreIdentityTools();
    const keyPair = tools.generateKeyPair();
    const verificationMethod = tools.getVerificationMethod(keyPair);
    const identity = new BlockcoreIdentity(verificationMethod);

    const doc = identity.document();
    console.log(doc);

    const document = await this.identityService.createIdentityDocument();
    console.log(document);

    // copyToClipboard(JSON.stringify(this.identity?.didDocument));
  }

  copyProfileDocument() {
    // copyToClipboard(JSON.stringify('Not implemented yet.'));
  }

  copyVaultConfiguration() {
    var domain = this.verifiableDataRegistryUrl;
    // this.manager.generateVaultConfiguration(domain);
  }

  ngOnInit(): void {
    // this.sub4 = this.communication.listen('identity-published', (data: Identity) => {
    //   this.identity = data;
    //   this.snackBar.open('Your identity has been published', 'Hide', {
    //     duration: 8000,
    //     horizontalPosition: 'center',
    //     verticalPosition: 'bottom',
    //   });
    // });
    // this.sub3 = this.communication.listen('vault-configuration', (data: any) => {
    //   const vaultConfiguration = {
    //     didConfiguration: data,
    //     didDocument: this.identity?.didDocument
    //   };
    //   copyToClipboard(JSON.stringify(vaultConfiguration));
    // });
    // this.sub2 = this.communication.listen('identity-updated', () => {
    //   this.identity = this.uiState.store.identities.find(i => i.id == this.identity?.id);
    // });
    // this.sub = this.communication.listen('active-account-changed', (data: { walletId: string, accountId: string }) => {
    //   // If we are currently viewing an account and the user changes, we'll refresh this view.
    //   // if (this.previousIndex != data.index) {
    //   //   this.router.navigate(['account', 'view', data.index]);
    //   // }
    //   // console.log('PARAMS:', params);
    //   // const index: any = params.get('index');
    //   // const index = data.index;
    //   // console.log('Index to view:', index);
    //   if (!this.walletManager.activeWallet) {
    //     return;
    //   }
    //   // this.manager.setActiveAccountId(index);
    //   this.uiState.title = 'Account: ' + this.walletManager.activeAccount?.name;
    //   // this.uiState.persisted.activeAccountIndex = Number(index);
    //   // Persist when changing accounts.
    //   // this.uiState.save();
    //   // this.previou1sIndex = index;
    //   var did = this.walletManager.activeAccount?.identifier;
    //   this.identity = this.uiState.store.identities.find(i => i.id == did);
    //   // if (this.identity) {
    //   //   this.identity = { id }
    //   // }
    //   let service = this.identity?.services.find(s => s.type == 'VerifiableDataRegistry');
    //   if (service) {
    //     this.verifiableDataRegistryUrl = service.serviceEndpoint;
    //   } else {
    //     this.verifiableDataRegistryUrl = '';
    //   }
    // });
  }
}
