import { Component, OnInit, OnDestroy } from '@angular/core';
import { UIState } from '../../services';
import { ActionService } from 'src/app/services/action.service';

@Component({
  selector: 'app-did-request',
  templateUrl: './did-request.component.html',
  styleUrls: ['./did-request.component.css'],
})
export class ActionDidRequestComponent implements OnInit, OnDestroy {
  content: string;

  constructor(public uiState: UIState, public actionService: ActionService) {
    // The content that is prepared for signing is normally an object, to render
    // this to the user, we'd want to make it a nice string if it's not an string.
    if (typeof this.uiState.action.content !== 'string') {
      this.content = JSON.stringify(this.uiState.action.content, null, 2);
    } else {
      this.content = this.uiState.action.content;
    }

    const param = this.uiState.action.params[0];

    this.actionService.status.title = 'Share your DID';
    this.actionService.status.description = `Reason: "${param.reason}"`;

    this.actionService.ephemeral = true;
    this.actionService.accountFilter = { types: ['identity'], symbol: param.methods };
  }

  ngOnDestroy(): void {}

  ngOnInit(): void {}
}
