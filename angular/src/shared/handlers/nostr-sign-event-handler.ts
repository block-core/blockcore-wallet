import { BackgroundManager } from '../background-manager';
import { ActionPrepareResult, ActionResponse, Permission } from '../interfaces';
import { ActionHandler, ActionState } from './action-handler';
import { Event } from '../interfaces/nostr';
import { validateEvent, signEvent, getEventHash, getPublicKey } from 'nostr-tools';
import { SigningUtilities } from '../identity/signing-utilities';

export class NostrSignEventHandler implements ActionHandler {
  action = ['nostr.signevent'];
  utility = new SigningUtilities();

  constructor(private backgroundManager: BackgroundManager) {}

  async prepare(state: ActionState): Promise<ActionPrepareResult> {
    console.log('NostrSignEventHandler: PREPARE!', state.message.request.params[0]);

    return {
      content: state.message.request.params[0],
      consent: true,
    };
  }

  async execute(state: ActionState, permission: Permission): Promise<ActionResponse> {
    // Get the private key
    const { network, node } = await this.backgroundManager.getKey(permission.walletId, permission.accountId, permission.keyId);
    const event = state.content as Event;

    if (!event.pubkey) event.pubkey = this.utility.getIdentifier(node.publicKey);
    if (!event.id) event.id = await getEventHash(event);
    if (!validateEvent(event)) throw new Error('Invalid Nostr event.');
    event.sig = await signEvent(event, this.utility.keyToHex(node.privateKey));

    // const valid = await secp.schnorr.verify(event.sig, event.id, event.pubkey);

    return {
      request: state.message.request,
      response: event,
    };
  }
}
