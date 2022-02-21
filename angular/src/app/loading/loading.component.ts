import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { UIState } from '../services/ui-state.service';
import { CryptoService } from '../services/crypto.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommunicationService } from '../services/communication.service';
import { AppManager } from '../../background/application-manager';
import { SecureStateService } from '../services/secure-state.service';
import * as secp from "@noble/secp256k1";

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.css']
})
export class LoadingComponent implements OnInit, OnDestroy {
  problems: boolean;

  constructor(
    public uiState: UIState,
    // private appManager: ApplicationManagerService,
    private appManager: AppManager,
    public secure: SecureStateService,
    private communication: CommunicationService
  ) {
    this.uiState.title = 'Loading...';
    this.uiState.manifest = chrome.runtime.getManifest();
  }

  ngOnDestroy(): void {

  }

  reload() {
    window.location.href = 'index.html';
  }

  async update() {
    await this.secure.set('123', '222');
  }

  async getSession() {
    console.log(this.secure.get('123'));
  }

  async ngOnInit() {

    console.log('SECURE:LOAD:');

    // await this.secure.clear();

    await globalThis.chrome.storage.local.set({ 'active': new Date().toJSON() });
    await globalThis.chrome.storage.local.set({ 'timeout': 1 });

    // chrome.storage.onChanged.addListener((changes, area) => {
    //   console.log('chrome.storage.onChanged:changes:', changes);
    //   console.log('chrome.storage.onChanged:area:', area);
    // });

    // const storage = globalThis.chrome.storage as any;
    // await storage.session.set({ 'password': '123@!' });

    // await storage.session.set({
    //   ''
    // });


    // Each instance of extension need this listener when session is cleared.
    // storage.session.onChanged.addListener(function (changes: any, namespace: any) {
    //   console.log("change recived22222222!");
    //   console.log(changes);
    //   console.log(namespace);
    // });

    // storage.local.onChanged.addListener(function (changes: any, namespace: any) {
    //   console.log("change recived111111111!");
    //   console.log(changes);
    //   console.log(namespace);
    // });

    // await storage.session.set({ 'password': '123@!22' });

    // Make sure that the secure values are loaded.
    await this.secure.load();

    const privateKey = secp.utils.randomPrivateKey();
    this.secure.set('12345', Buffer.from(privateKey).toString('hex'))
    this.secure.set('12346', Buffer.from(privateKey).toString('base64'))

    setTimeout(() => {
      console.log('this.secure.get', this.secure.get('12345'));
      console.log('this.secure.get', this.secure.get('12346'));
    }, 0);

    setTimeout(async () => {
      console.log('set 1');
      await this.secure.set('12345', '1123123123');
    }, 2000);

    setTimeout(async () => {
      console.log('set 2');
      await this.secure.set('12345', '654411aaa');
    }, 6000);

    setTimeout(async () => {
      console.log('set 3');
      await this.secure.set('123', '654411aa123123a');
    }, 8000);

    setTimeout(() => {
      console.log('this.secure.get', this.secure.get('12345'));
    }, 4000);

    setTimeout(() => {
      console.log('this.secure.get', this.secure.get('123'));
    }, 10000);

    // const enc = new TextEncoder();
    // const val = enc.encode("This is a string converted to a Uint8Array");
    // await this.secure.set('password1', val);

    // console.log(this.secure.get('password1'));
    // console.log('DONE!!!');

    setInterval(() => {

      // let date2 = new Date();
      // console.log('interval password:', this.secure.get('password1'));
      //console.log('Settings stored in2: ' + (new Date().valueOf() - date2.valueOf()) + 'ms');

      // this.secure.resetTimer();

    }, 2000);

    await this.appManager.initialize();
    // await this.appManager.initialize();

    // When the extension has been initialized, we'll send 'state' to background to get the current state. The UI will show loading
    // indicator until 'state-changed' is triggered.
    // chrome.tabs.query({
    //   active: true,
    //   lastFocusedWindow: true
    // }, (tabs) => {
    //   // debugger;
    //   var tab = tabs[0];
    //   // Provide the tab URL with the state query, because wallets and accounts is connected to domains.
    //   this.communication.send('state-load', { url: tab?.url });
    // });

    // If the state has not loaded or triggered after a timeout, display reload button / reset options.
    setTimeout(() => {
      this.problems = true;
    }, 5000);
  }
}
