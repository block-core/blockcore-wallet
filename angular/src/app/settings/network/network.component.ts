import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { NetworkStatus, NetworkStatusEntry } from 'src/shared';
import { StateStore } from 'src/shared/store/state-store';
import { UIState, FeatureService, NetworkStatusService } from '../../services';

@Component({
  selector: 'app-network',
  templateUrl: './network.component.html',
  styleUrls: ['./network.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class NetworkComponent implements OnDestroy, OnInit {
  networks: NetworkStatusEntry[];

  constructor(public uiState: UIState, public location: Location, private stateStore: StateStore, public networkStatus: NetworkStatusService, public feature: FeatureService) {
    this.uiState.title = 'Network Status';
    this.uiState.showBackButton = true;
    this.uiState.goBackHome = false;
  }

  async ngOnInit() {
    // Make sure we load latest state store, which has information about which indexer is currently selected.
    await this.stateStore.load();

    this.networks = this.networkStatus.getActive();

    console.log('stateStore:', this.stateStore.get());
  }

  ngOnDestroy() {}

  cancel() {
    this.location.back();
  }

  updatedSelectedNetwork() {
    console.log('Networks:', this.networks);
  }
}
