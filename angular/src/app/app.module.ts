import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule, MAT_RADIO_DEFAULT_OPTIONS } from '@angular/material/radio';
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
import { HttpClientModule } from '@angular/common/http';
import { PasswordComponent } from './settings/password/password.component';
import { BiometricComponent } from './settings/biometric/biometric.component';
import { RecoveryComponent } from './settings/recovery/recovery.component';
import { AccountReceiveComponent } from './account/receive/receive.component';
import { AccountSelectComponent } from './account/select/select.component';
import { AmountPipe } from './shared/amount.pipe';
import { AccountTransactionComponent } from './account/transaction/transaction.component';
import { AccountSendComponent } from './account/send/send.component';
import { AccountSendConfirmComponent } from './account/send/confirm/send-confirm.component';
import { AccountSendSuccessComponent } from './account/send/success/send-success.component';
import { AccountSendSendingComponent } from './account/send/sending/send-sending.component';
import { AccountSendSidechainComponent } from './account/send-sidechain/send.component';
import { AccountSendSidechainAddressComponent } from './account/send-sidechain/address/send-address.component';
import { AccountSendSidechainConfirmComponent } from './account/send-sidechain/confirm/send-confirm.component';
import { AccountSendSidechainSuccessComponent } from './account/send-sidechain/success/send-success.component';
import { AccountSendSidechainSendingComponent } from './account/send-sidechain/sending/send-sending.component';
import { LoggerModule, NgxLoggerLevel, TOKEN_LOGGER_WRITER_SERVICE } from 'ngx-logger';
import { LogWriterService } from './services/log-writer.service';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';
import { NetworkStatusComponent } from './shared/network-status/network-status.component';
import { HandlerComponent } from './settings/handler/handler.component';
import { ActionStratisIdentityComponent } from './action/sid/sid.component';
import { ActionNostrIdentityComponent } from './action/nostr/nostr.component';
import { AboutComponent } from './settings/about/about.component';
import { AccountHistoryStore, AddressStore, NetworkStatusStore, TransactionStore, UIStore, WalletStore, AddressIndexedStore, EventBus, NetworkLoader } from 'src/shared';
import { ActionStore } from 'src/shared/store/action-store';
import { SettingStore } from 'src/shared/store/setting-store';
import { AddressWatchStore } from 'src/shared/store/address-watch-store';
import { SizePipe } from './shared/size.pipe';
import { AccountStateStore } from 'src/shared/store/account-state-store';
import { NonFungibleTokenComponent } from './collectables/non-fungible-token.component';
import { CollectablesComponent } from './collectables/collectables.component';
import { NetworkComponent } from './settings/network/network.component';
import { NetworkStatusPipe } from './shared/network-status.pipe';
import { MatDialogModule } from '@angular/material/dialog';
import { QrScanDialog } from './account/send/address/qr-scanning.component';
import { IdentityComponent } from './account/identity/identity.component';
import { PermissionsComponent } from './settings/permissions/permissions.component';
import { PermissionStore } from 'src/shared/store/permission-store';
import { ActionPublicKeyComponent } from './action/publickey/publickey.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { ActionComponent } from './action/action.component';
import { AppUpdateService } from './services/app-update.service';
import { ContactsComponent } from './contacts/contacts.component';
import { ContactsCreateComponent } from './contacts/create/create.component';
import { ContactStore } from 'src/shared/store/contacts-store';
import { ContactsViewComponent } from './contacts/view/view.component';
import { ExchangeComponent } from './exchange/exchange.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {StandardTokenStore} from "../shared/store/standard-token-store";
import { ActionSignMessageComponent } from './action/sign-message/sign.component';
import { ActionSignVerifiableCredentialComponent } from './action/sign-credential/sign.component';
import { RuntimeService } from 'src/shared/runtime.service';
import { StorageService } from 'src/shared/storage.service';
import { SharedManager } from 'src/shared/shared-manager';
import { CommunicationService, CryptoService, CryptoUtility } from './services';
import { StateStore } from 'src/shared/store/state-store';
import { ActionVaultSetupComponent } from './action/vault-setup/vault-setup.component';
import { AccountSendAddressComponent } from './account/send/address/send-address.component';
import { PaymentComponent } from './account/payment/payment.component';
import { PaymentRequest } from 'src/shared/payment';
import { MessageService } from 'src/shared';

// required for AOT compilation
export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http);
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    AboutComponent,
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
    BiometricComponent,
    NetworkStatusPipe,
    TruncatePipe,
    SizePipe,
    ActionIdentityComponent,
    ActionLoginComponent,
    WipeComponent,
    PrivacyComponent,
    LicensesComponent,
    AccountReceiveComponent,
    AccountSelectComponent,
    AmountPipe,
    AccountTransactionComponent,
    AccountSendAddressComponent,
    AccountSendComponent,
    AccountSendConfirmComponent,
    AccountSendSuccessComponent,
    AccountSendSendingComponent,
    AccountSendSidechainComponent,
    AccountSendSidechainAddressComponent,
    AccountSendSidechainConfirmComponent,
    AccountSendSidechainSuccessComponent,
    AccountSendSidechainSendingComponent,
    NetworkStatusComponent,
    HandlerComponent,
    ActionStratisIdentityComponent,
    ActionNostrIdentityComponent,
    CollectablesComponent,
    NonFungibleTokenComponent,
    ActionStratisIdentityComponent,
    ActionNostrIdentityComponent,
    NetworkComponent,
    QrScanDialog,
    IdentityComponent,
    PermissionsComponent,
    ActionPublicKeyComponent,
    ActionComponent,
    ContactsComponent,
    ContactsCreateComponent,
    ContactsViewComponent,
    ExchangeComponent,
    ActionSignMessageComponent,
    ActionSignVerifiableCredentialComponent,
    ActionVaultSetupComponent,
    PaymentComponent
  ],
  imports: [
    BrowserModule,
    // ngx-translate and the loader module
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
    FormsModule,
    HttpClientModule,
    LoggerModule.forRoot(
      { level: NgxLoggerLevel.DEBUG, enableSourceMaps: true, serverLogLevel: NgxLoggerLevel.OFF }, // Don't send logs anywhere!
      {
        writerProvider: {
          provide: TOKEN_LOGGER_WRITER_SERVICE,
          useClass: LogWriterService,
        },
      }
    ),
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
    MatProgressBarModule,
    MatDialogModule,
    MatSlideToggleModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      //enabled: environment.production,
      // Do not register the service worker, if running in extension mode.
      enabled: !(globalThis.chrome && globalThis.chrome.runtime && globalThis.chrome.tabs),

      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWithDelay:5000',
      //registrationStrategy: 'registerWhenStable:10000'
    }),
  ],
  exports: [NetworkPipe, TruncatePipe, NetworkStatusPipe],
  providers: [
    {
      provide: MAT_RADIO_DEFAULT_OPTIONS,
      useValue: { color: 'primary' },
    },
    AddressStore,
    ActionStore,
    NetworkStatusStore,
    SettingStore,
    TransactionStore,
    UIStore,
    WalletStore,
    AccountHistoryStore,
    AddressWatchStore,
    // NetworkLoader,
    // networkLoaderServiceProvider,
    AddressIndexedStore,
    AccountStateStore,
    PermissionStore,
    AppUpdateService,
    ContactStore,
    StandardTokenStore,
    StateStore,
    RuntimeService,
    CryptoService,
    CryptoUtility,
    PaymentRequest,
    EventBus,
    {
      provide: MessageService,
      useFactory: (runtime: RuntimeService, events: EventBus) => new MessageService(runtime, events),
      deps: [RuntimeService, EventBus],
    },
    {
      provide: SharedManager,
      useFactory: (storage: StorageService, store: WalletStore, networkLoader: NetworkLoader, messageService: MessageService) => new SharedManager(storage, store, networkLoader, messageService),
      deps: [StorageService, WalletStore, NetworkLoader, MessageService],
    },
    {
      provide: StorageService,
      useFactory: (runtimeService: RuntimeService) => new StorageService(runtimeService),
      deps: [RuntimeService],
    },
    {
      provide: NetworkLoader,
      useFactory: (store: NetworkStatusStore, stateStore: StateStore) => new NetworkLoader(store, stateStore),
      deps: [NetworkStatusStore, StateStore],
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
