import { Component } from '@angular/core';
import { ApplicationState } from './services/application-state.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'blockcore-extension';
  wallet: any;

  constructor(public appState: ApplicationState) {

  }
}
