import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { copyToClipboard } from 'src/app/shared/utilities';
import { Contact } from 'src/shared';
import { Network } from 'src/shared/networks';
import { ContactStore } from 'src/shared/store/contacts-store';
import { NetworksService, UIState } from '../../services';

@Component({
  selector: 'app-contacts-view',
  templateUrl: './view.component.html',
  styleUrls: ['../contacts.component.css'],
})
export class ContactsViewComponent implements OnInit, OnDestroy {
  network: Network;
  public contact: Contact;
  subscriptions: Subscription[] = [];

  constructor(private snackBar: MatSnackBar, private activatedRoute: ActivatedRoute, private router: Router, private uiState: UIState, public networkService: NetworksService, private fb: FormBuilder, private contactStore: ContactStore) {
    this.uiState.showBackButton = true;
    this.uiState.goBackHome = false;

    this.subscriptions.push(
      this.activatedRoute.paramMap.subscribe(async (params) => {
        const accountId: any = params.get('id');
        this.contact = this.contactStore.get(accountId);
        this.uiState.title = this.contact.name;
        this.network = this.networkService.getNetwork(this.contact.network);
      })
    );
  }

  copy(content: string) {
    copyToClipboard(content);

    this.snackBar.open('Copied to clipboard', 'Hide', {
      duration: 1500,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });

    this.subscriptions = [];
  }

  async ngOnInit(): Promise<void> {}

  async remove() {
    this.contactStore.remove(this.contact.id);
    await this.contactStore.save();
    this.router.navigateByUrl('/contacts');
  }
}
