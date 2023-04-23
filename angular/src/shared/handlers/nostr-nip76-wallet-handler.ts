import { BackgroundManager } from '../background-manager';
import { Account, ActionPrepareResult, ActionResponse, Permission, Wallet } from '../interfaces';
import { ActionHandler, ActionState } from './action-handler';
import { validateEvent, signEvent, getEventHash, Event, getPublicKey } from 'nostr-tools';
import { SigningUtilities } from '../identity/signing-utilities';
import { sha512 } from '@noble/hashes/sha512';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { HDKey } from '@scure/bip32';
import { ContentDocument, ContentTemplate, HDKIndex, HDKey as Nip76HDKey, Versions, NostrEventDocument, nip19Extension } from 'animiq-nip76-tools';

export const nostrPrivateChannelAccountName = 'Nostr Private Channels';

export class NostrNip76WalletHandler implements ActionHandler {
  action = ['nostr.nip76.wallet'];
  utility = new SigningUtilities();

  constructor(private backgroundManager: BackgroundManager) { }

  async prepare(state: ActionState): Promise<ActionPrepareResult> {
    return {
      content: [],
      consent: true,
    };
  }

  async execute(state: ActionState, permission: Permission): Promise<ActionResponse> {
    const profileKey = await this.getKey(permission, permission.keyId);
    const key = getPublicKey(profileKey.privateKey as any);

    switch (state.message.request.method) {
      case 'nostr.nip76.wallet': {
        const key0 = await this.getKey(permission, `1776'/0'`);
        const rootKey = new Nip76HDKey({ privateKey: key0.privateKey, chainCode: key0.chainCode, version: Versions.nip76API1 });
        const key1 = await this.getKey(permission, `1776'/1'`);
        const wordsetKey = new Nip76HDKey({ privateKey: key1.privateKey, chainCode: key1.chainCode, version: Versions.nip76API1 });
        const wordsetHash = sha512(wordsetKey.privateKey);
        const wordset = new Uint32Array((wordsetHash).buffer);
        const response = { key, rootKey, wordset };
        return { key, response };
      }
      case 'nostr.nip76.event.create': {
        const hdkIndex = HDKIndex.fromJSON(state.message.request.params[0]);
        const serializedContent = state.message.request.params[1];
        const kind = parseInt(serializedContent.match(/\d+/)![0]);
        const doc = HDKIndex.getContentClass(kind);
        doc.deserialize(serializedContent);
        doc.content.pubkey = key;
        doc.docIndex = state.message.request.params[2];
        const event = await hdkIndex.createEvent(doc, bytesToHex(profileKey.privateKey));
        const response = { key, event };
        return { key, response };
      }
      case 'nostr.nip76.event.delete': {
        const hdkIndex = HDKIndex.fromJSON(state.message.request.params[0]);
        const doc = new ContentDocument();
        doc.nostrEvent = { id: state.message.request.params[1] } as NostrEventDocument;
        doc.docIndex = state.message.request.params[2];
        const event = await hdkIndex.createDeleteEvent(doc, bytesToHex(profileKey.privateKey));
        const response = { key, event };
        return { key, response };
      }
      case 'nostr.nip76.invite.read': {
        const channelPointer = state.message.request.params[0];
        const p = await nip19Extension.decode(channelPointer, bytesToHex(profileKey.privateKey));
        const pointer = nip19Extension.pointerToDTO(p.data as nip19Extension.PrivateChannelPointer);
        const response = { key, pointer };
        return { key, response };
      }
      case 'nostr.nip76.invite.create': {
        const pointer: nip19Extension.PrivateChannelPointerDTO = state.message.request.params[0];
        const forPubkey: string = state.message.request.params[1];
        const channelPointer = nip19Extension.pointerFromDTO(pointer);
        const invitation = await nip19Extension.nprivateChannelEncode(channelPointer, bytesToHex(profileKey.privateKey), forPubkey);
        const response = { key, invitation };
        return { key, response };
      }
      default:
        throw new Error(`method '${state.message.request.method}' not recognized.`);
    };
  }

  async getKey(permission: Permission, keyId: string) {
    const { network, node } = await this.backgroundManager.getKey(permission.walletId, permission.accountId, keyId);
    return node as HDKey;
  }
}
