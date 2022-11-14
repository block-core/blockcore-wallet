import { Component, Inject, HostBinding } from '@angular/core';
import { Location } from '@angular/common';
import { UIState } from '../services/ui-state.service';
import { StateService } from '../services';
import { RuntimeService } from '../../shared/runtime.service';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';

@Component({
  selector: 'app-sign',
  templateUrl: './sign.component.html',
  styleUrls: ['./sign.component.css'],
})
export class SignComponent {
  signFormGroup!: UntypedFormGroup;
  constructor(private location: Location, public uiState: UIState, private state: StateService, private runtime: RuntimeService, private fb: UntypedFormBuilder) {
    this.uiState.title = 'Sign & Verify';
    this.uiState.showBackButton = true;
    this.uiState.goBackHome = true;
    this.signFormGroup = this.fb.group({ accountCtrl: ['From Russia with Love'], messageCtrl: ['From Russia with Love 2'] });
  }
}
