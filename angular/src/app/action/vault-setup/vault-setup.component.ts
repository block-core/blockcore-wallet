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

  ngOnInit(): void {

    const parsedContent = JSON.parse(this.uiState.action.args);
    const firstArgument = parsedContent[0];

    // Override the content
    // this.action.content = 

    console.log('parsedContent:', firstArgument.domain);

    let setupDocument = this.generateDIDDocument(firstArgument.domain);

    // Content will be overridden by the handler after user closes window.
    this.action.content = JSON.stringify(setupDocument, null, 2);

    // Therefore we must make sure the updated content for signing is setup as args.
    this.action.args = [this.action.content];

    // this.action.content = JSON.stringify(setupDocument);
  }

  generateDIDDocument(domain: string) {


    return this.document( { service: [{
      "id":"#dwn",
      "type": "DecentralizedWebNode",
      "serviceEndpoint": {
        "nodes": [domain]
      }
    }] });

    // const tools = new BlockcoreIdentityTools();
    // // const keyPair = tools.generateKeyPair();

    // const identityNode = this.identityService.getIdentityNode(this.walletManager.activeWallet, this.walletManager.activeAccount);
    // const privateKey = identityNode.privateKey;
    // const verificationMethod = tools.getVerificationMethod(privateKey);

    // console.log('verificationMethod:', verificationMethod);

    // const identity = new BlockcoreIdentity(verificationMethod);

    // const doc = identity.document();
    // console.log(JSON.stringify(doc));

    // copyToClipboard(JSON.stringify(doc));

    // this.snackBar.open('DID Document copied to clipboard', 'Hide', {
    //   duration: 2500,
    //   horizontalPosition: 'center',
    //   verticalPosition: 'bottom',
    // });

    // const document = await this.identityService.createIdentityDocument(privateKey);
    // console.log(JSON.stringify(document));
  }

  private ordered(a: any, b: any) {
    let comparison = 0;
    if (a.id > b.id) {
      comparison = 1;
    } else if (a.id < b.id) {
      comparison = -1;
    }
    return comparison;
  }

  public document(options: { service: [] } | any = null) {
    const data: any = {};
    // data['@context'] = ['https://www.w3.org/ns/did/v1'];  // We only implement application/did+json
    data.id = '';
    data.verificationMethod = [{
      id: '',
      type: '',
      controller: '',
      publicKeyBase58: ''
    }];

    if (options?.service) {
      data.service = options.service.sort(this.ordered);
    }

    // Get the unique ID of the verification method, this might have extra data to make it unique in the list (#key-1).
    data.authentication = [data.verificationMethod.id];
    data.assertionMethod = [data.verificationMethod.id];

    return data;
  }
}
