import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AddressValidationService } from 'src/app/services/address-validation.service';
import { Contact } from 'src/shared';
import { Network } from 'src/shared/networks';
import { ContactStore } from 'src/shared/store/contacts-store';
import { NetworksService, UIState } from '../../services';
const { v4: uuidv4 } = require('uuid');

@Component({
  selector: 'app-contacts-create',
  templateUrl: './create.component.html',
  styleUrls: ['../contacts.component.css'],
})
export class ContactsCreateComponent implements OnInit {
  public form;
  selectedNetwork: Network;
  network = '';

  constructor(private addressValidation: AddressValidationService, private router: Router, private uiState: UIState, public networkService: NetworksService, private fb: FormBuilder, private contactStore: ContactStore) {
    this.uiState.title = 'Create contact';
    this.uiState.showBackButton = true;
    this.uiState.goBackHome = false;

    this.form = fb.nonNullable.group({
      name: new FormControl('', [Validators.required]),
      email: new FormControl('', []),
      address: new FormControl('', [Validators.required]),
    });

    // Default to the first available network.
    this.network = this.networkService.networks[0].id;
    this.onNetworkChanged();
  }

  updateNetwork() {
    const result = this.addressValidation.validate(this.form.controls.address.value);

    if (result.valid) {
      this.network = result.networks[0].id;
    }
  }

  onNetworkChanged() {
    this.selectedNetwork = this.networkService.getNetwork(this.network);
  }

  async ngOnInit(): Promise<void> {}

  async save() {
    const contact: Contact = {
      id: uuidv4(),
      name: this.form.controls.name.value,
      network: this.network,
      email: this.form.controls.email.value,
      address: this.form.controls.address.value,
    };

    this.contactStore.set(contact.id, contact);
    await this.contactStore.save();
    this.router.navigateByUrl('/contacts');
  }

  async paste() {
    try {
      const options: any = { name: 'clipboard-read' };
      const permission = await navigator.permissions.query(options);

      if (permission.state === 'denied') {
        throw new Error('Not allowed to read clipboard.');
      }

      const clipboardContents = await navigator.clipboard.readText();

      if (clipboardContents) {
        this.form.controls.address.setValue(clipboardContents);
        this.updateNetwork();
      }
    } catch (error) {
      console.error(error);
    }
  }
}
