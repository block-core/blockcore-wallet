import { BackgroundManager } from '../background-manager';
import { ActionMessage, ActionPrepareResult, ActionRequest, ActionResponse, Actions, Permission } from '../interfaces';
import { ActionHandler, ActionState } from './action-handler';
import * as bitcoinMessage from 'bitcoinjs-message';
import { HDKey } from '@scure/bip32';
import { Network } from '../networks';
import { Psbt } from '@blockcore/blockcore-js';
import * as bip32 from '@scure/bip32';
import BIP32Factory from 'bip32';
import ecc from '@bitcoinerlab/secp256k1';
const Bip32 = BIP32Factory(ecc);

const testHDKey = "tprv8ZgxMBicQKsPd9TeAdPADNnSyH9SSUUbTVeFszDE23Ki6TBB5nCefAdHkK8Fm3qMQR6sHwA56zqRmKmxnHk37JkiFzvncDqoKmPWubu7hDF";

export class SignPsbtHandler implements ActionHandler {
    action = ['signPsbt'];

    constructor(private backgroundManager: BackgroundManager) { }

    async signData(network: Network, node: HDKey, content: string): Promise<string> {
        // TODO: Investigate if Paul Miller or someone else implements an message signing library relying on noble packages.
        var signature = bitcoinMessage.sign(content, Buffer.from(node.privateKey), true, network.messagePrefix);
        console.log("HD KEY: ", node);
        return signature.toString('base64');
    }

    private hexToBase64(hex: string): string {
        const buffer = Buffer.from(hex, 'hex');
        return buffer.toString('base64');
    }

    async signPsbt(tnetwork: Network, node: HDKey, content: string): Promise<string> {
        // console.log("Yes bhai I am signing this PSBT");
        var hexPsbt = content;
        const psbtBase64 = this.hexToBase64(hexPsbt);
        const network = {
            messagePrefix: "\u0018Bitcoin Signed Message:\n",
            bech32: "tb",
            bip32: {
                public: 70617039,
                private: 70615956,
            },
            pubKeyHash: 111,
            scriptHash: 196,
            wif: 239,
        };
        const psbt = Psbt.fromBase64(psbtBase64, {
            network,
        });
        console.log("psbt: ", psbt);

        const hdKeyPair = Bip32.fromBase58(testHDKey, network);
        console.log("HD key Pair: ", hdKeyPair);


        const SignedPsbt = psbt.signAllInputsHD(hdKeyPair);

        console.log(SignedPsbt);

        return SignedPsbt.toBase64();
    }


    async prepare(state: ActionState): Promise<ActionPrepareResult> {
        if (!state.message || !state.message.request || !state.message.request.params || !state.message.request.params[0] || !state.message.request.params[0].message) {
            throw Error('The params must include a single entry that has a message field.');
        }

        return {
            content: state.message.request.params[0].message,
            consent: true,
        };
    }

    async execute(state: ActionState, permission: Permission): Promise<ActionResponse> {
        // Get the private key
        const { network, node } = await this.backgroundManager.getKey(permission.walletId, permission.accountId, permission.keyId);
        if (state.content) {
            let contentText = state.content;

            if (typeof state.content !== 'string') {
                contentText = JSON.stringify(state.content);
            }

            let signedData = await this.signPsbt(network, node, contentText as string);

            return { key: permission.key, walletId: permission.walletId, accountId: permission.accountId, response: { signature: signedData, content: state.content }, network: network.id };
        } else {
            return { key: '', response: null, network: network.id };
        }
    }
}
