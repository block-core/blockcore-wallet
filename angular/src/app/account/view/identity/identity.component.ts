import { Component, Inject, HostBinding, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CryptoService } from '../../../services/crypto.service';
import { UIState } from '../../../services/ui-state.service';
import { ActivatedRoute, Router } from '@angular/router';
import { OrchestratorService } from '../../../services/orchestrator.service';
import { CommunicationService } from '../../../services/communication.service';
import { Identity } from 'src/app/interfaces';
import { copyToClipboard } from 'src/app/shared/utilities';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SettingsService } from '../../../services/settings.service';

@Component({
  selector: 'app-account-identity',
  templateUrl: './identity.component.html',
  styleUrls: ['./identity.component.css']
})
export class AccountIdentityComponent implements OnInit, OnDestroy {
  mnemonic = '';
  password = '';
  unlocked = '';
  unlockPassword = '';
  alarmName = 'refresh';
  wallet: any;
  account!: any;
  sub: any;
  sub2: any;
  sub3: any;
  sub4: any;
  previousIndex!: number;
  identity: Identity | undefined;
  verifiableDataRegistryUrl = '';
  profile = {
    name: '',
    email: '',
    website: ''
  };

  get identityUrl(): string {
    if (!this.identity?.published) {
      return '';
    }

    return this.settings.values.dataVault + '/identity/' + this.identity.id;
  }

  constructor(
    public uiState: UIState,
    private snackBar: MatSnackBar,
    private crypto: CryptoService,
    private router: Router,
    private manager: OrchestratorService,
    private communication: CommunicationService,
    private activatedRoute: ActivatedRoute,
    private settings: SettingsService,
    private cd: ChangeDetectorRef) {

    this.uiState.title = 'Account: ';
    this.uiState.showBackButton = true;

    if (!this.uiState.hasAccounts) {
      this.router.navigateByUrl('/account/create');
    }

    this.activatedRoute.paramMap.subscribe(async params => {
      // If we are currently viewing an account and the user changes, we'll refresh this view.
      // if (this.previousIndex != data.index) {
      //   this.router.navigate(['account', 'view', data.index]);
      // }

      // console.log('PARAMS:', params);
      // const index: any = params.get('index');
      // const index = data.index;

      // console.log('Index to view:', index);

      // if (!this.uiState.activeWallet) {
      //   return;
      // }

      // this.manager.setActiveAccountId(index);
      this.uiState.title = 'Account: ' + this.uiState.activeAccount?.name;

      // this.uiState.persisted.activeAccountIndex = Number(index);

      // Persist when changing accounts.
      // this.uiState.save();

      // this.previousIndex = index;

      var did = this.uiState.activeAccount?.identifier;
      this.identity = this.uiState.store.identities.find(i => i.id == did);

      let service = this.identity?.services.find(s => s.type == 'VerifiableDataRegistry');

      if (service) {
        this.verifiableDataRegistryUrl = service.serviceEndpoint;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.communication.unlisten(this.sub);
    }

    if (this.sub2) {
      this.communication.unlisten(this.sub2);
    }

    if (this.sub3) {
      this.communication.unlisten(this.sub3);
    }

    if (this.sub4) {
      this.communication.unlisten(this.sub4);
    }
  }

  save() {
    if (!this.identity) {
      return;
    }

    var vdr = null;

    if (this.verifiableDataRegistryUrl && this.verifiableDataRegistryUrl.length > 0) {
      vdr = {
        id: this.identity.id + '#vdr',
        type: 'VerifiableDataRegistry',
        serviceEndpoint: this.verifiableDataRegistryUrl
      };
    }

    if (this.verifiableDataRegistryUrl && this.verifiableDataRegistryUrl.length > 0) {

      // Attempt to find existing VerifiableDataRegistry service. We do not want to replace any third party
      // services the user might have added to their DID Document through other means.
      if (this.identity.services.length > 0) {
        var existingIndex = this.identity.services.findIndex(s => s.type == 'VerifiableDataRegistry');

        if (existingIndex > -1) {

          if (vdr) {
            // Replace existing.
            this.identity.services.splice(existingIndex, 1);
            this.identity.services.push(vdr);
            // this.identity.services[existingIndex] = vdr;
          } else {
            // Remove it if the user has emptied the input field.
            this.identity.services.splice(existingIndex, 1);
          }
        } else {
          if (vdr) {
            this.identity.services.push(vdr);
          }
        }
      }
      else {
        if (vdr) {
          this.identity.services = [vdr];
        }
      }
    } else {
      // If there is no URL, we'll reset the services list.
      this.identity.services = [];
    }

    console.log(this.identity);
    this.manager.updateIdentity(this.identity);
  }

  publish() {
    if (this.identity) {
      this.manager.publishIdentity(this.identity);
    }
  }

  copyDIDDocument() {
    copyToClipboard(JSON.stringify(this.identity?.didDocument));
  }

  copyProfileDocument() {
    copyToClipboard(JSON.stringify('Not implemented yet.'));
  }

  copyVaultConfiguration() {
    var domain = this.verifiableDataRegistryUrl;
    this.manager.generateVaultConfiguration(domain);
  }

  ngOnInit(): void {
    this.sub4 = this.communication.listen('identity-published', (data: Identity) => {

      this.identity = data;

      this.snackBar.open('Your identity has been published', 'Hide', {
        duration: 8000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
    });

    this.sub3 = this.communication.listen('vault-configuration', (data: any) => {
      const vaultConfiguration = {
        didConfiguration: data,
        didDocument: this.identity?.didDocument
      };

      copyToClipboard(JSON.stringify(vaultConfiguration));
    });

    this.sub2 = this.communication.listen('identity-updated', () => {
      this.identity = this.uiState.store.identities.find(i => i.id == this.identity?.id);
    });

    this.sub = this.communication.listen('active-account-changed', (data: { walletId: string, accountId: string }) => {
      // If we are currently viewing an account and the user changes, we'll refresh this view.
      // if (this.previousIndex != data.index) {
      //   this.router.navigate(['account', 'view', data.index]);
      // }

      // console.log('PARAMS:', params);
      // const index: any = params.get('index');
      // const index = data.index;
      // console.log('Index to view:', index);

      if (!this.uiState.activeWallet) {
        return;
      }

      // this.manager.setActiveAccountId(index);
      this.uiState.title = 'Account: ' + this.uiState.activeAccount?.name;

      // this.uiState.persisted.activeAccountIndex = Number(index);

      // Persist when changing accounts.
      // this.uiState.save();

      // this.previou1sIndex = index;

      var did = this.uiState.activeAccount?.identifier;
      this.identity = this.uiState.store.identities.find(i => i.id == did);

      // if (this.identity) {
      //   this.identity = { id }
      // }

      let service = this.identity?.services.find(s => s.type == 'VerifiableDataRegistry');

      if (service) {
        this.verifiableDataRegistryUrl = service.serviceEndpoint;
      } else {
        this.verifiableDataRegistryUrl = '';
      }

    });
  }
}
