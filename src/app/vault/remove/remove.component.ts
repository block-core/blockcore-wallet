import { Component, Inject, HostBinding } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common'
import { UIState } from 'src/app/services/ui-state.service';
import { OrchestratorService } from 'src/app/services/orchestrator.service';

@Component({
  selector: 'app-vault-remove',
  templateUrl: './remove.component.html',
  styleUrls: ['../vault.component.css']
})
export class VaultRemoveComponent {
  constructor(
    private router: Router,
    private location: Location,
    private manager: OrchestratorService,
    public uiState: UIState,
    private activatedRoute: ActivatedRoute,
  ) {
    this.uiState.title = 'Remove Account';

    this.activatedRoute.paramMap.subscribe(async params => {

      console.log('PARAMS:', params);
      const accountId: any = params.get('index');
      console.log('Account identifier:', accountId);

      const accountCount = this.uiState.activeWallet?.accounts?.length;

      if (this.uiState.activeWallet) {
        // Check if the index is available before allowing to change.
        if (accountId && accountCount != null) {
          this.uiState.activeWallet.activeAccountId = accountId;
        }
        else {
          console.log('Attempting to show account that does not exists.');
          this.router.navigateByUrl('/account');
        }
      }
      else {
        console.log('Attempting to show account when no wallet is selected.');
        this.router.navigateByUrl('/');
      }
    });
  }

  async wipe() {
    if (!this.uiState.activeWallet) {
      return;
    }

    var activeWallet = this.uiState.activeWallet;

    this.manager.removeAccount(activeWallet.id, activeWallet.activeAccountId);
  }

  cancel() {
    this.location.back();
  }
}
