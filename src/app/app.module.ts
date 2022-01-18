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
import { AboutComponent } from './about/about.component';
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
import { AccountIdentityComponent } from './account/view/identity/identity.component';
import { WipeComponent } from './wipe/wipe.component';
import { VaultComponent } from './vault/vault.component';
import { VaultIdentityComponent } from './vault/view/identity/identity.component';
import { VaultCreateComponent } from './vault/create/create.component';
import { VaultEditComponent } from './vault/edit/edit.component';
import { VaultRemoveComponent } from './vault/remove/remove.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PrivacyComponent } from './settings/privacy/privacy.component';
import { LicensesComponent } from './settings/licenses/licenses.component';
import { ChangesComponent } from './settings/changes/changes.component';
import { HttpClientModule } from '@angular/common/http';
import { PasswordComponent } from './settings/password/password.component';
import { RecoveryComponent } from './settings/recovery/recovery.component';
import { NostrIdentityComponent } from './account/view/nostr/identity.component';
import { AccountReceiveComponent } from './account/receive/receive.component';

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
    ActionIdentityComponent,
    ActionLoginComponent,
    AccountIdentityComponent,
    WipeComponent,
    VaultComponent,
    VaultIdentityComponent,
    VaultCreateComponent,
    VaultEditComponent,
    VaultRemoveComponent,
    PrivacyComponent,
    LicensesComponent,
    ChangesComponent,
    NostrIdentityComponent,
    AccountReceiveComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
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
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {

}
