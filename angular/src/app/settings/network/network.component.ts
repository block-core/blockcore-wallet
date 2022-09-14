import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { EventBus, NetworkStatus, NetworkStatusEntry, NetworkStatusStore } from 'src/shared';
import { StateStore } from 'src/shared/store/state-store';
import { UIState, FeatureService, NetworkStatusService, StateService } from '../../services';

@Component({
  selector: 'app-network',
  templateUrl: './network.component.html',
  styleUrls: ['./network.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class NetworkComponent implements OnDestroy, OnInit {
  networks: NetworkStatusEntry[];
  sub: any;
  updating = false;

  constructor(private events: EventBus, public uiState: UIState, public location: Location, private stateService: StateService, private stateStore: StateStore, public networkStatus: NetworkStatusService, public feature: FeatureService) {
    this.uiState.title = 'Network Status';
    this.uiState.showBackButton = true;
    this.uiState.goBackHome = false;
  }

  async ngOnInit() {
    await this.load();

    // When the state service is changed, something it will be after network status update, we must reload UI.
    this.sub = this.stateService.changed$.subscribe(async () => {
      await this.load();
      this.updating = false;
    });
  }

  async load() {
    // Make sure we load latest state store, which has information about which indexer is currently selected.
    await this.stateStore.load();

    this.networks = this.networkStatus.getActive();
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  cancel() {
    this.location.back();
  }

  async reset() {
    this.updating = true;

    const stateEntry = this.stateStore.get();
    stateEntry.activeNetworks = [];
    await this.stateStore.save();

    this.networkStatus.reset();

    // Reload after reset
    await this.load();
  }

  async updatedSelectedNetwork() {
    const stateEntry = this.stateStore.get();

    for (var i = 0; i < this.networks.length; i++) {
      const network = this.networks[i];
      const networkEntry = stateEntry.activeNetworks?.find((a) => a.networkType == network.type);

      if (networkEntry) {
        networkEntry.domain = network.selectedDomain;
      }
    }

    await this.stateStore.save();
  }
}
