import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-account-icon',
  templateUrl: './account-icon.component.html',
  styleUrls: ['./account-icon.component.css'],
})
export class AccountIconComponent {
  @Input() value: any;
  @Input() large: boolean = false;

  constructor() {}
}
