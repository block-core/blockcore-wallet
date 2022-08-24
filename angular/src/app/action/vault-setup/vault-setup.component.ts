import { Component, OnInit, OnDestroy } from '@angular/core';
import { UIState } from '../../services';
import { ActionService } from 'src/app/services/action.service';

@Component({
  selector: 'app-vault-setup',
  templateUrl: './vault-setup.component.html',
  styleUrls: ['./vault-setup.component.css'],
})
export class ActionVaultSetupComponent implements OnInit, OnDestroy {
  constructor(public uiState: UIState, public action: ActionService) {

  }

  ngOnDestroy(): void {
    
  }

  ngOnInit(): void {}
}
