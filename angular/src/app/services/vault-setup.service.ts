import { Injectable } from '@angular/core';
import { Action, AppState, Persisted } from '../../shared/interfaces';
import { ReplaySubject, Subject } from 'rxjs';
import { Network } from '../../shared/networks';
import { UIStore } from 'src/shared';
import { LoggerService } from './logger.service';
import { SecureStateService } from './secure-state.service';

@Injectable({
  providedIn: 'root',
})
export class VaultSetupService {
  constructor(
    private logger: LoggerService,
    private secureState: SecureStateService
  ) {

  }

  //     // async createVaultConfigurationDocument(domain: string) {
//     //     var account = this.manager.walletManager.activeAccount;
//     //     var wallet = this.manager.walletManager.activeWallet;

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

//     //     // if (services) {
//     //     //     document = identity.document({ service: services });
//     //     // } else {
//     //     //     document = identity.document();
//     //     // }

//     //     // Create an issuer from the identity, this is used to issue VCs.
//     //     const issuer = identity.issuer({ privateKey: keyPair.privateKeyBuffer?.toString('hex') });

//     //     let configuration = await identity.configuration(domain, issuer);

//     //     return configuration;

//     //     // TODO: The URL should be provided by website triggering DID Document signing.
//     //     // let configuration = await identity.configuration('https://localhost', issuer);
//     //     // let configurationJson = JSON.stringify(configuration);

//     //     // const signedJwt = await identity.signJwt({ payload: payload, privateKeyJwk: keyPairWebKey.privateKeyJwk });
//     //     // console.log('SIGNED PAYLOAD:');
//     //     // console.log(signedJwt);

//     //     // const jws = await identity.jws({
//     //     //     payload: document,
//     //     //     privateKey: keyPair.privateKeyBuffer?.toString('hex')
//     //     // });

//     //     // const jwt = await identity.jwt({
//     //     //     payload: document,
//     //     //     privateKey: keyPair.privateKeyBuffer?.toString('hex')
//     //     // });

//     //     // var decodedDidDocument = decodeJWT(jws) as unknown as DIDPayload;
//     //     // var decodedDidDocument2 = decodeJWT(jwt);

//     //     // this.state.store.identities.push({ id: identity.id, published: false, services: [], didPayload: decodedDidDocument, didDocument: decodedDidDocument.payload });

//     //     // account.identifier = identity.id;
//     //     // account.name = identity.id;
//     // }


}
