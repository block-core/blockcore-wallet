import { Component, Inject, HostBinding, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApplicationState } from '../services/application-state.service';
import { CryptoService } from '../services/crypto.service';

@Component({
    selector: 'app-account',
    templateUrl: './account.component.html',
    styleUrls: ['./account.component.css']
})
export class AccountComponent implements OnInit {
    mnemonic = '';
    firstFormGroup!: FormGroup;
    secondFormGroup!: FormGroup;
    step = 0;
    recover = false;

    constructor(private _formBuilder: FormBuilder,
        public appState: ApplicationState,
        private crypto: CryptoService,
    ) { }

    ngOnInit() {
        this.firstFormGroup = this._formBuilder.group({
            // firstCtrl: ['', Validators.required]
        });
        this.secondFormGroup = this._formBuilder.group({
            secondCtrl: ['', Validators.required]
        });
    }

    generate() {
        this.mnemonic = this.crypto.generateMnemonic();
    }

    create() {
        this.step = 1;
        this.recover = false;
        this.generate();
    }

    restore() {
        this.step = 1;
        this.recover = true;

    }
}
