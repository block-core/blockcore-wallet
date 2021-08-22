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
import { keyUtils, Secp256k1KeyPair } from '@transmute/did-key-secp256k1';
import { BlockcoreIdentity } from '@blockcore/identity';
import { Issuer } from 'did-jwt-vc';
const axios = require('axios');

/** Responsible for syncing data between the extension and vault instances. */
export class DataSyncService {
    private communication!: CommunicationBackgroundService;
    private state!: AppState;
    private crypto!: CryptoUtility;
    timer: any;

    // The Blockcore Vault instances operate on a log of operations, this DataSyncService must be 
    // refactored to perform similar logic. If the user edits an identity twice while being offline 
    // then we must be sure of syncing the first edit first in a queue when user come back online.

    configure(
        communication: CommunicationBackgroundService,
        state: AppState,
        crypto: CryptoUtility) {
        this.communication = communication;
        this.state = state;
        this.crypto = crypto;
    }

    /** Will attempt to create or update an identity. */
    async saveIdentity(data: Identity) {
        debugger;
        // TODO: Further improve the logic of the identity saving.

        // If we have invalid sequence number for the update operation, we'll
        // not be able to update. So the question is if we should simply get 
        // latest DID Document, update the sequence and replace without informing
        // the user, or should we give user option to resolve conflict so they 
        // don't potentially overwrite previous information?
        // Initial version will simply attempt to create or update once.

        // Get the signed JWS payload, we must combine the fields so we include the signature:
        var jws = data.didPayload?.data + '.' + data.didPayload?.signature;

        var keyPair = await this.getIdentityKeyPair();

        var identity = await this.getIdentity(keyPair);

        var operationPayload;

        // If there are no did resolution available for this identity, it means 
        // it has never been published.
        if (!data.didResolution) {

            var operationPayloadCreate = await identity.generateOperation('identity', 'create', 0, jws);
            operationPayload = await this.signDocument(identity, keyPair, operationPayloadCreate);

        } else {
            var sequence = (data.didResolution.didResolutionMetadata.sequence + 1);
            var operationPayloadCreate = await identity.generateOperation('identity', 'replace', sequence, jws);
            operationPayload = await this.signDocument(identity, keyPair, operationPayloadCreate);
        }

        const operationUrl = this.state.persisted.settings.dataVault + '/operation';

        const operationJson = {
            "jwt": operationPayload
        }

        try {
            var content = await axios.post(operationUrl, operationJson);
            console.log('RESULT FROM OPERATION POST:');
            console.log(content);
        } catch (error) {
            console.error(error);
        }

        // const rawResponse = await fetch(operationUrl, {
        //     method: 'POST',
        //     headers: {
        //         'Accept': 'application/json',
        //         'Content-Type': 'application/json'
        //     },
        //     body: JSON.stringify(operationJson)
        // });

        // const content = await rawResponse.json();
        // console.log('RESULT FROM OPERATION POST:');
        // console.log(content);
    }

    async getIdentityKeyPair(): Promise<Secp256k1KeyPair> {
        var account = this.state.activeAccount;
        var wallet = this.state.activeWallet;

        if (!account || !wallet) {
            throw Error('No active wallet/account.');
        }

        // TODO: MUST VERIFY THAT ACCOUNT RESTORE AND NODES IS ALL CORRECT BELOW.
        var masterSeed = await bip39.mnemonicToSeed(wallet.mnemonic, '');
        const masterNode = bip32.fromSeed(masterSeed, this.crypto.getProfileNetwork());

        // Get the hardened purpose and account node.
        const accountNode = masterNode.derivePath(account.derivationPath); // m/302'/616'

        // const address0 = this.crypto.getAddress(accountNode);
        var keyPair = await this.crypto.getKeyPairFromNode(accountNode);

        return keyPair;
    }

    async getIdentity(keyPair: Secp256k1KeyPair): Promise<BlockcoreIdentity> {
        // Get the identity corresponding with the key pair, does not contain the private key any longer.
        var identity = this.crypto.getIdentity(keyPair);
        return identity;
    }

    async getIssuer(identity: BlockcoreIdentity, keyPair: Secp256k1KeyPair) {
        // Create an issuer from the identity, this is used to issue VCs.
        const issuer = identity.issuer({ privateKey: keyPair.privateKeyBuffer?.toString('hex') });
        return issuer;
    }

    async signDocument(identity: BlockcoreIdentity, keyPair: Secp256k1KeyPair, document: any) {
        const jws = await identity.jws({
            payload: document,
            privateKey: keyPair.privateKeyBuffer?.toString('hex')
        });

        return jws;
    }
}
