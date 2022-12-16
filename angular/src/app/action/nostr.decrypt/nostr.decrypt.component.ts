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
  }

  ngOnDestroy(): void {}

  ngOnInit(): void {
    // The content that is prepared for signing is normally an object, to render
    // this to the user, we'd want to make it a nice string if it's not an string.
    if (typeof this.uiState.action.content !== 'string') {
      this.content = JSON.stringify(this.uiState.action.content, null, 2);
    } else {
      this.content = this.uiState.action.content;
    }
  }
}
