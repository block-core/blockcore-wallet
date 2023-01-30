import { Component, OnInit, OnDestroy } from '@angular/core';
import { UIState } from '../../services';
import { ActionService } from 'src/app/services/action.service';

@Component({
  selector: 'app-wallet.unlock',
  templateUrl: './wallet.unlock.component.html',
  styleUrls: ['./wallet.unlock.component.css'],
})
export class ActionWalletUnlockComponent implements OnInit, OnDestroy {
  content: string;

  constructor(public uiState: UIState, public actionService: ActionService) {
    this.actionService.consentType = 'regular';
  }

  ngOnDestroy(): void {}

  ngOnInit(): void {
    // Close the window as soon as loaded, it means the user have unlocked the wallet and we can continue.
    window.close();
  }
}
