import { Component, Inject, HostBinding } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as pbkdf2 from 'pbkdf2';
import { CryptoService } from '../services/crypto.service';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html'
})
export class HomeComponent {
  mnemonic = '';
  password = '';
  encrypted = '';
  unlocked = '';

  constructor(private crypto: CryptoService) { }

  generate() {
    this.mnemonic = this.crypto.generateMnemonic();
  }

  async unlock() {
    this.unlocked = await this.crypto.decryptData(this.encrypted, this.password) || "Unlock failed!";
  }

  async save() {
    this.encrypted = await this.crypto.encryptData(this.mnemonic, this.password) || "Encrypting failed!";
  }
}
