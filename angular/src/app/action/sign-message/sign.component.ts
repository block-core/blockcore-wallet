import { Component, OnInit, OnDestroy } from '@angular/core';
import { UIState } from '../../services';
import { ActionService } from 'src/app/services/action.service';

@Component({
  selector: 'app-sign-message',
  templateUrl: './sign.component.html',
  styleUrls: ['./sign.component.css'],
})
export class ActionSignMessageComponent implements OnInit, OnDestroy {
  constructor(public uiState: UIState, public action: ActionService) {}

  ngOnDestroy(): void {}

  ngOnInit(): void {}
}
