import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { EventBus, NetworkStatus, NetworkStatusEntry, NetworkStatusStore } from 'src/shared';
import { StateStore } from 'src/shared/store/state-store';
import { UIState, FeatureService, NetworkStatusService, StateService } from '../../services';

@Component({
  selector: 'app-debugger',
  templateUrl: './debugger.component.html',
  styleUrls: ['./debugger.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class DebuggerComponent implements OnDestroy, OnInit {
  networks: NetworkStatusEntry[];
  sub: any;
  updating = false;

  constructor(private events: EventBus, public uiState: UIState, public location: Location, private stateService: StateService, private stateStore: StateStore, public networkStatus: NetworkStatusService, public feature: FeatureService) {
    this.uiState.title = 'Logs';
    this.uiState.showBackButton = true;
    this.uiState.goBackHome = false;
  }

  async ngOnInit() {

  }

  ngOnDestroy() {

  }

  cancel() {
    this.location.back();
  }

  async reset() {
    this.updating = true;
  }
}
