import { Account, State, Wallet, Action, DIDPayload, Settings, Identity } from 'src/app/interfaces';
import { MINUTE, NETWORK_IDENTITY } from 'src/app/shared/constants';
import { AppState } from './application-state';
import { CommunicationBackgroundService } from './communication';
import { CryptoUtility } from './crypto-utility';
import * as bip39 from 'bip39';
import * as bip32 from 'bip32';
import { decodeJWT, verifyJWT } from 'did-jwt';
import { settings } from 'cluster';
import { ServiceEndpoint } from 'did-resolver';
import { DataSyncService } from './data-sync';

export class OrchestratorBackgroundService {
    private communication!: CommunicationBackgroundService;
    private state!: AppState;
    private crypto!: CryptoUtility;
    private sync!: DataSyncService;
    timer: any;

    configure(communication: CommunicationBackgroundService, state: AppState, crypto: CryptoUtility, sync: DataSyncService) {
        this.communication = communication;
        this.state = state;
        this.crypto = crypto;
        this.sync = sync;
        this.eventHandlers();
        this.timeoutHandler();
    }

    timeoutHandler() {

    }

    active() {
        console.log('active:');
        this.resetTimer();
    }

    async onInactiveTimeout() {
        console.log('onInactiveTimeout:');

        this.state.passwords.clear();

        await this.state.save();
        this.refreshState();

        this.communication.sendToAll('wallet-locked');

        //this.unlocked = false;
        // console.log('redirect to root:');
        // Redirect to root and log user out of their wallet.
        // this.router.navigateByUrl('/');
    }

    resetTimer() {
        console.log('resetTimer:', this.state.persisted.settings.autoTimeout * MINUTE);

        if (this.timer) {
            clearTimeout(this.timer);
        }

        // We will only set timer if the wallet is actually unlocked.
        if (this.state.passwords.size > 0) {
            console.log('Setting timer to automatically unlock.');
            this.timer = setTimeout(
                // () => this.ngZone.run(() => {
                () => {
                    this.onInactiveTimeout();
                },
                // }),
                this.state.persisted.settings.autoTimeout * MINUTE
            );
        } else {
            console.log('Timer not set since wallet is not unlocked.');
        }
    }

    async createVaultConfigurationDocument(domain: string) {
        var account = this.state.activeAccount;
        var wallet = this.state.activeWallet;

        if (!account || !wallet) {
            return;
        }

        // TODO: MUST VERIFY THAT ACCOUNT RESTORE AND NODES IS ALL CORRECT BELOW.
        var masterSeed = await bip39.mnemonicToSeed(wallet.mnemonic, '');
        const masterNode = bip32.fromSeed(masterSeed, this.crypto.getProfileNetwork());

        // Get the hardened purpose and account node.
        const accountNode = masterNode.derivePath(account.derivationPath); // m/302'/616'

        const address0 = this.crypto.getAddress(accountNode);
        var keyPair = await this.crypto.getKeyPairFromNode(accountNode);

        // Get the identity corresponding with the key pair, does not contain the private key any longer.
        var identity = this.crypto.getIdentity(keyPair);

        let document = null;

        // if (services) {
        //     document = identity.document({ service: services });
        // } else {
        //     document = identity.document();
        // }

        // Create an issuer from the identity, this is used to issue VCs.
        const issuer = identity.issuer({ privateKey: keyPair.privateKeyBuffer?.toString('hex') });

        let configuration = await identity.configuration(domain, issuer);

        return configuration;

        // TODO: The URL should be provided by website triggering DID Document signing.
        // let configuration = await identity.configuration('https://localhost', issuer);
        // let configurationJson = JSON.stringify(configuration);

        // const signedJwt = await identity.signJwt({ payload: payload, privateKeyJwk: keyPairWebKey.privateKeyJwk });
        // console.log('SIGNED PAYLOAD:');
        // console.log(signedJwt);

        // const jws = await identity.jws({
        //     payload: document,
        //     privateKey: keyPair.privateKeyBuffer?.toString('hex')
        // });

        // const jwt = await identity.jwt({
        //     payload: document,
        //     privateKey: keyPair.privateKeyBuffer?.toString('hex')
        // });

        // var decodedDidDocument = decodeJWT(jws) as unknown as DIDPayload;
        // var decodedDidDocument2 = decodeJWT(jwt);

        // this.state.store.identities.push({ id: identity.id, published: false, services: [], didPayload: decodedDidDocument, didDocument: decodedDidDocument.payload });

        // account.identifier = identity.id;
        // account.name = identity.id;
    }

    async createIdentityDocument(services?: ServiceEndpoint[]) {
        var account = this.state.activeAccount;
        var wallet = this.state.activeWallet;

        if (!account || !wallet) {
            return;
        }

        // TODO: MUST VERIFY THAT ACCOUNT RESTORE AND NODES IS ALL CORRECT BELOW.
        var masterSeed = await bip39.mnemonicToSeed(wallet.mnemonic, '');
        const masterNode = bip32.fromSeed(masterSeed, this.crypto.getProfileNetwork());

        // Get the hardened purpose and account node.
        const accountNode = masterNode.derivePath(account.derivationPath); // m/302'/616'

        const address0 = this.crypto.getAddress(accountNode);
        var keyPair = await this.crypto.getKeyPairFromNode(accountNode);

        // Get the identity corresponding with the key pair, does not contain the private key any longer.
        var identity = this.crypto.getIdentity(keyPair);

        let document = null;

        if (services) {
            document = identity.document({ service: services });
        } else {
            document = identity.document();
        }

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
        const issuer = identity.issuer({ privateKey: keyPair.privateKeyBuffer?.toString('hex') });

        // TODO: The URL should be provided by website triggering DID Document signing.
        // let configuration = await identity.configuration('https://localhost', issuer);
        // let configurationJson = JSON.stringify(configuration);

        // const signedJwt = await identity.signJwt({ payload: payload, privateKeyJwk: keyPairWebKey.privateKeyJwk });
        // console.log('SIGNED PAYLOAD:');
        // console.log(signedJwt);

        const jws = await identity.jws({
            payload: document,
            privateKey: keyPair.privateKeyBuffer?.toString('hex')
        });

        const jwt = await identity.jwt({
            payload: document,
            privateKey: keyPair.privateKeyBuffer?.toString('hex')
        });

        var decodedDidDocument = decodeJWT(jws) as unknown as DIDPayload;
        var decodedDidDocument2 = decodeJWT(jwt);

        this.state.store.identities.push({ id: identity.id, published: false, sequence: -1, services: [], didPayload: decodedDidDocument, didDocument: decodedDidDocument.payload });

        account.identifier = identity.id;
        account.name = identity.id;
    }

    async updateIdentityDocument(data: Identity) {
        // First get the signing key for this identity.
        var account = this.state.activeWallet?.accounts.find(a => a.identifier == data.id);

        if (!account) {
            throw Error('Did not find account to update identity document on.');
        }

        // var account = this.state.activeAccount;
        var wallet = this.state.activeWallet;

        if (!account || !wallet) {
            return;
        }

        // TODO: MUST VERIFY THAT ACCOUNT RESTORE AND NODES IS ALL CORRECT BELOW.
        var masterSeed = await bip39.mnemonicToSeed(wallet.mnemonic, '');
        const masterNode = bip32.fromSeed(masterSeed, this.crypto.getProfileNetwork());

        // Get the hardened purpose and account node.
        const accountNode = masterNode.derivePath(account.derivationPath); // m/302'/616'

        const address0 = this.crypto.getAddress(accountNode);
        var keyPair = await this.crypto.getKeyPairFromNode(accountNode);

        // Get the identity corresponding with the key pair, does not contain the private key any longer.
        var identity = this.crypto.getIdentity(keyPair);

        let document = null;

        if (data.services) {
            document = identity.document({ service: data.services });
        } else {
            document = identity.document();
        }

        // Create an issuer from the identity, this is used to issue VCs.
        const issuer = identity.issuer({ privateKey: keyPair.privateKeyBuffer?.toString('hex') });

        // TODO: The URL should be provided by website triggering DID Document signing.
        // let configuration = await identity.configuration('https://localhost', issuer);
        // let configurationJson = JSON.stringify(configuration);

        // const signedJwt = await identity.signJwt({ payload: payload, privateKeyJwk: keyPairWebKey.privateKeyJwk });
        // console.log('SIGNED PAYLOAD:');
        // console.log(signedJwt);

        const jws = await identity.jws({
            payload: document,
            privateKey: keyPair.privateKeyBuffer?.toString('hex')
        });

        const jwt = await identity.jwt({
            payload: document,
            privateKey: keyPair.privateKeyBuffer?.toString('hex')
        });

        var decodedDidDocument = decodeJWT(jws) as unknown as DIDPayload;
        var decodedDidDocument2 = decodeJWT(jwt);

        var updatedIdentity = data;
        updatedIdentity.didPayload = decodedDidDocument;
        updatedIdentity.didDocument = decodedDidDocument.payload;

        // var updatedIdentity = { id: data.id, published: data.published, services: data.services, didPayload: decodedDidDocument, didDocument: decodedDidDocument.payload };

        var existingIndex = this.state.store.identities.findIndex(i => i.id == data.id);

        if (existingIndex > -1) {
            this.state.store.identities.splice(existingIndex, 1);
            this.state.store.identities.push(updatedIdentity);
            // this.state.store.identities[existingIndex] = updatedIdentity
        } else {
            // This shouldn't happen on updates...
            this.state.store.identities.push(updatedIdentity);
        }

        console.log('CHECK THIS:');
        console.log(JSON.stringify(this.state.store.identities));

        // account.identifier = identity.id;
        // account.name = identity.id;
    }

    refreshState() {
        // Whenever we refresh the state, we'll also reset the timer. State changes should occur based on user-interaction.
        this.active();

        const initialState: State = {
            action: this.state.action,
            persisted: this.state.persisted,
            unlocked: this.state.unlocked,
            store: this.state.store
        }

        // Send new state to UI instances.
        this.communication.sendToAll('state', initialState);
    };

    async setAction(data: Action) {
        if (typeof data.action !== 'string') {
            console.error('Only objects that are string are allowed as actions.');
            return;
        }

        if (data.document != null && typeof data.document !== 'string') {
            console.error('Only objects that are string are allowed as actions.');
            return;
        }

        this.state.action = data;

        await this.state.saveAction();

        this.refreshState();

        // Raise this after state has been updated, so orchestrator in UI can redirect correctly.
        this.communication.sendToAll('action-changed', this.state.action);
    }

    private eventHandlers() {
        // "state" is the first request from the UI.
        this.communication.listen('state', async (port: any, data: any) => {
            // If the local state has not yet initialized, we'll log error. This should normally not happen
            // and we have a race-condition that should be mitigated differently.
            if (!this.state.initialized) {
                console.error('State was requested before initialized. This is a race-condition that should not occurr.');
                return;
            }

            // TODO: Add support for persisting wallet/account connected to domain.
            const url = data.url;
            console.log('Getting last state for: ', url);

            const initialState: State = {
                action: this.state.action,
                persisted: this.state.persisted,
                unlocked: this.state.unlocked,
                store: this.state.store
            };

            this.communication.send(port, 'state', initialState);
        });

        // this.communication.listen('getlock', (port: any, data: any) => {
        //     if (this.state.password) {
        //         this.communication.send(port, 'getlock', true);
        //     } else {
        //         this.communication.send(port, 'getlock', false);
        //     }
        // });

        this.communication.listen('timer-reset', (port: any, data: any) => {
            this.active();
        });

        this.communication.listen('set-action', async (port: any, data: Action) => {
            this.setAction(data);
        });

        this.communication.listen('sign-content', async (port: any, data: { content: string, tabId: string }) => {
            var account = this.state.activeAccount;
            var wallet = this.state.activeWallet;

            if (!wallet || !account) {
                chrome.tabs.sendMessage(Number(data.tabId), { content: 'No wallet/account active.' });
                return;
            }

            // TODO: MUST VERIFY THAT ACCOUNT RESTORE AND NODES IS ALL CORRECT BELOW.
            var masterSeed = await bip39.mnemonicToSeed(wallet.mnemonic, '');
            const masterNode = bip32.fromSeed(masterSeed, this.crypto.getProfileNetwork());

            // Get the hardened purpose and account node.
            const accountNode = masterNode.derivePath(account.derivationPath); // m/302'/616'

            const address0 = this.crypto.getAddress(accountNode);
            var keyPair = await this.crypto.getKeyPairFromNode(accountNode);

            // Get the identity corresponding with the key pair, does not contain the private key any longer.
            var identity = this.crypto.getIdentity(keyPair);

            let document = identity.document();

            // Create an issuer from the identity, this is used to issue VCs.
            const issuer = identity.issuer({ privateKey: keyPair.privateKeyBuffer?.toString('hex') });

            // TODO: The URL should be provided by website triggering DID Document signing.
            let configuration = await identity.configuration('https://localhost', issuer);
            let configurationJson = JSON.stringify(configuration);

            const setupPayload = {
                "@context": "https://schemas.blockcore.net/.well-known/vault-configuration/v1",
                "id": identity.id,
                "url": "http://localhost:3001",
                "name": 'Server Name',
                "enabled": true,
                "self": true,
                "ws": "ws://localhost:9090",
                "linked_dids": configuration.linked_dids,
                "didDocument": document,
                "vaultConfiguration": {
                }
            };

            let setupDocument = setupPayload;
            let setupDocumentJson = JSON.stringify(setupDocument);

            // this.appState.identity = identity;

            chrome.tabs.sendMessage(Number(data.tabId), { content: setupDocumentJson }, function (response) {
                console.log('Signed document sent to web page!');
            });

            // chrome.tabs.query({
            //     // active: true,
            //     // lastFocusedWindow: true
            // }, (tabs) => {
            //     debugger;
            //     var tab = tabs[0];
            //     // Provide the tab URL with the state query, because wallets and accounts is connected to domains.
            //     // this.communication.send('state', { url: tab?.url });
            //     chrome.tabs.sendMessage(Number(tab.id), { content: data.content }, function (response) {
            //         console.log('Signed document sent to web page!');
            //     });
            // });

            // chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            //     chrome.tabs.sendMessage(tabs[0].id, { greeting: "hello" }, function (response) {
            //         console.log(response.farewell);
            //     });
            // });

        });

        this.communication.listen('set-active-wallet-id', async (port: any, data: any) => {
            this.state.persisted.activeWalletId = data.id;
            await this.state.save();
            this.refreshState();
        });

        // this.communication.listen('set-lock-timer', async (port: any, data: any) => {
        //     this.state.persisted.autoTimeout = data.minutes;
        //     await this.state.save();
        //     this.refreshState();
        // });

        this.communication.listen('set-settings', async (port: any, data: Settings) => {
            this.state.persisted.settings = data;
            await this.state.save();
            this.refreshState();
        });

        this.communication.listen('get-vault-configuration', async (port: any, data: { domain: string }) => {
            // Generates the .well-known configuration for Blockcore Vault.
            const vaultConfiguration = await this.createVaultConfigurationDocument(data.domain);
            this.communication.send(port, 'vault-configuration', vaultConfiguration);
        });

        this.communication.listen('account-update', async (port: any, data: { id: string, index: number, fields: { name: string, icon: string } }) => {
            const wallet = this.state.persisted.wallets.find(w => w.id == data.id);

            if (!wallet) {
                return;
            }

            const account = wallet.accounts[data.index];
            account.name = data.fields.name;
            account.icon = data.fields.icon;

            await this.state.save();
            this.refreshState();

            this.communication.send(port, 'account-updated');
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

        this.communication.listen('set-wallet-name', async (port: any, data: { id: string, name: string }) => {
            const wallet = this.state.persisted.wallets.find(w => w.id == data.id);

            if (!wallet) {
                return;
            }

            wallet.name = data.name;
            await this.state.save();
            this.refreshState();
        });

        this.communication.listen('account-remove', async (port: any, data: { id: string, index: number }) => {
            const wallet = this.state.persisted.wallets.find(w => w.id == data.id);

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

            await this.state.save();
            this.refreshState();

            // Raise this after state has been updated, so orchestrator in UI can redirect correctly.
            this.communication.sendToAll('account-removed', data);
        });

        this.communication.listen('wallet-remove', async (port: any, data: { id: string, index: number }) => {
            const walletIndex = this.state.persisted.wallets.findIndex(w => w.id == data.id);

            // Remove the wallet.
            this.state.persisted.wallets.splice(walletIndex, 1);

            // Remove the password for this wallet, if it was unlocked.
            this.state.passwords.delete(data.id);

            await this.state.save();
            this.refreshState();

            // Raise this after state has been updated, so orchestrator in UI can redirect correctly.
            this.communication.sendToAll('wallet-removed', data);
        });

        this.communication.listen('wallet-lock', async (port: any, data: { id: string }) => {

            this.state.passwords.delete(data.id);

            this.refreshState();

            // Make sure we inform all instances when a wallet is unlocked.
            this.communication.sendToAll('wallet-locked');
        });

        this.communication.listen('wallet-unlock', async (port: any, data: { id: string, password: string }) => {
            var wallet = this.state.persisted.wallets.find(w => w.id == data.id);

            if (!wallet) {
                return;
            }

            let unlockedMnemonic = null;
            unlockedMnemonic = await this.crypto.decryptData(wallet.mnemonic, data.password);

            if (unlockedMnemonic) {
                this.state.persisted.activeWalletId = wallet.id;

                // Add this wallet to list of unlocked.
                this.state.passwords.set(data.id, data.password);

                // if (wallet.accounts.length > 0 && wallet.activeAccountIndex == null) {
                //     wallet.activeAccountIndex = 0;
                // }

                // if (this.state.persisted.activeAccountIndex

                // this.uiState.unlocked = true;

                // if (this.uiState.persisted.activeAccountIndex == null) {
                //     this.uiState.persisted.activeAccountIndex = 0;
                // }

                // // Keep the unlocked mnemonic in-memory until auto-lock timer removes it.
                // this.uiState.unlockedMnemonic = unlockedMnemonic;

                // this.uiState.port?.postMessage({ method: 'unlock', data: this.unlockPassword });

                // this.router.navigateByUrl('/account/view/' + this.uiState.persisted.activeAccountIndex);

                // Add the new wallet.
                // this.state.persisted.wallets.set(data.id, data);

                // Change the active wallet to the new one.
                // this.state.persisted.activeWalletId = data.id;

                // Persist the state.
                await this.state.save();

                this.refreshState();

                // Make sure we inform all instances when a wallet is unlocked.
                this.communication.sendToAll('wallet-unlocked');

            } else {
                this.communication.send(port, 'error', { exception: null, message: 'Invalid password' });
                // this.error = 'Invalid password';
            }
        });

        this.communication.listen('account-create', async (port: any, data: Account) => {
            if (!this.state.activeWallet) {
                return;
            }

            // Add the new account.
            this.state.activeWallet.accounts.push(data);

            this.state.activeWallet.activeAccountIndex = (this.state.activeWallet.accounts.length - 1);

            if (this.state.activeAccount?.network === NETWORK_IDENTITY) {
                // Generate DID Document for the identity and persist it.
                await this.createIdentityDocument();

                // TODO: Perform blockchain / vault data query and recovery.
                // If there are transactions, DID Documents, NFTs or anythign else, we should launch the
                // query probe here.

                await this.state.saveStore(this.state.store);
            }

            await this.state.save();

            this.refreshState();

            this.communication.sendToAll('account-created');

            this.communication.sendToAll('identity-created');
        });

        this.communication.listen('identity-update', async (port: any, data: Identity) => {

            console.log('CHECK THIS 0:');
            console.log(JSON.stringify(data));

            await this.updateIdentityDocument(data);

            await this.state.saveStore(this.state.store);

            console.log('CHECK THIS 2:');
            console.log(JSON.stringify(this.state.store.identities));

            await this.state.save();

            this.refreshState();

            this.communication.sendToAll('identity-updated', data);

            // if (!this.state.activeWallet) {
            //     return;
            // }

            // // Add the new account.
            // this.state.activeWallet.accounts.push(data);

            // this.state.activeWallet.activeAccountIndex = (this.state.activeWallet.accounts.length - 1);

            // if (this.state.activeAccount?.network === NETWORK_IDENTITY) {
            //     // Generate DID Document for the identity and persist it.
            //     this.createIdentityDocument();

            //     // TODO: Perform blockchain / vault data query and recovery.
            //     // If there are transactions, DID Documents, NFTs or anythign else, we should launch the
            //     // query probe here.


            // }
        });

        this.communication.listen('identity-publish', async (port: any, data: Identity) => {
            await this.sync.saveIdentity(data);

            // await this.updateIdentityDocument(data);

            // Perhaps set this when successful callback from Vault?
            data.published = true;

            var existingIndex = this.state.store.identities.findIndex(i => i.id == data.id);
            this.state.store.identities[existingIndex] = data;

            await this.state.saveStore(this.state.store);

            this.refreshState();

            this.communication.sendToAll('identity-published', data);


            // Begin verification


        });

        this.communication.listen('set-active-account', async (port: any, data: { index: number }) => {
            if (!this.state.activeWallet) {
                console.log('No active wallet on set-active-account.');
                return;
            }

            this.state.activeWallet.activeAccountIndex = data.index;

            await this.state.save();

            this.refreshState();

            this.communication.sendToAll('active-account-changed', { index: data.index });
        });

        this.communication.listen('wallet-create', async (port: any, data: Wallet) => {
            // Add the new wallet.
            // TODO: Do we first want to validate if the wallet is not already added with same ID?
            // If so... we must ensure that mnemonics are not different, or a call might wipe existing wallet.
            this.state.persisted.wallets.push(data);

            // Change the active wallet to the new one.
            this.state.persisted.activeWalletId = data.id;

            if (this.state.activeAccount?.network === NETWORK_IDENTITY) {
                // Generate DID Document for the identity and persist it.
                this.createIdentityDocument();
                await this.state.saveStore(this.state.store);
            }

            // Persist the state.
            await this.state.save();

            this.refreshState();

            // Make sure we inform all instances when a wallet is deleted.
            this.communication.sendToAll('wallet-created');

            // this.communication.sendToAll('account-created');

            this.communication.sendToAll('identity-created');

            // TODO: Perform blockchain / vault data query and recovery.
            // If there are transactions, DID Documents, NFTs or anythign else, we should launch the
            // query probe here.
        });

        this.communication.listen('wallet-delete', async (port: any, data: any) => {
            const walletId = data.id;

            // Remove the wallet.
            this.state.persisted.wallets.splice(this.state.persisted.wallets.findIndex(w => w.id == walletId), 1);

            // Remove the password, if wallet was unlocked.
            this.state.passwords.delete(walletId);

            if (!this.state.hasWallets) {
                this.state.persisted.activeWalletId = null;
            } else {
                // Select the first key as active wallet.
                this.state.persisted.activeWalletId = this.state.persisted.wallets[0].id;
                // const keys = Array.from(this.state.persisted.wallets.keys());
                // this.state.persisted.activeWalletId = keys[0];
            }

            await this.state.save();

            // Make sure we inform all instances when a wallet is deleted.
            this.communication.sendToAll('wallet-deleted');

            this.refreshState();
        });
    }
}
