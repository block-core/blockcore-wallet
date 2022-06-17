import { Injectable } from '@angular/core';
import { Account, Action, AppState, DIDPayload, Persisted, Wallet } from '../../shared/interfaces';
import { ReplaySubject, Subject } from 'rxjs';
import { Network } from '../../shared/networks';
import { AccountStateStore, UIStore } from 'src/shared';
import { LoggerService } from './logger.service';
import { SecureStateService } from './secure-state.service';
import { ServiceEndpoint } from 'did-resolver';
import { WalletManager } from './wallet-manager';
import { CryptoUtility, NetworkLoader } from '.';
import { HDKey } from '@scure/bip32';
import * as secp from '@noble/secp256k1';
import { decodeJWT, createJWT, verifyJWT, ES256KSigner } from 'did-jwt';

@Injectable({
  providedIn: 'root',
})
export class IdentityService {
  private allNetworks: Network[];

  constructor(private logger: LoggerService, private networkLoader: NetworkLoader, private secure: SecureStateService, private crypto: CryptoUtility, private accountStateStore: AccountStateStore, private walletManager: WalletManager) {
    this.allNetworks = this.networkLoader.getAllNetworks();
  }

  /** Get the network definition based upon the network identifier. */
  getNetwork(networkType: string) {
    return this.allNetworks.find((w) => w.id == networkType);
  }

  async signData(wallet: Wallet, account: Account, content: string): Promise<string> {
    const addressNode = this.getIdentityNode(wallet, account);

    const accountState = this.accountStateStore.get(account.identifier);
    let identity = accountState.receive[0].address;

    const messageArray = new Uint8Array(Buffer.from(content));
    const messageHash = await secp.utils.sha256(messageArray);
    const identifier = this.crypto.getIdentifier(addressNode.publicKey);

    const signatureArray = await secp.schnorr.sign(messageHash, addressNode.privateKey!);

    const signature = secp.utils.bytesToHex(signatureArray);
    return signature;
  }

  public getIdentityNode(wallet: Wallet, account: Account) {
    const network = this.getNetwork(account.networkType);

    // Get the secret seed.
    const masterSeedBase64 = this.secure.get(wallet.id);
    const masterSeed = Buffer.from(masterSeedBase64, 'base64');

    // Create the master node.
    const masterNode = HDKey.fromMasterSeed(masterSeed, network.bip32);

    let addressNode = masterNode.derive(
      `m/${account.purpose}'/${account.network}'/${account.index}'/0'/0'` // Only use hardened keys for identity.
    );

    return addressNode;
  }

  async createIdentityDocument(privateKey: Uint8Array, services?: ServiceEndpoint[]) {
    // var account = this.walletManager.activeAccount;
    // var wallet = this.walletManager.activeWallet;

    // if (!account || !wallet) {
    //   return;
    // }

    // if (!this.secure.unlocked(wallet.id)) {
    //   console.warn('There are no secure state available for this wallet.');
    //   return;
    // }

    // const data = 'hello world';
    // const signature = this.signData(wallet, account, data);
    // const secureState = this.secure.get(account.identifier);
    // const addressNode = this.getIdentityNode(wallet, account);

    const publicKey = secp.schnorr.getPublicKey(privateKey);
    const identifier = this.crypto.getIdentifier(publicKey);
    const did = `did:is:${identifier}`;

    // const address0 = this.crypto.getAddress(addressNode);
    // var signer = await this.crypto.getSigner(addressNode);
    var signer = ES256KSigner(privateKey);

    let jwt = await createJWT(
      {
        aud: did,
        exp: 1957463421,
        name: 'Blockcore Developer',
      },
      { issuer: did, signer },
      { alg: 'ES256K' }
    );

    console.log(jwt);

    let decoded = decodeJWT(jwt);
    console.log(decoded);

    const resolver = {
      resolve: async () => ({
        didResolutionMetadata: {},
        didDocumentMetadata: {},
        didDocument: {
          id: 'did:is:43eecb783ca67406b88e2ee70ba44e51dbf75566f4a30e53e7ae2147f22dd42b',
          verificationMethod: [
            {
              id: 'did:is:43eecb783ca67406b88e2ee70ba44e51dbf75566f4a30e53e7ae2147f22dd42b#keys-1',
              type: 'EcdsaSecp256k1VerificationKey2019',
              controller: 'did:is:43eecb783ca67406b88e2ee70ba44e51dbf75566f4a30e53e7ae2147f22dd42b',
              publicKeyJwk: { kty: 'EC', crv: 'secp256k1', x: 'Q-7LeDymdAa4ji7nC6ROUdv3VWb0ow5T564hR_It1Cs=', y: 'WU14yxpWK8eT_wHwlt4tOgCTCkhSUCqkf4ksUi76qRg=' },
            },
          ],
          authentication: ['did:is:43eecb783ca67406b88e2ee70ba44e51dbf75566f4a30e53e7ae2147f22dd42b#keys-1'],
          assertionMethod: ['did:is:43eecb783ca67406b88e2ee70ba44e51dbf75566f4a30e53e7ae2147f22dd42b#keys-1'],
        },
      }),
    };

    const { payload } = await verifyJWT(jwt, { resolver, audience: 'did:is:43eecb783ca67406b88e2ee70ba44e51dbf75566f4a30e53e7ae2147f22dd42b' });

    console.log('Payload:', payload);

    // Get the identity corresponding with the key pair, does not contain the private key any longer.
    // var identity = this.crypto.getIdentity(keyPair);

    let document = null;

    // if (services) {
    //   document = identity.document({ service: services });
    // } else {
    //   document = identity.document();
    // }

    // var tmp = JSON.parse(JSON.stringify(document));

    // document.id = '';
    // //document.id2 = '';
    // document.verificationMethod = '';
    // document.controller = '';
    // document.authentication = '';
    // document.assertionMethod = '';

    // Make sure the properties are in right order to rule out bug with Mongoose.
    // document.id = tmp.id;
    //document.id2 = tmp.id;
    // document.verificationMethod = tmp.verificationMethod;
    // document.controller = tmp.controller;
    // document.authentication = tmp.authentication;
    // document.assertionMethod = tmp.assertionMethod;

    // Create an issuer from the identity, this is used to issue VCs.
    // const issuer = identity.issuer({
    //   privateKey: keyPair.privateKeyBuffer?.toString('hex'),
    // });

    // // TODO: The URL should be provided by website triggering DID Document signing.
    // // let configuration = await identity.configuration('https://localhost', issuer);
    // // let configurationJson = JSON.stringify(configuration);

    // // const signedJwt = await identity.signJwt({ payload: payload, privateKeyJwk: keyPairWebKey.privateKeyJwk });
    // // console.log('SIGNED PAYLOAD:');
    // // console.log(signedJwt);

    // const jws = await identity.jws({
    //   payload: document,
    //   privateKey: keyPair.privateKeyBuffer?.toString('hex'),
    // });

    // const jwt = await identity.jwt({
    //   payload: document,
    //   privateKey: keyPair.privateKeyBuffer?.toString('hex'),
    // });

    // var decodedDidDocument = decodeJWT(jws) as unknown as DIDPayload;
    // // var decodedDidDocument2 = decodeJWT(jwt);

    // console.log(decodedDidDocument);

    // this.state.store.identities.push({
    //   id: identity.id,
    //   published: false,
    //   sequence: -1,
    //   services: [],
    //   didPayload: decodedDidDocument,
    //   didDocument: decodedDidDocument.payload,
    // });

    // account.identifier = identity.id;
    // account.name = identity.id;
  }

  //     // async updateIdentityDocument(data: Identity) {
  //     //     // First get the signing key for this identity.
  //     //     var account = this.state.activeWallet?.accounts.find(a => a.identifier == data.id);

  //     //     if (!account) {
  //     //         throw Error('Did not find account to update identity document on.');
  //     //     }

  //     //     // var account = this.state.activeAccount;
  //     //     var wallet = this.state.activeWallet;

  //     //     if (!account || !wallet) {
  //     //         return;
  //     //     }

  //     //     let password = this.state.passwords.get(wallet.id);

  //     //     if (!password) {
  //     //         throw Error('missing password');
  //     //     }

  //     //     let unlockedMnemonic = null;
  //     //     unlockedMnemonic = await this.crypto.decryptData(wallet.mnemonic, password);

  //     //     // TODO: MUST VERIFY THAT ACCOUNT RESTORE AND NODES IS ALL CORRECT BELOW.
  //     //     var masterSeed = await bip39.mnemonicToSeed(unlockedMnemonic, '');
  //     //     const masterNode = bip32.fromSeed(masterSeed, this.crypto.getProfileNetwork());

  //     //     // Get the hardened purpose and account node.
  //     //     const accountNode = masterNode.derivePath(account.derivationPath); // m/302'/616'

  //     //     const address0 = this.crypto.getAddress(accountNode);
  //     //     var keyPair = await this.crypto.getKeyPairFromNode(accountNode);

  //     //     // Get the identity corresponding with the key pair, does not contain the private key any longer.
  //     //     var identity = this.crypto.getIdentity(keyPair);

  //     //     let document = null;

  //     //     if (data.services) {
  //     //         document = identity.document({ service: data.services });
  //     //     } else {
  //     //         document = identity.document();
  //     //     }

  //     //     // Create an issuer from the identity, this is used to issue VCs.
  //     //     const issuer = identity.issuer({ privateKey: keyPair.privateKeyBuffer?.toString('hex') });

  //     //     // TODO: The URL should be provided by website triggering DID Document signing.
  //     //     // let configuration = await identity.configuration('https://localhost', issuer);
  //     //     // let configurationJson = JSON.stringify(configuration);

  //     //     // const signedJwt = await identity.signJwt({ payload: payload, privateKeyJwk: keyPairWebKey.privateKeyJwk });
  //     //     // console.log('SIGNED PAYLOAD:');
  //     //     // console.log(signedJwt);

  //     //     const jws = await identity.jws({
  //     //         payload: document,
  //     //         privateKey: keyPair.privateKeyBuffer?.toString('hex')
  //     //     });

  //     //     const jwt = await identity.jwt({
  //     //         payload: document,
  //     //         privateKey: keyPair.privateKeyBuffer?.toString('hex')
  //     //     });

  //     //     var decodedDidDocument = decodeJWT(jws) as unknown as DIDPayload;
  //     //     var decodedDidDocument2 = decodeJWT(jwt);

  //     //     var updatedIdentity = data;
  //     //     updatedIdentity.didPayload = decodedDidDocument;
  //     //     updatedIdentity.didDocument = decodedDidDocument.payload;

  //     //     // var updatedIdentity = { id: data.id, published: data.published, services: data.services, didPayload: decodedDidDocument, didDocument: decodedDidDocument.payload };

  //     //     var existingIndex = this.state.store.identities.findIndex(i => i.id == data.id);

  //     //     if (existingIndex > -1) {
  //     //         this.state.store.identities.splice(existingIndex, 1);
  //     //         this.state.store.identities.push(updatedIdentity);
  //     //         // this.state.store.identities[existingIndex] = updatedIdentity
  //     //     } else {
  //     //         // This shouldn't happen on updates...
  //     //         this.state.store.identities.push(updatedIdentity);
  //     //     }

  //     //     console.log('CHECK THIS:');
  //     //     console.log(JSON.stringify(this.state.store.identities));

  //     //     // account.identifier = identity.id;
  //     //     // account.name = identity.id;
  //     // }
}
