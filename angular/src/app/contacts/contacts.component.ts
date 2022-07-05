import { Component, OnInit } from '@angular/core';
import { UIState } from '../services';

@Component({
  selector: 'app-contacts',
  templateUrl: './contacts.component.html',
})
export class ContactsComponent implements OnInit {
  public contacts: any;

  constructor(private uiState: UIState) {
    this.uiState.title = 'Address Book';
    this.uiState.showBackButton = true;
    this.uiState.goBackHome = true;
  }

  async ngOnInit(): Promise<void> {
    // this.contacts = [{ name: 'John Doe' }];
  }
}
