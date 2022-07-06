import { Component, OnInit } from '@angular/core';
import { Contact } from 'src/shared';
import { ContactStore } from 'src/shared/store/contacts-store';
import { UIState } from '../services';

@Component({
  selector: 'app-contacts',
  templateUrl: './contacts.component.html',
})
export class ContactsComponent implements OnInit {
  public contacts: Contact[];

  constructor(private uiState: UIState, private contactStore: ContactStore) {
    this.uiState.title = 'Address Book';
    this.uiState.showBackButton = true;
    this.uiState.goBackHome = true;
  }

  async ngOnInit(): Promise<void> {
    this.contacts = this.contactStore.all();
  }
}
