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

  constructor(
    public appState: ApplicationState,
    private crypto: CryptoService,
    private cd: ChangeDetectorRef) {
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
