import { Component, Inject, HostBinding, ChangeDetectorRef, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CryptoService } from '../services/crypto.service';
import { ApplicationState } from '../services/application-state.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  mnemonic = '';
  password = '';
  unlocked = '';
  unlockPassword = '';
  alarmName = 'refresh';
  wallet: any;
  error = '';

  constructor(
    public appState: ApplicationState,
    private crypto: CryptoService,
    private router: Router,
    private cd: ChangeDetectorRef) {

    this.appState.title = 'Unlock wallet';

    this.activateAlarm();

  }

  removeError(): void {
    this.error = '';
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

  async remove() {
    this.mnemonic = '';
    this.password = '';
    this.unlocked = '';
    this.unlockPassword = '';

    await this.appState.save();
  }

  async unlock() {
    let unlockedMnemonic = null;

    if (this.appState.activeWallet) {
      unlockedMnemonic = await this.crypto.decryptData(this.appState.activeWallet?.mnemonic, this.unlockPassword);
    }

    if (unlockedMnemonic) {
      this.appState.unlocked = true;

      if (this.appState.persisted.activeAccountIndex == null) {
        this.appState.persisted.activeAccountIndex = 0;
      }

      // Keep the unlocked mnemonic in-memory until auto-lock timer removes it.
      this.appState.unlockedMnemonic = unlockedMnemonic;

      this.appState.port?.postMessage({ method: 'unlock', data: this.unlockPassword });

      this.router.navigateByUrl('/account/view/' + this.appState.persisted.activeAccountIndex);
    } else {
      this.error = 'Invalid password';
    }
  }

  ngOnInit(): void {
    if (this.appState.password) {
      this.unlockPassword = this.appState.password;
      this.unlock();
    }
  }
}
