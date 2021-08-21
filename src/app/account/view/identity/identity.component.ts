import { Component, Inject, HostBinding, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CryptoService } from '../../../services/crypto.service';
import { UIState } from '../../../services/ui-state.service';
import { ActivatedRoute, Router } from '@angular/router';
import { OrchestratorService } from '../../../services/orchestrator.service';
import { CommunicationService } from '../../../services/communication.service';
import { Identity } from 'src/app/interfaces';

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
  previousIndex!: number;
  identity: Identity | undefined;
  encryptedDataVaultUrl = '';

  constructor(
    public uiState: UIState,
    private crypto: CryptoService,
    private router: Router,
    private manager: OrchestratorService,
    private communication: CommunicationService,
    private activatedRoute: ActivatedRoute,
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

      let service = this.identity?.services.find(s => s.type == 'EncryptedDataVault');

      if (service) {
        this.encryptedDataVaultUrl = service.serviceEndpoint;
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
  }

  save() {
    if (!this.identity) {
      return;
    }

    if (this.encryptedDataVaultUrl && this.encryptedDataVaultUrl.length > 0) {
      var edv = {
        id: this.identity.id + '#edv',
        type: 'EncryptedDataVault',
        serviceEndpoint: this.encryptedDataVaultUrl
      };

      // Attempt to find existing EncryptedDataVault service. We do not want to replace any third party
      // services the user might have added to their DID Document through other means.
      if (this.identity.services.length > 0) {
        var existingIndex = this.identity.services.findIndex(s => s.type == 'EncryptedDataVault');

        if (existingIndex > -1) {
          // Replace existing.
          this.identity.services.splice(existingIndex, 1);
          this.identity.services.push(edv);
          // this.identity.services[existingIndex] = edv;

        } else {
          this.identity.services.push(edv);
        }
      }
      else {
        this.identity.services = [edv];
      }

      console.log(this.identity);
      this.manager.updateIdentity(this.identity);
    }
  }

  publish() {

  }

  ngOnInit(): void {
    this.sub2 = this.communication.listen('identity-updated', () => {
      this.identity = this.uiState.store.identities.find(i => i.id == this.identity?.id);
    });

    this.sub = this.communication.listen('active-account-changed', (data: any) => {
      // If we are currently viewing an account and the user changes, we'll refresh this view.
      // if (this.previousIndex != data.index) {
      //   this.router.navigate(['account', 'view', data.index]);
      // }

      // console.log('PARAMS:', params);
      // const index: any = params.get('index');
      const index = data.index;

      console.log('Index to view:', index);

      if (!this.uiState.activeWallet) {
        return;
      }

      // this.manager.setActiveAccountId(index);
      this.uiState.title = 'Account: ' + this.uiState.activeAccount?.name;

      // this.uiState.persisted.activeAccountIndex = Number(index);

      // Persist when changing accounts.
      // this.uiState.save();

      this.previousIndex = index;

      var did = this.uiState.activeAccount?.identifier;
      this.identity = this.uiState.store.identities.find(i => i.id == did);

      let service = this.identity?.services.find(s => s.type == 'EncryptedDataVault');

      if (service) {
        this.encryptedDataVaultUrl = service.serviceEndpoint;
      }

    });
  }
}
