import { Component, OnInit, OnDestroy } from '@angular/core';
import { UIState } from '../../services';
import { ActionService } from 'src/app/services/action.service';

@Component({
  selector: 'app-nostr-decrypt',
  templateUrl: './nostr.decrypt.component.html',
  styleUrls: ['./nostr.decrypt.component.css'],
})
export class ActionNostrDecryptComponent implements OnInit, OnDestroy {
  content: string;

  constructor(public uiState: UIState, public actionService: ActionService) {
    this.actionService.consentType = 'regular';

    this.actionService.status.icon = 'security';
    this.actionService.status.title = 'Decrypt data';
    this.actionService.status.description = `App wants you to perform decryption on the following text`;
  }

  ngOnDestroy(): void {}

  ngOnInit(): void {
    const cont = this.uiState.action.content as any;
    this.content = cont.ciphertext;
  }
}
