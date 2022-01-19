import { Account, State, Wallet, Action, DIDPayload, Settings, Identity, Vault } from '../app/interfaces';
import { MINUTE, NETWORK_IDENTITY } from '../app/shared/constants';
import { AppState } from './application-state';
import { CommunicationBackgroundService } from './communication';
import { CryptoUtility } from './crypto-utility';
import * as bip39 from 'bip39';
import * as bip32 from 'bip32';
import { decodeJWT, verifyJWT } from 'did-jwt';
import { settings } from 'cluster';
import { ServiceEndpoint } from 'did-resolver';
import { DataSyncService } from './data-sync';
import { HDKey } from 'micro-bip32';
import * as secp256k1 from '@noble/secp256k1';
import { seedFromWords, generateSeedWords, privateKeyFromSeed } from 'nostr-tools/nip06';
import { getPublicKey } from 'nostr-tools';
import { AppManager } from './application-manager';

/** Service that handles orchestration between background and frontend. Maps messages between managers and actions initiated in the UI. */
export class OrchestratorBackgroundService {
    constructor(
        private manager: AppManager) {
        this.eventHandlers();
        this.timeoutHandler();
    }

    timeoutHandler() {

    }

    active() {
        this.manager.walletManager.resetTimer();
    }

    // REFACTORY IDENTITY LATER!

    // async createVaultConfigurationDocument(domain: string) {
    //     var account = this.manager.walletManager.activeAccount;
    //     var wallet = this.manager.walletManager.activeWallet;

    //     if (!account || !wallet) {
    //         return;
    //     }

    //     let password = this.state.passwords.get(wallet.id);

    //     if (!password) {
    //         throw Error('missing password');
    //     }

    //     let unlockedMnemonic = null;
    //     unlockedMnemonic = await this.crypto.decryptData(wallet.mnemonic, password);

    //     // TODO: MUST VERIFY THAT ACCOUNT RESTORE AND NODES IS ALL CORRECT BELOW.
    //     var masterSeed = await bip39.mnemonicToSeed(unlockedMnemonic, '');
    //     const masterNode = bip32.fromSeed(masterSeed, this.crypto.getProfileNetwork());

    //     // Get the hardened purpose and account node.
    //     const accountNode = masterNode.derivePath(account.derivationPath); // m/302'/616'

    //     const address0 = this.crypto.getAddress(accountNode);
    //     var keyPair = await this.crypto.getKeyPairFromNode(accountNode);

    //     // Get the identity corresponding with the key pair, does not contain the private key any longer.
    //     var identity = this.crypto.getIdentity(keyPair);

    //     let document = null;

    //     // if (services) {
    //     //     document = identity.document({ service: services });
    //     // } else {
    //     //     document = identity.document();
    //     // }

    //     // Create an issuer from the identity, this is used to issue VCs.
    //     const issuer = identity.issuer({ privateKey: keyPair.privateKeyBuffer?.toString('hex') });

    //     let configuration = await identity.configuration(domain, issuer);

    //     return configuration;

    //     // TODO: The URL should be provided by website triggering DID Document signing.
    //     // let configuration = await identity.configuration('https://localhost', issuer);
    //     // let configurationJson = JSON.stringify(configuration);

    //     // const signedJwt = await identity.signJwt({ payload: payload, privateKeyJwk: keyPairWebKey.privateKeyJwk });
    //     // console.log('SIGNED PAYLOAD:');
    //     // console.log(signedJwt);

    //     // const jws = await identity.jws({
    //     //     payload: document,
    //     //     privateKey: keyPair.privateKeyBuffer?.toString('hex')
    //     // });

    //     // const jwt = await identity.jwt({
    //     //     payload: document,
    //     //     privateKey: keyPair.privateKeyBuffer?.toString('hex')
    //     // });

    //     // var decodedDidDocument = decodeJWT(jws) as unknown as DIDPayload;
    //     // var decodedDidDocument2 = decodeJWT(jwt);

    //     // this.state.store.identities.push({ id: identity.id, published: false, services: [], didPayload: decodedDidDocument, didDocument: decodedDidDocument.payload });

    //     // account.identifier = identity.id;
    //     // account.name = identity.id;
    // }

    // async createIdentityDocument(services?: ServiceEndpoint[]) {
    //     var account = this.state.activeAccount;
    //     var wallet = this.state.activeWallet;

    //     if (!account || !wallet) {
    //         return;
    //     }

    //     let password = this.state.passwords.get(wallet.id);

    //     if (!password) {
    //         throw Error('missing password');
    //     }

    //     let unlockedMnemonic = null;
    //     unlockedMnemonic = await this.crypto.decryptData(wallet.mnemonic, password);

    //     // TODO: MUST VERIFY THAT ACCOUNT RESTORE AND NODES IS ALL CORRECT BELOW.
    //     var masterSeed = await bip39.mnemonicToSeed(unlockedMnemonic, '');
    //     const masterNode = bip32.fromSeed(masterSeed, this.crypto.getProfileNetwork());

    //     // Get the hardened purpose and account node.
    //     const accountNode = masterNode.derivePath(account.derivationPath); // m/302'/616'

    //     const address0 = this.crypto.getAddress(accountNode);
    //     var keyPair = await this.crypto.getKeyPairFromNode(accountNode);

    //     // Get the identity corresponding with the key pair, does not contain the private key any longer.
    //     var identity = this.crypto.getIdentity(keyPair);

    //     let document = null;

    //     if (services) {
    //         document = identity.document({ service: services });
    //     } else {
    //         document = identity.document();
    //     }

    //     // var tmp = JSON.parse(JSON.stringify(document));

    //     // document.id = '';
    //     // //document.id2 = '';
    //     // document.verificationMethod = '';
    //     // document.controller = '';
    //     // document.authentication = '';
    //     // document.assertionMethod = '';

    //     // Make sure the properties are in right order to rule out bug with Mongoose.
    //     // document.id = tmp.id;
    //     //document.id2 = tmp.id;
    //     // document.verificationMethod = tmp.verificationMethod;
    //     // document.controller = tmp.controller;
    //     // document.authentication = tmp.authentication;
    //     // document.assertionMethod = tmp.assertionMethod;

    //     // Create an issuer from the identity, this is used to issue VCs.
    //     const issuer = identity.issuer({ privateKey: keyPair.privateKeyBuffer?.toString('hex') });

    //     // TODO: The URL should be provided by website triggering DID Document signing.
    //     // let configuration = await identity.configuration('https://localhost', issuer);
    //     // let configurationJson = JSON.stringify(configuration);

    //     // const signedJwt = await identity.signJwt({ payload: payload, privateKeyJwk: keyPairWebKey.privateKeyJwk });
    //     // console.log('SIGNED PAYLOAD:');
    //     // console.log(signedJwt);

    //     const jws = await identity.jws({
    //         payload: document,
    //         privateKey: keyPair.privateKeyBuffer?.toString('hex')
    //     });

    //     const jwt = await identity.jwt({
    //         payload: document,
    //         privateKey: keyPair.privateKeyBuffer?.toString('hex')
    //     });

    //     var decodedDidDocument = decodeJWT(jws) as unknown as DIDPayload;
    //     var decodedDidDocument2 = decodeJWT(jwt);

    //     this.state.store.identities.push({ id: identity.id, published: false, sequence: -1, services: [], didPayload: decodedDidDocument, didDocument: decodedDidDocument.payload });

    //     account.identifier = identity.id;
    //     account.name = identity.id;
    // }

    // async updateIdentityDocument(data: Identity) {
    //     // First get the signing key for this identity.
    //     var account = this.state.activeWallet?.accounts.find(a => a.identifier == data.id);

    //     if (!account) {
    //         throw Error('Did not find account to update identity document on.');
    //     }

    //     // var account = this.state.activeAccount;
    //     var wallet = this.state.activeWallet;

    //     if (!account || !wallet) {
    //         return;
    //     }

    //     let password = this.state.passwords.get(wallet.id);

    //     if (!password) {
    //         throw Error('missing password');
    //     }

    //     let unlockedMnemonic = null;
    //     unlockedMnemonic = await this.crypto.decryptData(wallet.mnemonic, password);

    //     // TODO: MUST VERIFY THAT ACCOUNT RESTORE AND NODES IS ALL CORRECT BELOW.
    //     var masterSeed = await bip39.mnemonicToSeed(unlockedMnemonic, '');
    //     const masterNode = bip32.fromSeed(masterSeed, this.crypto.getProfileNetwork());

    //     // Get the hardened purpose and account node.
    //     const accountNode = masterNode.derivePath(account.derivationPath); // m/302'/616'

    //     const address0 = this.crypto.getAddress(accountNode);
    //     var keyPair = await this.crypto.getKeyPairFromNode(accountNode);

    //     // Get the identity corresponding with the key pair, does not contain the private key any longer.
    //     var identity = this.crypto.getIdentity(keyPair);

    //     let document = null;

    //     if (data.services) {
    //         document = identity.document({ service: data.services });
    //     } else {
    //         document = identity.document();
    //     }

    //     // Create an issuer from the identity, this is used to issue VCs.
    //     const issuer = identity.issuer({ privateKey: keyPair.privateKeyBuffer?.toString('hex') });

    //     // TODO: The URL should be provided by website triggering DID Document signing.
    //     // let configuration = await identity.configuration('https://localhost', issuer);
    //     // let configurationJson = JSON.stringify(configuration);

    //     // const signedJwt = await identity.signJwt({ payload: payload, privateKeyJwk: keyPairWebKey.privateKeyJwk });
    //     // console.log('SIGNED PAYLOAD:');
    //     // console.log(signedJwt);

    //     const jws = await identity.jws({
    //         payload: document,
    //         privateKey: keyPair.privateKeyBuffer?.toString('hex')
    //     });

    //     const jwt = await identity.jwt({
    //         payload: document,
    //         privateKey: keyPair.privateKeyBuffer?.toString('hex')
    //     });

    //     var decodedDidDocument = decodeJWT(jws) as unknown as DIDPayload;
    //     var decodedDidDocument2 = decodeJWT(jwt);

    //     var updatedIdentity = data;
    //     updatedIdentity.didPayload = decodedDidDocument;
    //     updatedIdentity.didDocument = decodedDidDocument.payload;

    //     // var updatedIdentity = { id: data.id, published: data.published, services: data.services, didPayload: decodedDidDocument, didDocument: decodedDidDocument.payload };

    //     var existingIndex = this.state.store.identities.findIndex(i => i.id == data.id);

    //     if (existingIndex > -1) {
    //         this.state.store.identities.splice(existingIndex, 1);
    //         this.state.store.identities.push(updatedIdentity);
    //         // this.state.store.identities[existingIndex] = updatedIdentity
    //     } else {
    //         // This shouldn't happen on updates...
    //         this.state.store.identities.push(updatedIdentity);
    //     }

    //     console.log('CHECK THIS:');
    //     console.log(JSON.stringify(this.state.store.identities));

    //     // account.identifier = identity.id;
    //     // account.name = identity.id;
    // }

    refreshState() {
        // Whenever we refresh the state, we'll also reset the timer. State changes should occur based on user-interaction.
        this.active();

        this.manager.broadcastState();
    };

    async setAction(data: Action) {
        this.manager.setAction(data);
    }

    private eventHandlers() {
        // "state" is the first request from the UI.
        this.manager.communication.listen('state', async (port: any, data: any) => {
            // If the local state has not yet initialized, we'll log error. This should normally not happen
            // and we have a race-condition that should be mitigated differently.
            if (!this.manager.state.initialized) {
                console.error('State was requested before initialized. This is a race-condition that should not occurr.');
                return;
            }

            // TODO: Add support for persisting wallet/account connected to domain.
            const url = data.url;
            console.log('Getting last state for: ', url);

            this.manager.broadcastState();
        });

        this.manager.communication.listen('timer-reset', (port: any, data: any) => {
            this.active();
        });

        this.manager.communication.listen('set-action', async (port: any, data: Action) => {
            this.setAction(data);
        });

        this.manager.communication.listen('sign-content', async (port: any, data: { content: string, tabId: string }) => {
            var account = this.manager.walletManager.activeAccount;
            var wallet = this.manager.walletManager.activeWallet;

            if (!wallet || !account) {
                chrome.tabs.sendMessage(Number(data.tabId), { content: 'No wallet/account active.' });
                return;
            }

            if (!this.manager.walletManager.isActiveWalletUnlocked()) {
                throw Error('Active wallet is not unlocked.');
            }

            // TODO: REFACTOR!

            // let unlockedMnemonic = null;
            // unlockedMnemonic = await this.manager.crypto.decryptData(wallet.mnemonic, password);

            // // TODO: MUST VERIFY THAT ACCOUNT RESTORE AND NODES IS ALL CORRECT BELOW.
            // var masterSeed = await bip39.mnemonicToSeed(unlockedMnemonic, '');
            // const masterNode = bip32.fromSeed(masterSeed, this.crypto.getProfileNetwork());

            // // Get the hardened purpose and account node.
            // const accountNode = masterNode.derivePath(account.derivationPath); // m/302'/616'

            // const address0 = this.crypto.getAddress(accountNode);
            // var keyPair = await this.crypto.getKeyPairFromNode(accountNode);

            // // Get the identity corresponding with the key pair, does not contain the private key any longer.
            // var identity = this.crypto.getIdentity(keyPair);

            // let document = identity.document();

            // // Create an issuer from the identity, this is used to issue VCs.
            // const issuer = identity.issuer({ privateKey: keyPair.privateKeyBuffer?.toString('hex') });

            // // TODO: The URL should be provided by website triggering DID Document signing.
            // let configuration = await identity.configuration('https://localhost', issuer);
            // let configurationJson = JSON.stringify(configuration);

            // const setupPayload = {
            //     "@context": "https://schemas.blockcore.net/.well-known/vault-configuration/v1",
            //     "id": identity.id,
            //     "url": "http://localhost:3001",
            //     "name": 'Server Name',
            //     "enabled": true,
            //     "self": true,
            //     "ws": "ws://localhost:9090",
            //     "linked_dids": configuration.linked_dids,
            //     "didDocument": document,
            //     "vaultConfiguration": {
            //     }
            // };

            // let setupDocument = setupPayload;
            // let setupDocumentJson = JSON.stringify(setupDocument);

            // // this.appState.identity = identity;

            // chrome.tabs.sendMessage(Number(data.tabId), { content: setupDocumentJson }, function (response) {
            //     console.log('Signed document sent to web page!');
            // });

            // // chrome.tabs.query({
            // //     // active: true,
            // //     // lastFocusedWindow: true
            // // }, (tabs) => {
            // //     debugger;
            // //     var tab = tabs[0];
            // //     // Provide the tab URL with the state query, because wallets and accounts is connected to domains.
            // //     // this.communication.send('state', { url: tab?.url });
            // //     chrome.tabs.sendMessage(Number(tab.id), { content: data.content }, function (response) {
            // //         console.log('Signed document sent to web page!');
            // //     });
            // // });

            // // chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            // //     chrome.tabs.sendMessage(tabs[0].id, { greeting: "hello" }, function (response) {
            // //         console.log(response.farewell);
            // //     });
            // // });

        });

        this.manager.communication.listen('set-active-wallet-id', async (port: any, data: any) => {
            await this.manager.walletManager.setActiveWallet(data.id);
        });

        // this.communication.listen('set-lock-timer', async (port: any, data: any) => {
        //     this.state.persisted.autoTimeout = data.minutes;
        //     await this.state.save();
        //     this.refreshState();
        // });

        this.manager.communication.listen('set-settings', async (port: any, data: Settings) => {
            await this.manager.setSettings(data);
        });

        // TODO: REFACTOR!
        // this.manager.communication.listen('get-vault-configuration', async (port: any, data: { domain: string }) => {
        //     // Generates the .well-known configuration for Blockcore Vault.
        //     const vaultConfiguration = await this.createVaultConfigurationDocument(data.domain);
        //     this.manager.communication.send(port, 'vault-configuration', vaultConfiguration);
        // });


        this.manager.communication.listen('account-update', async (port: any, data: { id: string, index: number, fields: { name: string, icon: string } }) => {
            const wallet = this.manager.walletManager.getWallet(data.id);

            if (!wallet) {
                return;
            }

            const account = wallet.accounts[data.index];
            account.name = data.fields.name;
            account.icon = data.fields.icon;

            await this.manager.state.save();
            this.refreshState();

            // When this happens, the handlers will perform an routing change.
            this.manager.communication.send(port, 'account-updated');
        });

        // this.communication.listen('set-account-icon', async (port: any, data: { id: string, index: number, icon: string }) => {
        //     const wallet = this.state.persisted.wallets.find(w => w.id == data.id);

        //     if (!wallet) {
        //         return;
        //     }

        //     const account = wallet.accounts[data.index];
        //     account.icon = data.icon;

        //     await this.state.save();
        //     this.refreshState();

        //     this.communication.send(port, 'account-icon-set');
        // });

        this.manager.communication.listen('set-wallet-name', async (port: any, data: { id: string, name: string }) => {
            const wallet = this.manager.walletManager.getWallet(data.id);

            if (!wallet) {
                return;
            }

            wallet.name = data.name;

            await this.manager.state.save();

            this.refreshState();
        });

        this.manager.communication.listen('account-remove', async (port: any, data: { id: string, index: number }) => {
            const wallet = this.manager.walletManager.getWallet(data.id);

            if (!wallet) {
                return;
            }

            // Remove the active account from the array.
            wallet.accounts.splice(data.index, 1);

            if (wallet.accounts.length > 0) {
                wallet.activeAccountIndex = 0;
            } else {
                wallet.activeAccountIndex = -1;
            }

            await this.manager.state.save();
            this.refreshState();

            // Raise this after state has been updated, so orchestrator in UI can redirect correctly.
            this.manager.communication.sendToAll('account-removed', data);
        });

        this.manager.communication.listen('wallet-remove', async (port: any, data: { id: string, index: number }) => {
            await this.manager.walletManager.removeWallet(data.id);

            // Raise this after state has been updated, so orchestrator in UI can redirect correctly.
            this.manager.communication.sendToAll('wallet-removed', data);
        });

        this.manager.communication.listen('wallet-lock', async (port: any, data: { id: string }) => {
            this.manager.walletManager.lockWallet(data.id);

            // Make sure we inform all instances when a wallet is unlocked.
            this.manager.communication.sendToAll('wallet-locked');
        });

        this.manager.communication.listen('wallet-unlock', async (port: any, data: { id: string, password: string }) => {
            const unlocked = await this.manager.walletManager.unlockWallet(data.id, data.password);

            debugger;

            if (unlocked) {
                this.manager.communication.sendToAll('wallet-unlocked');
            } else {
                this.manager.communication.send(port, 'error', { exception: null, message: 'Invalid password' });
            }
        });

        this.manager.communication.listen('wallet-export-recovery-phrase', async (port: any, data: { id: string, password: string }) => {
            var recoveryPhrase = this.manager.walletManager.revealSecretRecoveryPhrase(data.id, data.password);

            if (recoveryPhrase) {
                // Make sure we inform all instances when a wallet is unlocked.
                this.manager.communication.sendToAll('wallet-exported-recovery-phrase', recoveryPhrase);
            } else {
                this.manager.communication.send(port, 'error', { exception: null, message: 'Invalid password' });
            }
        });

        // TODO: Expand the address generation APIs to keep track of indexes for both change and non-change.
        this.manager.communication.listen('address-generate', async (port: any, data: { index: number }) => {

            debugger;

            if (!this.manager.walletManager.activeWallet) {
                return;
            }

            const address = this.manager.walletManager.getReceiveAddress(this.manager.walletManager.activeAccount);

            this.manager.communication.send(port, 'address-generated', { address: address })

            // var account = this.state.activeAccount;
            // var wallet = this.state.activeWallet;

            // if (!account || !wallet) {
            //     return;
            // }

            // let password = this.state.passwords.get(this.state.activeWallet.id);

            // if (!password) {
            //     return;
            // }

            // let unlockedMnemonic = null;
            // unlockedMnemonic = await this.crypto.decryptData(wallet.mnemonic, password);

            // let network: any;

            // console.log(account);
            // console.log(account.network);

            // if (account.network === 105105) {
            //     network = {
            //         messagePrefix: '\x18Bitcoin Signed Message:\n',
            //         bech32: 'strax',
            //         bip32: {
            //             public: 0x0488b21e,
            //             private: 0x0488ade4,
            //         },
            //         pubKeyHash: 75,
            //         scriptHash: 140,
            //         wif: 0x08
            //     }
            // }
            // else if (account.network === 1926) {
            //     network = {
            //         messagePrefix: '\x18CityCoin Signed Message:\n', // TODO: City Chain should migrate to use same prefix as Bitcoin.
            //         bech32: 'strax',
            //         bip32: {
            //             public: 0x0488b21e,
            //             private: 0x0488ade4,
            //         },
            //         pubKeyHash: 0x1c,
            //         scriptHash: 0x58,
            //         wif: 0x08
            //     }
            // } else if (account.network === 401) {
            //     network = {
            //         messagePrefix: '\x18Bitcoin Signed Message:\n',
            //         bech32: 'tb',
            //         bip32: {
            //             public: 0x0488b21e,
            //             private: 0x0488ade4,
            //         },
            //         pubKeyHash: 28,
            //         scriptHash: 88,
            //         wif: 0x08 // TODO: Verify if this is still used for CRS.
            //     }
            // } else {
            //     network = {
            //         messagePrefix: '\x18Bitcoin Signed Message:\n',
            //         bech32: 'id',
            //         bip32: {
            //             public: 0x0488b21e,
            //             private: 0x0488ade4,
            //         },
            //         pubKeyHash: 55,
            //         scriptHash: 117,
            //         wif: 0x08
            //     }
            // }

            // // TODO: Obviously we should not repeat this process from recovery phrase, but this should 
            // // be applied during wallet unlock and state of the node should be kept in-memory. This is just
            // // done like this for quick prototyping.
            // var masterSeed = await bip39.mnemonicToSeed(unlockedMnemonic, '');
            // const masterNode = bip32.fromSeed(masterSeed, network);

            // // Get the hardened purpose and account node.
            // const accountNode = masterNode.derivePath(account.derivationPath); // m/44'/105105'/0'

            // // TODO: use this in the account manager.
            // const xpub = accountNode.neutered().toBase58();

            // // console.log(wallet.mnemonic);
            // // console.log(unlockedMnemonic);
            // // console.log(accountNode.neutered().toBase58());

            // // const addressNode = masterNode.deriveHardened(data.index);
            // const addressNodeReceive = accountNode.derive(0);
            // const addressNodeReceiveIndex0 = addressNodeReceive.derive(0);
            // const addressNodeChange = accountNode.derive(1);
            // const addressNodeChangeIndex0 = addressNodeChange.derive(0);

            // const address0 = this.crypto.getAddressByNetworkp2pkh(addressNodeReceiveIndex0, network);

            // const receiveAddress = [];
            // const changeAddress = [];

            // // TODO: This is just a basic prototype to return many receive and change address to the UI:
            // for (let i = 0; i < 2; i++) {

            //     const addressNodeReceive = accountNode.derive(0);
            //     const addressNodeReceiveIndex = addressNodeReceive.derive(i);
            //     const addressNodeChange = accountNode.derive(1);
            //     const addressNodeChangeIndex = addressNodeChange.derive(i);

            //     receiveAddress.push({ change: false, index: i, address: this.crypto.getAddressByNetworkp2pkh(addressNodeReceiveIndex, network) });
            //     changeAddress.push({ change: true, index: i, address: this.crypto.getAddressByNetworkp2pkh(addressNodeChangeIndex, network) });
            // }



        });

        // TODO: REFACTOR THIS INTO THE NETWORK DEFINITION OR WALLET MANAGER.
        // this.manager.communication.listen('nostr-generate', async (port: any, data: { index: number }) => {
        //     if (!this.state.activeWallet) {
        //         return;
        //     }

        //     var account = this.state.activeAccount;
        //     var wallet = this.state.activeWallet;

        //     if (!account || !wallet) {
        //         return;
        //     }

        //     let password = this.state.passwords.get(this.state.activeWallet.id);

        //     if (!password) {
        //         return;
        //     }

        //     let unlockedMnemonic = null;
        //     unlockedMnemonic = await this.crypto.decryptData(wallet.mnemonic, password);

        //     let network: any;

        //     console.log(account);
        //     console.log(account.network);

        //     if (account.network === 105105) {
        //         network = {
        //             messagePrefix: '\x18Bitcoin Signed Message:\n',
        //             bech32: 'strax',
        //             bip32: {
        //                 public: 0x0488b21e,
        //                 private: 0x0488ade4,
        //             },
        //             pubKeyHash: 75,
        //             scriptHash: 140,
        //             wif: 0x08
        //         }
        //     }
        //     else if (account.network === 1926) {
        //         network = {
        //             messagePrefix: '\x18CityCoin Signed Message:\n', // TODO: City Chain should migrate to use same prefix as Bitcoin.
        //             bech32: 'strax',
        //             bip32: {
        //                 public: 0x0488b21e,
        //                 private: 0x0488ade4,
        //             },
        //             pubKeyHash: 0x1c,
        //             scriptHash: 0x58,
        //             wif: 0x08
        //         }
        //     } else {
        //         network = {
        //             messagePrefix: '\x18Bitcoin Signed Message:\n',
        //             bech32: 'id',
        //             bip32: {
        //                 public: 0x0488b21e,
        //                 private: 0x0488ade4,
        //             },
        //             pubKeyHash: 55,
        //             scriptHash: 117,
        //             wif: 0x08
        //         }
        //     }

        //     debugger;

        //     // TODO: Obviously we should not repeat this process from recovery phrase, but this should 
        //     // be applied during wallet unlock and state of the node should be kept in-memory. This is just
        //     // done like this for quick prototyping.
        //     var masterSeed = await bip39.mnemonicToSeed(unlockedMnemonic, '');

        //     const seed = seedFromWords(unlockedMnemonic);
        //     const priv = privateKeyFromSeed(seed);
        //     const pub = getPublicKey(priv);
        //     const pubHex = Buffer.from(pub).toString('hex');

        //     // Nostr uses Bitcoin network definition, no need to supply Network ("Version" for micro-bip32).
        //     const masterNode = bip32.fromSeed(masterSeed);
        //     const root = HDKey.fromMasterSeed(Buffer.from(masterSeed));

        //     if (!account.derivationPath) {
        //         account.derivationPath = `m/44'/1237'/0'`;
        //     }

        //     // let root = HDKey.fromMasterSeed(Buffer.from(seed, 'hex'))
        //     // return Buffer.from(root.derive(`m/44'/1237'/0'/0/0`).privateKey).toString(
        //     //   'hex'
        //     // )

        //     // Get the hardened purpose and account node.
        //     const accountNode = masterNode.derivePath(account.derivationPath); // IDENTITY: m/302'/616'
        //     const accountNode2 = root.derive(account.derivationPath);
        //     const accountNode3 = root.derive(`m/44'/1237'/0'/0/0`);


        //     const identifierKeyPair = accountNode.derive(0).derive(0);
        //     const identifierKeyPair2 = accountNode2.deriveChild(0).deriveChild(0);
        //     const identifierKeyPair3 = accountNode3;

        //     const address = this.crypto.getAddressByNetworkp2pkh(identifierKeyPair, network);
        //     const address2 = this.crypto.getAddressByNetworkp2pkhFromBuffer(Buffer.from(Array.from(identifierKeyPair2.publicKey!)), network);

        //     const idArray = secp256k1.schnorr.getPublicKey(identifierKeyPair.privateKey!.toString('hex'));
        //     const id = Buffer.from(idArray).toString('hex');

        //     // Uncaught (in promise) TypeError: The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type object
        //     const id2Array = secp256k1.schnorr.getPublicKey(Buffer.from(identifierKeyPair2.privateKey!).toString('hex'));
        //     const id2 = Buffer.from(id2Array).toString('hex');

        //     const id3hex = Buffer.from(identifierKeyPair3.privateKey!).toString('hex');
        //     const id3Array = secp256k1.schnorr.getPublicKey(id3hex);
        //     const id3 = Buffer.from(id3Array).toString('hex');

        //     if (address != address2) {
        //         throw Error('oh fuck');
        //     }

        //     if (id != id2) {
        //         throw Error('oh fuck');
        //     }

        //     // var keyPair = await this.crypto.getKeyPairFromNode(accountNode);
        //     // var keyPair2 = await this.crypto.getKeyPairFromNode(accountNode);

        //     // // TODO: use this in the account manager.
        //     // const xpub = accountNode.neutered().toBase58();

        //     // // console.log(wallet.mnemonic);
        //     // // console.log(unlockedMnemonic);
        //     // // console.log(accountNode.neutered().toBase58());

        //     // // const addressNode = masterNode.deriveHardened(data.index);
        //     // const addressNodeReceive = accountNode.derive(0);
        //     // const addressNodeReceiveIndex0 = addressNodeReceive.derive(0);
        //     // const addressNodeChange = accountNode.derive(1);
        //     // const addressNodeChangeIndex0 = addressNodeChange.derive(0);

        //     // const address0 = this.crypto.getAddressByNetworkp2pkh(addressNodeReceiveIndex0, network);

        //     // const receiveAddress = [];
        //     // const changeAddress = [];

        //     // // TODO: This is just a basic prototype to return many receive and change address to the UI:
        //     // for (let i = 0; i < 2; i++) {

        //     //     const addressNodeReceive = accountNode.derive(0);
        //     //     const addressNodeReceiveIndex = addressNodeReceive.derive(i);
        //     //     const addressNodeChange = accountNode.derive(1);
        //     //     const addressNodeChangeIndex = addressNodeChange.derive(i);

        //     //     receiveAddress.push({ change: false, index: i, address: this.crypto.getAddressByNetworkp2pkh(addressNodeReceiveIndex, network) });
        //     //     changeAddress.push({ change: true, index: i, address: this.crypto.getAddressByNetworkp2pkh(addressNodeChangeIndex, network) });
        //     // }

        //     this.communication.send(port, 'nostr-generated', { id: id })
        // });

        this.manager.communication.listen('account-create', async (port: any, data: Account) => {
            if (!this.manager.walletManager.activeWallet) {
                return;
            }

            await this.manager.walletManager.addAccount(data);

            this.refreshState();

            this.manager.communication.sendToAll('account-created');

            // TODO: REFACTOR WHEN TIME COMES!
            // this.manager.communication.sendToAll('identity-created');
        });

        // TODO: REFACTOR IDENTITY IN THE FUTURE!
        // this.manager.communication.listen('identity-update', async (port: any, data: Identity) => {

        //     console.log('CHECK THIS 0:');
        //     console.log(JSON.stringify(data));

        //     await this.updateIdentityDocument(data);

        //     await this.state.saveStore(this.state.store);

        //     console.log('CHECK THIS 2:');
        //     console.log(JSON.stringify(this.state.store.identities));

        //     await this.state.save();

        //     this.refreshState();

        //     this.communication.sendToAll('identity-updated', data);

        //     // if (!this.state.activeWallet) {
        //     //     return;
        //     // }

        //     // // Add the new account.
        //     // this.state.activeWallet.accounts.push(data);

        //     // this.state.activeWallet.activeAccountIndex = (this.state.activeWallet.accounts.length - 1);

        //     // if (this.state.activeAccount?.network === NETWORK_IDENTITY) {
        //     //     // Generate DID Document for the identity and persist it.
        //     //     this.createIdentityDocument();

        //     //     // TODO: Perform blockchain / vault data query and recovery.
        //     //     // If there are transactions, DID Documents, NFTs or anythign else, we should launch the
        //     //     // query probe here.


        //     // }
        // });

        // this.communication.listen('identity-publish', async (port: any, data: Identity) => {
        //     await this.sync.saveIdentity(data);

        //     // await this.updateIdentityDocument(data);

        //     // Perhaps set this when successful callback from Vault?
        //     data.published = true;

        //     var existingIndex = this.state.store.identities.findIndex(i => i.id == data.id);
        //     this.state.store.identities[existingIndex] = data;

        //     await this.state.saveStore(this.state.store);

        //     this.refreshState();

        //     this.communication.sendToAll('identity-published', data);


        //     // Begin verification


        // });

        // this.communication.listen('vault-publish', async (port: any, data: Vault) => {
        //     await this.sync.saveVault(data);

        //     // await this.updateIdentityDocument(data);

        //     // Perhaps set this when successful callback from Vault?
        //     data.published = true;

        //     // var existingIndex = this.state.store.identities.findIndex(i => i.id == data.id);
        //     // this.state.store.identities[existingIndex] = data;

        //     // await this.state.saveStore(this.state.store);

        //     // this.refreshState();

        //     this.communication.sendToAll('vault-published', data);

        //     // Begin verification
        // });

        this.manager.communication.listen('set-active-account', async (port: any, data: { index: number }) => {
            if (!this.manager.walletManager.activeWallet) {
                console.log('No active wallet on set-active-account.');
                return;
            }

            this.manager.walletManager.activeWallet.activeAccountIndex = data.index;

            await this.manager.state.save();

            this.refreshState();

            this.manager.communication.sendToAll('active-account-changed', { index: data.index });
        });

        this.manager.communication.listen('wallet-create', async (port: any, data: Wallet) => {
            // Add the new wallet.
            // TODO: Do we first want to validate if the wallet is not already added with same ID?
            // If so... we must ensure that mnemonics are not different, or a call might wipe existing wallet.
            await this.manager.walletManager.addWallet(data);

            this.refreshState();
            
            // VERIFICATION HACK, NOT POSSIBLE YET DUE TO xpub NOT GENERATED ON UI:
            // this.manager.walletManager.activeWallet.activeAccountIndex = 0;
            // const address = await this.manager.walletManager.getReceiveAddress(this.manager.walletManager.activeAccount);

            // TODO: REFACTOR IDENTITY CREATION IN THE FUTURE.
            // if (this.state.activeAccount?.network === NETWORK_IDENTITY) {
            //     // Generate DID Document for the identity and persist it.
            //     this.createIdentityDocument();
            //     await this.state.saveStore(this.state.store);
            // }

            // Make sure we inform all instances when a wallet is deleted.
            this.manager.communication.sendToAll('wallet-created');

            // this.communication.sendToAll('account-created');

            // TODO: REFATOR IN FUTURE.
            //this.communication.sendToAll('identity-created');
        });
    }
}
