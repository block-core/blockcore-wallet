import { sha512 } from '@noble/hashes/sha512';
import { bytesToHex } from '@noble/hashes/utils';
import { HDKey } from '@scure/bip32';
import {
  ContentDocument, getReducedKey, HDKey as Nip76HDKey, HDKIndex, HDKIndexDTO, HDKIndexType, nip19Extension,
  NostrEventDocument, SequentialKeysetDTO, Versions, Nip76ProviderIndexArgs, walletRsvpDocumentsOffset
} from 'animiq-nip76-tools';
import { getPublicKey } from 'nostr-tools';
import { BackgroundManager } from '../background-manager';
import { SigningUtilities } from '../identity/signing-utilities';
import { ActionPrepareResult, ActionResponse, Permission } from '../interfaces';
import { ActionHandler, ActionState } from './action-handler';

export const nostrPrivateChannelAccountName = 'Nostr Private Channels';

export class NostrNip76WalletHandler implements ActionHandler {
  action = ['nostr.nip76.index'];
  utility = new SigningUtilities();

  constructor(private backgroundManager: BackgroundManager) { }

  async prepare(state: ActionState): Promise<ActionPrepareResult> {
    return {
      content: [],
      consent: true,
    };
  }

  async getKey(permission: Permission, keyId: string): Promise<HDKey> {
    const { network, node } = await this.backgroundManager.getKey(permission.walletId, permission.accountId, keyId);
    return node as HDKey;
  }

  async getRootKeyInfo(permission: Permission, keyPage = 0)
    : Promise<{ rootKey: Nip76HDKey, wordset: Uint32Array, documentsIndex: HDKIndex }> {

    const key0 = await this.getKey(permission, `1776'/0'`);
    const rootKey = new Nip76HDKey({ privateKey: key0.privateKey, chainCode: key0.chainCode, version: Versions.nip76API1 });

    const wordsetKey = await this.getKey(permission, `1776'/1'`);
    const wordsetHash = sha512(wordsetKey.privateKey);
    const wordset = new Uint32Array((wordsetHash).buffer);

    const key1 = getReducedKey({ root: rootKey, wordset: wordset.slice(0, 4) });
    const key2 = getReducedKey({ root: rootKey, wordset: wordset.slice(4, 8) });
    const documentsIndex = new HDKIndex(HDKIndexType.Sequential | HDKIndexType.Private, key1, key2, wordset.slice(8));

    documentsIndex.getSequentialKeyset(0, keyPage);
    documentsIndex.getSequentialKeyset(walletRsvpDocumentsOffset, keyPage);

    return { rootKey, wordset, documentsIndex };
  }

  async execute(state: ActionState, permission: Permission): Promise<ActionResponse> {
    const profileKey = await this.getKey(permission, permission.keyId);
    const key = getPublicKey(profileKey.privateKey as any);

    switch (state.message.request.method) {
      case 'nostr.nip76.index': {
        const indexArgs: Nip76ProviderIndexArgs = state.message.request.params[1];
        const { rootKey, wordset, documentsIndex } = await this.getRootKeyInfo(permission, indexArgs.keyPage);
        if (indexArgs.privateIndexId === null) {
          documentsIndex.signingParent.wipePrivateData();
          documentsIndex.encryptParent.wipePrivateData();
          const response = { hdkIndex: documentsIndex.toJSON() };
          return { key, response };
        } else {
          const keyset = documentsIndex.getDocumentKeyset(indexArgs.privateIndexId, bytesToHex(profileKey.privateKey));
          const hdkIndex = new HDKIndex(HDKIndexType.Sequential | HDKIndexType.Private, keyset.signingKey, keyset.encryptKey);
          hdkIndex.getSequentialKeyset(0, indexArgs.keyPage);
          hdkIndex.signingParent.wipePrivateData();
          hdkIndex.encryptParent.wipePrivateData();
          const response = { hdkIndex: hdkIndex.toJSON() };
          return { key, response };
        }
      }
      case 'nostr.nip76.event.create': {
        const serializedContent = state.message.request.params[2];
        const kind = parseInt(serializedContent.match(/\d+/)![0]);
        const doc = HDKIndex.getContentDocument(kind);
        doc.deserialize(serializedContent);
        doc.content.pubkey = key;
        doc.docIndex = state.message.request.params[3];

        let hdkIndex: HDKIndex;
        const indexArgs: Nip76ProviderIndexArgs = state.message.request.params[1];
        if (indexArgs.publicIndex) {
          hdkIndex = HDKIndex.fromJSON(indexArgs.publicIndex as HDKIndexDTO);
        } else {
          const { rootKey, wordset, documentsIndex } = await this.getRootKeyInfo(permission);
          if (indexArgs.privateIndexId === null) {
            hdkIndex = documentsIndex;
          } else {
            const keyset = documentsIndex.getDocumentKeyset(indexArgs.privateIndexId, bytesToHex(profileKey.privateKey));
            hdkIndex = new HDKIndex(HDKIndexType.Sequential | HDKIndexType.Private, keyset.signingKey, keyset.encryptKey);
          }
        }
        const event = await hdkIndex.createEvent(doc, bytesToHex(profileKey.privateKey));
        const response = { event };
        return { key, response };
      }
      case 'nostr.nip76.event.delete': {
        const doc = new ContentDocument();
        doc.nostrEvent = { id: state.message.request.params[2] } as NostrEventDocument;
        doc.docIndex = state.message.request.params[3];

        let hdkIndex: HDKIndex;
        const indexArgs: Nip76ProviderIndexArgs = state.message.request.params[1];
        if (indexArgs.publicIndex) {
          hdkIndex = HDKIndex.fromJSON(indexArgs.publicIndex as HDKIndexDTO);
        } else {
          const { rootKey, wordset, documentsIndex } = await this.getRootKeyInfo(permission);
          if (indexArgs.privateIndexId === null) {
            hdkIndex = documentsIndex;
          } else {
            const keyset = documentsIndex.getDocumentKeyset(indexArgs.privateIndexId, bytesToHex(profileKey.privateKey));
            hdkIndex = new HDKIndex(HDKIndexType.Sequential | HDKIndexType.Private, keyset.signingKey, keyset.encryptKey);
          }
        }
        const event = await hdkIndex.createDeleteEvent(doc, bytesToHex(profileKey.privateKey));
        const response = { event };
        return { key, response };
      }
      case 'nostr.nip76.invite.read': {
        const channelPointer = state.message.request.params[0];
        const p = await nip19Extension.decode(channelPointer, bytesToHex(profileKey.privateKey));
        const pointer = nip19Extension.pointerToDTO(p.data as nip19Extension.PrivateChannelPointer);
        const response = { pointer };
        return { key, response };
      }
      case 'nostr.nip76.invite.create': {
        const pointer: nip19Extension.PrivateChannelPointerDTO = state.message.request.params[0];
        const forPubkey: string = state.message.request.params[1];
        const channelPointer = nip19Extension.pointerFromDTO(pointer);
        const invitation = await nip19Extension.nprivateChannelEncode(channelPointer, bytesToHex(profileKey.privateKey), forPubkey);
        const response = { invitation };
        return { key, response };
      }
      default:
        throw new Error(`method '${state.message.request.method}' not recognized.`);
    };
  }
}
