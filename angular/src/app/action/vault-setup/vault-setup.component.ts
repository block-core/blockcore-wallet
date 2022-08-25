import { Component, OnInit, OnDestroy } from '@angular/core';
import { UIState } from '../../services';
import { ActionService } from 'src/app/services/action.service';

@Component({
  selector: 'app-vault-setup',
  templateUrl: './vault-setup.component.html',
  styleUrls: ['./vault-setup.component.css'],
})
export class ActionVaultSetupComponent implements OnInit, OnDestroy {
  contentToSign: string;

  constructor(public uiState: UIState, public action: ActionService) {
    console.log('UIACTION:', uiState);
  }

  ngOnDestroy(): void {}

  ngOnInit(): void {
    this.contentToSign = JSON.stringify(this.uiState.action.content, null, 2);

    // const parsedContent = JSON.parse(this.uiState.action.args);
    // const firstArgument = parsedContent[0];
    // // Override the content
    // // this.action.content =
    // console.log('parsedContent:', firstArgument.domain);
    // let setupDocument = this.generateDIDDocument(firstArgument.domain);
    // // Content will be overridden by the handler after user closes window.
    // this.action.content = JSON.stringify(setupDocument, null, 2);
    // // Therefore we must make sure the updated content for signing is setup as args.
    // this.action.args = [this.action.content];
    // this.action.content = JSON.stringify(setupDocument);
  }
}
