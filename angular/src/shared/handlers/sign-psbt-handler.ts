import { BackgroundManager } from '../background-manager';
import { ActionPrepareResult, ActionResponse, Permission } from '../interfaces';
import { ActionHandler, ActionState } from './action-handler';
import { HDKey } from '@scure/bip32';
import { Network } from '../networks';
import { Psbt } from '@blockcore/blockcore-js';
import BIP32Factory from 'bip32';
import ecc from '@bitcoinerlab/secp256k1';
const Bip32 = BIP32Factory(ecc);
import { bip32 } from '../noble-ecc-wrapper';

// const testHDKey = "tprv8ZgxMBicQKsPf5D3jKXvvvsRi3RMZvE8g98752W3KeCUeggbyf8HQ3BJjppWRrHVPhkgKefZZD8x1jCQSHkoSLaagVNWPBfgTtJVhaRewR5";

export class SignPsbtHandler implements ActionHandler {
    action = ['signPsbt'];

    constructor(private backgroundManager: BackgroundManager) { }

    private hexToBase64(hex: string): string {
        const buffer = Buffer.from(hex, 'hex');
        return buffer.toString('base64');
    }

    async signPsbt(network: Network, content: string, xPrivKey: string): Promise<string> {
        // console.debug("PSBT Handler has been called");
        var hexPsbt = content;
        const psbtBase64 = this.hexToBase64(hexPsbt);
        // const network = {
        //     messagePrefix: "\u0018Bitcoin Signed Message:\n",
        //     bech32: "tb",
        //     bip32: {
        //         public: 70617039,
        //         private: 70615956,
        //     },
        //     pubKeyHash: 111,
        //     scriptHash: 196,
        //     wif: 239,
        // };
        const psbt = Psbt.fromBase64(psbtBase64, {
            network,
        });
        // console.log("psbt: ", psbt);
        const hdKeyPair = Bip32.fromBase58(xPrivKey, network);
        // console.log("HD key Pair: ", hdKeyPair);
        const SignedPsbt = psbt.signAllInputsHD(hdKeyPair);
        // console.log(SignedPsbt);

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
        const { node, network } = await this.backgroundManager.getKey(permission.walletId, permission.accountId, permission.keyId);
        // console.log("HD Key pair in Blockcore wallet: ", node);
        const masterSeedBase64 = await this.backgroundManager.getMasterSeedBase64(permission.walletId)
        const masterSeed = Buffer.from(masterSeedBase64, 'base64');
        const hdNode = bip32.fromSeed(masterSeed, network);
        const xPrivKey = hdNode.toBase58();

        if (state.content) {
            let contentText = state.content;

            if (typeof state.content !== 'string') {
                contentText = JSON.stringify(state.content);
            }

            let signedData = await this.signPsbt(network, contentText as string, xPrivKey);

            return { key: permission.key, walletId: permission.walletId, accountId: permission.accountId, response: { signature: signedData, content: state.content }, network: network.id };
        } else {
            return { key: '', response: null, network: network.id };
        }
    }
}
