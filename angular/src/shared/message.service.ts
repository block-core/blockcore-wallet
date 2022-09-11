import { ActionMessage, Message, MessageResponse } from './interfaces';
import { EventBus } from './event-bus';
import { RuntimeService } from './runtime.service';
const { v4: uuidv4 } = require('uuid');

export class MessageService {
  constructor(private runtime: RuntimeService, private events: EventBus) {}

  createMessage(type: string, data?: any, target: string = 'background'): Message {
    let key = uuidv4();

    return {
      id: key,
      type: type,
      data: data,
      ext: 'blockcore', //
      // ext: this.env.instance,
      source: 'tabs',
      target: target,
    };
  }

  createResponse(message: Message, data?: any): MessageResponse {
    const clonedMessage = { ...message };
    clonedMessage.data = data;

    return clonedMessage;
  }

  /** Send message, supports either extension or web modes. */
  send(message: Message | ActionMessage | any) {
    if (this.runtime.isExtension) {
      chrome.runtime.sendMessage(message);
    } else {
      this.events.publish(message.type, message);
    }
  }
}
