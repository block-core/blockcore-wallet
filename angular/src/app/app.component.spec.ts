import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatCardModule } from '@angular/material/card';
import { LayoutModule } from '@angular/cdk/layout';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatMenuModule } from '@angular/material/menu';
import { MatTreeModule } from '@angular/material/tree';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { HomeComponent } from './home/home.component';
import { LoadingComponent } from './loading/loading.component';
import { AccountRemoveComponent } from './account/remove/remove.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AccountEditComponent } from './account/edit/edit.component';
import { WalletCreateComponent } from './wallet/create/create.component';
import { WalletRemoveComponent } from './wallet/remove/remove.component';
import { WalletEditComponent } from './wallet/edit/edit.component';
import { AccountCreateComponent } from './account/create/create.component';
import { AccountComponent } from './account/account.component';
import { SettingsComponent } from './settings/settings.component';
import { ActionSignComponent } from './action/sign/sign.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NetworkPipe } from './shared/network.pipe';
import { TruncatePipe } from './shared/truncate.pipe';
import { ActionIdentityComponent } from './action/identity/identity.component';
import { ActionLoginComponent } from './action/login/login.component';
import { WipeComponent } from './wipe/wipe.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PrivacyComponent } from './settings/privacy/privacy.component';
import { LicensesComponent } from './settings/licenses/licenses.component';
import { ChangesComponent } from './settings/changes/changes.component';
import { HttpClientModule } from '@angular/common/http';
import { PasswordComponent } from './settings/password/password.component';
import { RecoveryComponent } from './settings/recovery/recovery.component';
import { AccountReceiveComponent } from './account/receive/receive.component';
import { AccountSelectComponent } from './account/select/select.component';
import { AmountPipe } from './shared/amount.pipe';
import { AccountTransactionComponent } from './account/transaction/transaction.component';
import { AccountSendComponent } from './account/send/send.component';
import { AccountSendAddressComponent } from './account/send/address/send-address.component';
import { AccountSendConfirmComponent } from './account/send/confirm/send-confirm.component';
import { AccountSendSuccessComponent } from './account/send/success/send-success.component';
import { AccountSendSendingComponent } from './account/send/sending/send-sending.component';
import { LoggerModule, NgxLoggerLevel, TOKEN_LOGGER_WRITER_SERVICE } from "ngx-logger";
import { LogWriterService, EnvironmentService, NetworkLoader } from './services';
import { TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';
import { NetworkStatusComponent } from './shared/network-status/network-status.component';
import { IEnvironment } from '../shared/interfaces';
import { AccountHistoryStore, ActionStore, AddressStore, AddressWatchStore, NetworkStatusStore, SettingStore, TransactionStore, UIStore, WalletStore } from 'src/shared';

// required for AOT compilation
export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http);
}

describe('AppComponent', () => {

  const mockEnvironment: IEnvironment = {
    instanceName: 'UnitTest',
    features: [],
    instance: '',
    instanceExplorerUrl: '',
    instanceUrl: '',
    networks: [],
    releaseUrl: '',
    sourceUrl: '',
    enableDebugTools: false,
    logLevel: 'debug',
    production: false
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        BrowserModule,
        // ngx-translate and the loader module
        HttpClientModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [HttpClient]
          }
        }),
        FormsModule,
        HttpClientModule,
        LoggerModule.forRoot(
          { level: NgxLoggerLevel.DEBUG, enableSourceMaps: true, serverLogLevel: NgxLoggerLevel.OFF }, // Don't send logs anywhere!
          {
            writerProvider: {
              provide: TOKEN_LOGGER_WRITER_SERVICE, useClass: LogWriterService
            }
          }),
        AppRoutingModule,
        BrowserAnimationsModule,
        ReactiveFormsModule,
        LayoutModule,
        MatCheckboxModule,
        MatInputModule,
        MatButtonModule,
        MatSelectModule,
        MatRadioModule,
        MatCardModule,
        MatToolbarModule,
        MatSidenavModule,
        MatIconModule,
        MatListModule,
        MatGridListModule,
        MatMenuModule,
        MatTreeModule,
        MatBadgeModule,
        MatTabsModule,
        MatTooltipModule,
        MatExpansionModule,
        MatTableModule,
        MatStepperModule,
        MatProgressSpinnerModule,
        MatChipsModule,
        MatSnackBarModule,
        MatProgressBarModule
      ],
      declarations: [
        AppComponent,
        AppComponent,
        HomeComponent,
        PasswordComponent,
        AccountComponent,
        RecoveryComponent,
        AccountCreateComponent,
        AccountEditComponent,
        AccountRemoveComponent,
        LoadingComponent,
        DashboardComponent,
        WalletCreateComponent,
        WalletEditComponent,
        WalletRemoveComponent,
        SettingsComponent,
        ActionSignComponent,
        NetworkPipe,
        TruncatePipe,
        ActionIdentityComponent,
        ActionLoginComponent,
        WipeComponent,
        PrivacyComponent,
        LicensesComponent,
        ChangesComponent,
        AccountReceiveComponent,
        AccountSelectComponent,
        AmountPipe,
        AccountTransactionComponent,
        AccountSendComponent,
        AccountSendAddressComponent,
        AccountSendConfirmComponent,
        AccountSendSuccessComponent,
        AccountSendSendingComponent,
        NetworkStatusComponent
      ],
      providers: [{ provide: EnvironmentService, useValue: mockEnvironment },
      
        AddressStore,
        ActionStore,
        NetworkStatusStore,
        SettingStore,
        TransactionStore,
        UIStore,
        WalletStore,
        AccountHistoryStore,
        AddressWatchStore,
        NetworkLoader
      
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'blockcore-wallet'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('blockcore-wallet');
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    // console.log(compiled);
    // expect(compiled.querySelector('h2')?.textContent).toContain('Enter your password to unlock');
  });

  it('should be using the configured environment settings', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance.instanceName).toBe(mockEnvironment.instanceName);
  });
});
