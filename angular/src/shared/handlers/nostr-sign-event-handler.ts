import { BackgroundManager } from '../background-manager';
import { ActionPrepareResult, ActionResponse, Permission } from '../interfaces';
import { ActionHandler, ActionState } from './action-handler';
import { validateEvent, signEvent, getEventHash, Event } from 'nostr-tools';
import { SigningUtilities } from '../identity/signing-utilities';
import { NostrEvent } from '../interfaces/nostr';

export class NostrSignEventHandler implements ActionHandler {
  action = ['nostr.signevent'];
  utility = new SigningUtilities();

  constructor(private backgroundManager: BackgroundManager) {}

  async prepare(state: ActionState): Promise<ActionPrepareResult> {
    return {
      content: state.message.request.params[0],
      consent: true,
    };
  }

  async execute(state: ActionState, permission: Permission): Promise<ActionResponse> {
    // Get the private key
    const { network, node } = await this.backgroundManager.getKey(permission.walletId, permission.accountId, permission.keyId);

    // There are no proper
    const event = state.content as NostrEvent;

    //if (!event.pubkey) event.pubkey = this.utility.getIdentifier(node.publicKey);
    // Override the pubkey if provided, we use what the user selected.
    event.pubkey = this.utility.getIdentifier(node.publicKey);
    if (!event.id) event.id = await getEventHash(event);
    if (!validateEvent(event)) throw new Error('Invalid Nostr event.');

    // Out-of-sync type definitions require an any here. It does return string, even though type definition says otherwise.
    const signature = (await signEvent(event, this.utility.keyToHex(node.privateKey))) as any;
    event.sig = signature;

    return event;
  }
}
