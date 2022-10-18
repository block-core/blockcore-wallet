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
import { TranslateService } from '@ngx-translate/core';
// import { v4 as uuidv4 } from 'uuid';
const { v4: uuidv4 } = require('uuid');
import { base64url } from 'multiformats/bases/base64';
import { generateCid } from './cid';

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
  readableId: string;
  readableId2: string;
  readableId3: string;
  readableId4: string;
  readableId5: string;
  readableId6: string;
  readableId7: string;
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
    private cd: ChangeDetectorRef,
    public translate: TranslateService
  ) {
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
      this.uiState.title = (await this.translate.get('Account.Account').toPromise()) + ': ' + this.walletManager.activeAccount?.name;

      this.network = this.walletManager.getNetwork(this.walletManager.activeAccount.networkType);

      const accountState = this.accountStateStore.get(this.walletManager.activeAccount.identifier);

      // The very first receive address is the actual identity of the account.
      const address = accountState.receive[0];

      this.identifier = `${this.network.symbol}:${address.address}`;
      this.readableId = `${this.network.symbol}:${address.address.substring(0, 4)}...${address.address.substring(address.address.length - 4)}`;

      // this.uiState.persisted.activeAccountIndex = Number(index);

      // Persist when changing accounts.
      // this.uiState.save();

      // this.previousIndex = index;

      // var did = this.walletManager.activeAccount?.identifier;
      // this.identity = this.uiState.store.identities.find(i => i.id == did);

      // let service = this.identity?.services.find((s) => s.type == 'VerifiableDataRegistry');

      // if (service) {
      //   this.verifiableDataRegistryUrl = service.serviceEndpoint;
      // }
    });
  }

  async copy() {
    copyToClipboard(this.identifier);

    this.snackBar.open(await this.translate.get('Account.IdentifierCopiedToClipboard').toPromise(), await this.translate.get('Account.IdentifierCopiedToClipboardAction').toPromise(), {
      duration: 2500,
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

    // if (this.verifiableDataRegistryUrl && this.verifiableDataRegistryUrl.length > 0) {
    //   // Attempt to find existing VerifiableDataRegistry service. We do not want to replace any third party
    //   // services the user might have added to their DID Document through other means.
    //   if (this.identity.services.length > 0) {
    //     var existingIndex = this.identity.services.findIndex((s) => s.type == 'VerifiableDataRegistry');

    //     if (existingIndex > -1) {
    //       if (vdr) {
    //         // Replace existing.
    //         this.identity.services.splice(existingIndex, 1);
    //         this.identity.services.push(vdr);
    //         // this.identity.services[existingIndex] = vdr;
    //       } else {
    //         // Remove it if the user has emptied the input field.
    //         this.identity.services.splice(existingIndex, 1);
    //       }
    //     } else {
    //       if (vdr) {
    //         this.identity.services.push(vdr);
    //       }
    //     }
    //   } else {
    //     if (vdr) {
    //       this.identity.services = [vdr];
    //     }
    //   }
    // } else {
    //   // If there is no URL, we'll reset the services list.
    //   this.identity.services = [];
    // }

    console.log(this.identity);
    // this.manager.updateIdentity(this.identity);
  }

  publish() {
    if (this.identity) {
      // this.manager.publishIdentity(this.identity);
    }
  }

  async copyDWNRequest() {
    // const didDocument = await this.generateDIDDocument();
    const didDocument = await this.generateDIDDocument();

    // const signatureInput = {
    //   jwkPrivate      : privateJwk,
    //   protectedHeader : {
    //     alg : privateJwk.alg as string,
    //     kid : keyId
    //   }
    // };

    const bytes = new TextEncoder().encode('Hello World');
    const base64UrlString = base64url.baseEncode(bytes);
    const cid = await generateCid(base64UrlString);

    const doc = {
      messages: [
        {
          authorization: {
            payload: '',
            signatures: [
              {
                protected: '',
                signature: '',
              },
            ],
          },
          descriptor: {
            target: didDocument.id,
            method: 'CollectionsWrite',
            recordId: uuidv4(),
            nonce: '',
            dataCid: cid,
            dateCreated: Date.now(),
            dataFormat: 'application/json',
          },
          encodedData: base64UrlString,
        },
      ],
    };

    console.log(doc);

    copyToClipboard(JSON.stringify(doc));

    this.snackBar.open('Decentralized Web Node request copied', 'Hide', {
      duration: 2500,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  async generateDIDDocument() {
    const tools = new BlockcoreIdentityTools();
    // const keyPair = tools.generateKeyPair();

    const identityNode = this.identityService.getIdentityNode(this.walletManager.activeWallet, this.walletManager.activeAccount);
    const privateKey = identityNode.privateKey;
    const verificationMethod = tools.getVerificationMethod(privateKey, 0, this.network.symbol);

    console.log('verificationMethod:', verificationMethod);

    const identity = new BlockcoreIdentity(verificationMethod);

    const doc = identity.document();
    console.log(JSON.stringify(doc));
    return doc;
  }

  async copyDIDDocument() {
    const doc = await this.generateDIDDocument();

    copyToClipboard(JSON.stringify(doc));

    this.snackBar.open(await this.translate.get('Account.DIDDocumentCopiedToClipboard').toPromise(), await this.translate.get('Account.DIDDocumentCopiedToClipboardAction').toPromise(), {
      duration: 2500,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });

    // const document = await this.identityService.createIdentityDocument(privateKey);
    // console.log(JSON.stringify(document));
  }

  copyProfileDocument() {
    // copyToClipboard(JSON.stringify('Not implemented yet.'));
  }

  copyVaultConfiguration() {
    var domain = this.verifiableDataRegistryUrl;
    // this.manager.generateVaultConfiguration(domain);
  }

  async ngOnInit(): Promise<void> {
    this.uiState.title = (await this.translate.get('Account.Account').toPromise()) + ': ';

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
