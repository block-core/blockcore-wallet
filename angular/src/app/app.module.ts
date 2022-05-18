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
import { LogWriterService } from './services/log-writer.service';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';
import { NetworkStatusComponent } from './shared/network-status/network-status.component';
import { NetworkStatusCardComponent } from './shared/network-status-card/network-status.component';
import { HandlerComponent } from './settings/handler/handler.component';
import { ActionStratisIdentityComponent } from './action/sid/sid.component';
import { ActionNostrIdentityComponent } from './action/nostr/nostr.component';
import { AboutComponent } from './settings/about/about.component';
import { AccountHistoryStore, AddressStore, NetworkStatusStore, TransactionStore, UIStore, WalletStore, AddressIndexedStore } from 'src/shared';
import { ActionStore } from 'src/shared/store/action-store';
import { SettingStore } from 'src/shared/store/setting-store';
import { NetworkLoader } from './services';
import { AddressWatchStore } from 'src/shared/store/address-watch-store';
import { SizePipe } from './shared/size.pipe';
import { AccountStateStore } from 'src/shared/store/account-state-store';
import {NonFungibleTokenComponent} from "./Collectables/non-fungible-token.component";
import {collectables} from "./Collectables/collectables.component";

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
    TruncatePipe,
    SizePipe,
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
    NetworkStatusComponent,
    NetworkStatusCardComponent,
    HandlerComponent,
    ActionStratisIdentityComponent,
    ActionNostrIdentityComponent,
    collectables,
    NonFungibleTokenComponent
  ],
  imports: [
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
  exports: [NetworkPipe, TruncatePipe],
  providers: [
    AddressStore,
    ActionStore,
    NetworkStatusStore,
    SettingStore,
    TransactionStore,
    UIStore,
    WalletStore,
    AccountHistoryStore,
    AddressWatchStore,
    NetworkLoader,
    AddressIndexedStore,
    AccountStateStore
  ],
  bootstrap: [AppComponent]
})
export class AppModule {

}
