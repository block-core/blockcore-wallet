import { Contact } from '..';
import { StoreListBase } from './store-base';

export class ContactStore extends StoreListBase<Contact> {
  constructor() {
    super('contact');
  }
}
