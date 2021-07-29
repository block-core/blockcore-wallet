import { Component, Inject, HostBinding, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CryptoService } from '../services/crypto.service';
import { ApplicationState } from '../services/application-state.service';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html'
})
export class HomeComponent {
  mnemonic = '';
  password = '';
  unlocked = '';
  unlockPassword = '';
  alarmName = 'refresh';

  constructor(
    public appState: ApplicationState,
    private crypto: CryptoService,
    private cd: ChangeDetectorRef) {

    this.activateAlarm();

  }

  activateAlarm() {
    chrome.alarms.getAll((alarms) => {
      var hasAlarm = alarms.some((a) => {
        return a.name == this.alarmName;
      });

      if (!hasAlarm) {
        chrome.alarms.create('refresh', {
          delayInMinutes: 0.1, periodInMinutes: 0.1
        });

        console.log('Created alarm.');
      }
      else {
        console.log('Has alarm already!!');
      }
    })
  }

  generate() {
    this.mnemonic = this.crypto.generateMnemonic();
  }

  remove() {
    this.appState.persisted.mnemonic = '';
    this.mnemonic = '';
    this.password = '';
    this.unlocked = '';
    this.unlockPassword = '';

    this.appState.save(() => {
      this.cd.detectChanges();
    });
  }

  async unlock() {
    this.unlocked = await this.crypto.decryptData(this.appState.persisted.mnemonic, this.unlockPassword) || "Unlock failed!";
  }

  async save() {
    // Set the mnemonic.
    this.appState.persisted.mnemonic = await this.crypto.encryptData(this.mnemonic, this.password) || "Encrypting failed!";

    // Persist the state.
    this.appState.save(null);
  }
}
