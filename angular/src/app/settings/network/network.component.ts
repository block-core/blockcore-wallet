import { Location } from '@angular/common';
import { Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { NetworkStatus, NetworkStatusEntry } from 'src/shared';
import { UIState, FeatureService, NetworkStatusService } from '../../services';

@Component({
  selector: 'app-network',
  templateUrl: './network.component.html',
  styleUrls: ['./network.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class NetworkComponent implements OnDestroy {
  networks: NetworkStatusEntry[];

  constructor(public uiState: UIState, public location: Location, public networkStatus: NetworkStatusService, public feature: FeatureService) {
    this.uiState.title = 'Network Status';
    this.uiState.showBackButton = true;
    this.uiState.goBackHome = false;

    this.networks = networkStatus.getActive();
  }

  ngOnDestroy() {}

  cancel() {
    this.location.back();
  }

  select(network: NetworkStatus) {
    console.log('Activate: ', network);
  }
}
