import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { UIState } from '../../services';

@Component({
  selector: 'app-contacts-create',
  templateUrl: './create.component.html',
  styleUrls: ['../contacts.component.css'],
})
export class ContactsCreateComponent implements OnInit {
  public contacts: any;
  public form: FormGroup;

  constructor(private uiState: UIState, private fb: FormBuilder) {
    this.uiState.title = 'Create contact';
    this.uiState.showBackButton = true;
    this.uiState.goBackHome = false;

    this.form = fb.group({
      name: new FormControl('', [Validators.required, Validators.minLength(6)]),
      email: new FormControl('', []),
      address: new FormControl('', []),
      amountInput: new FormControl('', [Validators.required, Validators.min(0), Validators.pattern(/^-?(0|[0-9]+[.]?[0-9]*)?$/)]),
    });
  }

  async ngOnInit(): Promise<void> {
    // this.contacts = [{ name: 'John Doe' }];
  }
}
