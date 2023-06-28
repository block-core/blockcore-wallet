import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UIState, NetworksService, NetworkStatusService, EnvironmentService, WalletManager, LoggerService } from '../../services';
import { copyToClipboard } from '../../shared/utilities';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import { Address, NetworkStatus, TransactionMetadata, TransactionMetadataEntry, TransactionView } from '../../../shared/interfaces';
import { Network } from '../../../shared/networks';
import { TransactionMetadataStore, TransactionStore } from 'src/shared';
import { RuntimeService } from 'src/shared/runtime.service';
import * as secp from '@noble/secp256k1';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';

@Component({
  selector: 'app-account-transaction',
  templateUrl: './transaction.component.html',
  styleUrls: ['./transaction.component.css'],
})
export class AccountTransactionComponent implements OnInit, OnDestroy {
  addressEntry: Address;
  address: string;
  qrCode: string;
  network: Network;
  public transaction: TransactionView;
  txid: string;
  currentNetworkStatus: NetworkStatus;
  metadata: TransactionMetadata;
  metadataEntry: TransactionMetadataEntry;
  form: UntypedFormGroup;

  constructor(
    public uiState: UIState,
    private renderer: Renderer2,
    private networks: NetworksService,
    private activatedRoute: ActivatedRoute,
    private env: EnvironmentService,
    private networkStatusService: NetworkStatusService,
    public walletManager: WalletManager,
    private transactionStore: TransactionStore,
    private transactionMetadataStore: TransactionMetadataStore,
    private logger: LoggerService,
    private snackBar: MatSnackBar,
    private runtime: RuntimeService,
    private fb: UntypedFormBuilder
  ) {
    this.uiState.goBackHome = false;
    this.uiState.backUrl = null;

    this.form = fb.group({
      memoInput: new UntypedFormControl(''),
    });

    const account = this.walletManager.activeAccount;
    this.network = this.networks.getNetwork(account.networkType);

    this.activatedRoute.paramMap.subscribe(async (params) => {
      this.txid = params.get('txid');
      // this.currentNetworkStatus = this.networkStatusService.get(this.walletManager.activeAccount.networkType);
      this.transaction = this.transactionStore.get(this.txid) as TransactionView;

      // Calculate values on the transaction object.
      this.transaction.details.inputsAmount = this.transaction.details.inputs.reduce((sum, item) => {
        sum += item.inputAmount;
        return sum;
      }, 0);

      this.transaction.details.outputsAmount = this.transaction.details.outputs.reduce((sum, item) => {
        sum += item.balance;
        return sum;
      }, 0);

      this.transaction.details.data = this.transaction.details.outputs.filter((i) => i.outputType == 'TX_NULL_DATA').map((i) => i.scriptPubKey);
      this.metadata = this.transactionMetadataStore.get(account.identifier);

      if (this.metadata) {
        const txmetadata = this.metadata.transactions.find((t) => t.transactionHash == this.txid);
        this.metadataEntry = txmetadata;

        if (txmetadata) {
          this.form.controls['memoInput'].setValue(txmetadata.memo);
        }
      }

      // console.log('outputs:', this.transaction.details.outputs);
      // console.log('data:', this.transaction.details.data);
      // this.logger.info('Transaction:', this.transaction);
    });
  }

  async saveMemo() {
    const memo = this.form.controls['memoInput'].value;

    if (!this.metadata) {
      const accountId = this.walletManager.activeAccount.identifier;

      this.metadata = {
        accountId: accountId,
        transactions: [
          {
            memo: memo,
            transactionHash: this.transaction.transactionHash,
          },
        ],
      };

      this.transactionMetadataStore.set(accountId, this.metadata);
    } else {
      if (!this.metadataEntry) {
        this.metadataEntry = {
          transactionHash: this.transaction.transactionHash,
          memo: memo,
        };

        this.metadata.transactions.push(this.metadataEntry);
      } else {
        this.metadataEntry.memo = memo;
      }
    }

    await this.transactionMetadataStore.save();

    this.form.markAsPristine();
  }

  openExplorer(txid: string) {
    if (!this.runtime.isExtension) {
      window.open(`${this.env.instanceExplorerUrl}/${this.network.id}/explorer/transaction/${txid}`, '_blank').focus();
    } else {
      chrome.tabs.create({ url: `${this.env.instanceExplorerUrl}/${this.network.id}/explorer/transaction/${txid}`, active: false });
    }
  }

  openExplorerBlock(blockhash: string) {
    if (blockhash) {
      if (!this.runtime.isExtension) {
        window.open(`${this.env.instanceExplorerUrl}/${this.network.id}/explorer/block/${blockhash}`, '_blank').focus();
      } else {
        chrome.tabs.create({ url: `${this.env.instanceExplorerUrl}/${this.network.id}/explorer/block/${blockhash}`, active: false });
      }
    } else {
      if (!this.runtime.isExtension) {
        window.open(`${this.env.instanceExplorerUrl}/${this.network.id}/explorer/block/${blockhash}`, '_blank').focus();
      } else {
        chrome.tabs.create({ url: `${this.env.instanceExplorerUrl}/${this.network.id}/explorer/block/${blockhash}`, active: false });
      }
    }
  }

  ngOnDestroy(): void {}

  /** Parse the hex formatted script. Ref: https://en.bitcoin.it/wiki/Script */
  parseOpreturn(data: any) {
    if (!data) {
      return null;
    }

    // First get the bytes from the complete hex value:
    const buff = secp.utils.hexToBytes(data);

    if (buff[0] != 106) {
      throw new Error('Not OP_RETURN.');
    }

    const opcode = buff[1];

    let skip = 2; // 1-75: The next opcode bytes is data to be pushed onto the stack

    if (opcode == 76) {
      // The next byte contains the number of bytes to be pushed onto the stack.
      skip = 3;
    } else if (opcode == 77) {
      // The next two bytes contain the number of bytes to be pushed onto the stack in little endian order.
      skip = 5;
    } else if (opcode == 78) {
      // The next four bytes contain the number of bytes to be pushed onto the stack in little endian order.
      skip = 6;
    }

    // Skip the prefix for OP_RETURN:
    const parsedBuff = buff.slice(skip, buff.length);

    if (parsedBuff.length == 0) {
      return null;
    }

    // First transform back to hex, but now only the payload data:
    const dataHex = secp.utils.bytesToHex(parsedBuff);

    return this.hexToUtf8(dataHex);
  }

  hexToUtf8(hex: any) {
    try {
      return decodeURIComponent('%' + hex.match(/.{1,2}/g).join('%'));
    } catch (err) {
      return hex;
    }
  }

  copy() {
    copyToClipboard(this.txid);

    this.snackBar.open('Transaction ID copied to clipboard', 'Hide', {
      duration: 1500,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  async ngOnInit() {}
}
