import { Component, Inject, HostBinding, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AccountStateStore, bytesToBase64Url, generateCid, getDagCid, Identity, Jws } from 'src/shared';
import { CommunicationService, CryptoService, SettingsService, UIState, WalletManager } from 'src/app/services';
import { copyToClipboard } from 'src/app/shared/utilities';
import { Network } from '../../../shared/networks';
import { IdentityService } from 'src/app/services/identity.service';
import { BlockcoreIdentity, BlockcoreIdentityTools } from '@blockcore/identity';
import { TranslateService } from '@ngx-translate/core';
// import { v4 as uuidv4 } from 'uuid';
const { v4: uuidv4 } = require('uuid');
// import { base64url } from 'multiformats/bases/base64';
import { createJWT, ES256KSigner } from 'did-jwt';
import { calculateJwkThumbprintUri, base64url } from 'jose';
import { IdentityResolverService } from 'src/app/services/identity-resolver.service';
import { DIDDocument } from 'did-resolver';
import { BlockcoreDns } from '@blockcore/dns';

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
  published: boolean;
  account!: any;
  previousIndex!: number;
  identity: Identity | undefined;
  identifier: string;
  readableId: string;
  network: Network;
  isDid = true;
  wellKnownDomain = 'https://';
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
    private resolver: IdentityResolverService,
    private activatedRoute: ActivatedRoute,
    private accountStateStore: AccountStateStore,
    private settings: SettingsService,
    private identityService: IdentityService,
    public translate: TranslateService
  ) {
    this.uiState.showBackButton = true;

    this.activatedRoute.paramMap.subscribe(async (params) => {
      const accountIdentifier: any = params.get('index');

      if (!this.walletManager.activeWallet) {
        return;
      }

      await this.walletManager.setActiveAccount(accountIdentifier);

      const accountTranslate = await this.translate.get('Account.Account').toPromise();
      this.uiState.title = accountTranslate + ': ' + this.walletManager.activeAccount?.name;

      this.network = this.walletManager.getNetwork(this.walletManager.activeAccount.networkType);
      const accountState = this.accountStateStore.get(this.walletManager.activeAccount.identifier);

      // The very first receive address is the actual identity of the account.
      const address = accountState.receive[0];

      const tools = new BlockcoreIdentityTools();
      const identityNode = this.identityService.getIdentityNode(this.walletManager.activeWallet, this.walletManager.activeAccount);
      const verificationMethod = tools.getVerificationMethod(identityNode.publicKey, 0, this.network.symbol);
      const identity = new BlockcoreIdentity(verificationMethod);
      this.identifier = identity.did;
      this.readableId = identity.short;

      if (this.identifier.startsWith('nostr') || this.identifier.startsWith('npub')) {
        this.isDid = false;
      }

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

  private getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
  }

  async publish() {
    const jws = await this.generateOperation(0);

    const dns = new BlockcoreDns();
    await dns.load(undefined, 'Identity');

    let serviceUrl = 'https://id.blockcore.net'; // Fallback
    const services = dns.getServices().filter((s) => s.online);

    if (services.length > 0) {
      const randomIndex = this.getRandomInt(services.length);
      serviceUrl = 'https://' + services[randomIndex].domain;
    }

    console.log(serviceUrl);
    console.log(jws);

    const rawResponse = await fetch(serviceUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: jws,
    });

    const content = await rawResponse.json();
    console.log(content);

    this.published = true;
  }

  async copyDWNRequest() {
    // const didDocument = await this.generateDIDDocument();

    const identityNode = this.identityService.getIdentityNode(this.walletManager.activeWallet, this.walletManager.activeAccount);
    const didDocument = await this.generateDIDDocument(identityNode.publicKey);

    const tools = new BlockcoreIdentityTools();
    // const keyPair = tools.generateKeyPair();

    const privateKey = identityNode.privateKey;

    // Does the same thing, verificationMethod doesn't do private key... this is just prototype-code anyway :-P
    const { privateJwk, publicJwk } = tools.convertPrivateKeyToJsonWebKeyPair(privateKey);
    const verificationMethod = tools.getVerificationMethod(privateKey, 0, this.network.symbol);

    // const keyId = verificationMethod.id;
    // const keyId = await calculateJwkThumbprintUri(publicJwk);

    const id = base64url.encode(JSON.stringify(publicJwk));
    const keyId = `did:jwk:${id}`;

    const signatureInput = {
      jwkPrivate: privateJwk,
      protectedHeader: {
        alg: privateJwk.alg as string,
        kid: `${keyId}#0`,
      },
    };

    const options = {
      target: keyId,
      recipient: keyId,
      data: new TextEncoder().encode('HelloWorld'),
      dataFormat: 'application/json',
      dateCreated: Date.now(),
      recordId: uuidv4(),
      signatureInput,
    };

    // Get the DagCid from the data payload
    const dataCid = await getDagCid(options.data);
    console.log(dataCid);

    const descriptor = {
      target: options.target,
      recipient: options.recipient,
      method: 'CollectionsWrite',
      nonce: uuidv4(),
      // protocol      : options.protocol,
      // contextId     : options.contextId,
      // schema        : options.schema,
      recordId: options.recordId,
      // parentId      : options.parentId,
      dataCid: dataCid.toString(),
      dateCreated: options.dateCreated ?? Date.now(),
      // published     : options.published,
      // datePublished : options.datePublished,
      dataFormat: options.dataFormat,
    };

    const encodedData = bytesToBase64Url(options.data);

    var signer = ES256KSigner(privateKey);

    const authorization = await Jws.sign({ descriptor }, options.signatureInput);
    const message = { descriptor, authorization, encodedData };
    console.log('MESSAGE:');
    console.log(message);
    console.log(JSON.stringify(message));

    const bytes = new TextEncoder().encode('Hello World');
    const base64UrlString = base64url.encode(bytes);
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

  async copyDWNQueryRequest() {
    // const didDocument = await this.generateDIDDocument();

    const identityNode = this.identityService.getIdentityNode(this.walletManager.activeWallet, this.walletManager.activeAccount);
    const didDocument = await this.generateDIDDocument(identityNode.publicKey);

    const tools = new BlockcoreIdentityTools();
    // const keyPair = tools.generateKeyPair();

    const privateKey = identityNode.privateKey;

    // Does the same thing, verificationMethod doesn't do private key... this is just prototype-code anyway :-P
    const { privateJwk, publicJwk } = tools.convertPrivateKeyToJsonWebKeyPair(privateKey);
    const verificationMethod = tools.getVerificationMethod(privateKey, 0, this.network.symbol);

    // const keyId = verificationMethod.id;
    // const keyId = await calculateJwkThumbprintUri(publicJwk);

    const id = base64url.encode(JSON.stringify(publicJwk));
    const keyId = `did:jwk:${id}`;

    console.log('KEY ID');
    console.log(keyId);

    const signatureInput = {
      jwkPrivate: privateJwk,
      protectedHeader: {
        alg: privateJwk.alg as string,
        kid: keyId + '#0',
      },
    };

    const options = {
      target: keyId,
      recipient: keyId,
      data: new TextEncoder().encode('HelloWorld'),
      dataFormat: 'application/json',
      dateCreated: Date.now(),
      recordId: uuidv4(),
      signatureInput,
    };

    // Get the DagCid from the data payload
    const dataCid = await getDagCid(options.data);
    console.log(dataCid);

    const descriptor = {
      target: options.target,
      // recipient: options.recipient,
      method: 'CollectionsQuery',

      filter: {
        recipient: options.target,
      },

      nonce: uuidv4(),
      // protocol      : options.protocol,
      // contextId     : options.contextId,
      // schema        : options.schema,
      // recordId: options.recordId,
      // parentId      : options.parentId,
      // dataCid: dataCid.toString(),

      // dateSort?: string;
      // dateCreated: options.dateCreated ?? Date.now(),
      // published     : options.published,
      // datePublished : options.datePublished,
      // dataFormat: options.dataFormat,
    };

    const encodedData = bytesToBase64Url(options.data);

    var signer = ES256KSigner(privateKey);

    const authorization = await Jws.sign({ descriptor }, options.signatureInput);
    const message = { descriptor, authorization };
    console.log('MESSAGE:');
    console.log(message);
    console.log(JSON.stringify(message));

    //const collectionsWrite = await CollectionsWrite.create(options);

    // const message = collectionsWrite.toObject() as CollectionsWriteMessage;

    // expect(message.authorization).to.exist;
    // expect(message.encodedData).to.equal(base64url.baseEncode(options.data));
    // expect(message.descriptor.dataFormat).to.equal(options.dataFormat);
    // expect(message.descriptor.dateCreated).to.equal(options.dateCreated);
    // expect(message.descriptor.recordId).to.equal(options.recordId);

    // const resolverStub = TestStubGenerator.createDidResolverStub(requesterDid, keyId, publicJwk);
    // const messageStoreStub = sinon.createStubInstance(MessageStoreLevel);

    // const { author } = await collectionsWrite.verifyAuth(resolverStub, messageStoreStub);

    // expect(author).to.equal(requesterDid);

    // const bytes = new TextEncoder().encode('Hello World');
    // const base64UrlString = base64url.encode(bytes);
    // const cid = await generateCid(base64UrlString);

    // const doc = {
    //   messages: [
    //     {
    //       authorization: {
    //         payload: '',
    //         signatures: [
    //           {
    //             protected: '',
    //             signature: '',
    //           },
    //         ],
    //       },
    //       descriptor: {
    //         target: didDocument.id,
    //         method: 'CollectionsWrite',
    //         recordId: uuidv4(),
    //         nonce: '',
    //         dataCid: cid,
    //         dateCreated: Date.now(),
    //         dataFormat: 'application/json',
    //       },
    //       encodedData: base64UrlString,
    //     },
    //   ],
    // };

    // console.log(doc);

    copyToClipboard(JSON.stringify(message));

    this.snackBar.open('Decentralized Web Node request copied', 'Hide', {
      duration: 2500,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  openDid() {
    // TODO: We need to somehow get active service URL from the resolver library.
    const url = `https://did.is/${this.identifier}`;
    window.open(url, '_blank');
    // window.open(url, 'exolixPopup', 'height=820,width=600,left=200,top=200,resizable=yes,channelmode=yes,scrollbars=yes,toolbar=yes,menubar=no,location=yes,directories=no,status=yes');
  }

  async generateOperation(version: number) {
    const tools = new BlockcoreIdentityTools();

    const identityNode = this.identityService.getIdentityNode(this.walletManager.activeWallet, this.walletManager.activeAccount);
    const signer = tools.getSigner(identityNode.privateKey);

    const verificationMethod = tools.getVerificationMethod(identityNode.publicKey, 0, this.network.symbol);
    const identity = new BlockcoreIdentity(verificationMethod);

    const didDocument = this.generateDIDDocument(identityNode.publicKey);
    const kid = didDocument.id + '#key0';
    const jws = await identity.sign(signer, { version: 0, iat: new Date().valueOf() / 1000, didDocument: didDocument }, kid);

    return jws;
  }

  generateDIDDocument(publicKey: Uint8Array): DIDDocument {
    const tools = new BlockcoreIdentityTools();

    const verificationMethod = tools.getVerificationMethod(publicKey, 0, this.network.symbol);
    const identity = new BlockcoreIdentity(verificationMethod);
    const didDocument: DIDDocument = identity.document();
    return didDocument;
  }

  async generateWellKnownConfiguration(publicKey: Uint8Array, privateKey: Uint8Array, domain: string) {
    const tools = new BlockcoreIdentityTools();

    const verificationMethod = tools.getVerificationMethod(publicKey, 0, this.network.symbol);
    const identity = new BlockcoreIdentity(verificationMethod);
    const issuer = tools.getIssuer(identity.did, privateKey);

    const document = await identity.configuration(domain, issuer, verificationMethod.id);
    return document;
  }

  async copyWellKnownConfiguration() {
    const identityNode = this.identityService.getIdentityNode(this.walletManager.activeWallet, this.walletManager.activeAccount);
    const doc = await this.generateWellKnownConfiguration(identityNode.publicKey, identityNode.privateKey, this.wellKnownDomain);

    copyToClipboard(JSON.stringify(doc));

    this.snackBar.open('Copied to clipboard', 'Hide', {
      duration: 2500,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  async copyDIDDocument() {
    const identityNode = this.identityService.getIdentityNode(this.walletManager.activeWallet, this.walletManager.activeAccount);
    const doc = this.generateDIDDocument(identityNode.publicKey);

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
    const didResolution = await this.resolver.resolve(this.identifier);

    console.log(didResolution);

    if (didResolution.didDocument != null) {
      this.published = true;
      console.log('PUBLISHED SET TO TRUE!');
    } else {
      this.published = false;
    }

    // if (didResolution.didResolutionMetadata.error == 'notFound') {
    //   this.identity.published = false;
    // } else {
    //   this.identity.published = true;
    // }

    // console.log(didResolution);

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
