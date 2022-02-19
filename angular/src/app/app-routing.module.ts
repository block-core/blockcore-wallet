import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AboutComponent } from './about/about.component';
import { HomeComponent } from './home/home.component';
import { LoadingComponent } from './loading/loading.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { WalletCreateComponent } from './wallet/create/create.component';
import { WalletRemoveComponent } from './wallet/remove/remove.component';
import { WalletEditComponent } from './wallet/edit/edit.component';
import { AccountEditComponent } from './account/edit/edit.component';
import { AccountCreateComponent } from './account/create/create.component';
import { AccountRemoveComponent } from './account/remove/remove.component';
import { AccountComponent } from './account/account.component';
import { SettingsComponent } from './settings/settings.component';
import { ActionSignComponent } from './action/sign/sign.component';
import { ActionIdentityComponent } from './action/identity/identity.component';
import { ActionLoginComponent } from './action/login/login.component';
import { AccountIdentityComponent } from './account/view/identity/identity.component';
import { WipeComponent } from './wipe/wipe.component';
import { VaultComponent } from './vault/vault.component';
import { VaultIdentityComponent } from './vault/view/identity/identity.component';
import { VaultCreateComponent } from './vault/create/create.component';
import { VaultEditComponent } from './vault/edit/edit.component';
import { VaultRemoveComponent } from './vault/remove/remove.component';
import { PrivacyComponent } from './settings/privacy/privacy.component';
import { LicensesComponent } from './settings/licenses/licenses.component';
import { ChangesComponent } from './settings/changes/changes.component';
import { PasswordComponent } from './settings/password/password.component';
import { RecoveryComponent } from './settings/recovery/recovery.component';
import { NostrIdentityComponent } from './account/view/nostr/identity.component';
import { AccountReceiveComponent } from './account/receive/receive.component';
import { AccountSelectComponent } from './account/select/select.component';
import { AccountTransactionComponent } from './account/transaction/transaction.component';
import { AccountSendComponent } from './account/send/send.component';
import { AccountSendAddressComponent } from './account/send/address/send-address.component';
import { AccountSendConfirmComponent } from './account/send/confirm/send-confirm.component';
import { AccountSendSuccessComponent } from './account/send/success/send-success.component';
import { AccountSendSendingComponent } from './account/send/sending/send-sending.component';
import { HandlerComponent } from './settings/handler/handler.component';
import { ActionStratisIdentityComponent } from './action/sid/sid.component';
import { ActionNostrIdentityComponent } from './action/nostr/nostr.component';

const routes: Routes = [
  {
    path: '', component: LoadingComponent, pathMatch: 'full',
  },
  {
    path: 'home', component: HomeComponent
  },
  {
    path: 'about', component: AboutComponent
  },
  {
    path: 'wipe', component: WipeComponent
  },
  {
    path: 'settings', component: SettingsComponent
  },
  {
    path: 'settings/privacy', component: PrivacyComponent
  },
  {
    path: 'settings/licenses', component: LicensesComponent
  },
  {
    path: 'settings/changes', component: ChangesComponent
  },
  {
    path: 'settings/password', component: PasswordComponent
  },
  {
    path: 'settings/export-recovery-phrase', component: RecoveryComponent
  },
  {
    path: 'settings/handler', component: HandlerComponent
  },
  {
    path: 'account/select', component: AccountSelectComponent
  },
  {
    path: 'account/view/:index', component: AccountComponent
  },
  {
    path: 'account/send', component: AccountSendComponent, children: [
      { path: '', redirectTo: 'address', pathMatch: 'full' },
      {
        path: 'address',
        component: AccountSendAddressComponent
      },
      {
        path: 'confirm',
        component: AccountSendConfirmComponent
      },
      {
        path: 'sending',
        component: AccountSendSendingComponent
      },
      {
        path: 'success',
        component: AccountSendSuccessComponent
      }
    ]
  },
  {
    path: 'account/receive/:index', component: AccountReceiveComponent
  },
  {
    path: 'account/transaction/:txid', component: AccountTransactionComponent
  },
  {
    path: 'account/view/identity/:index', component: AccountIdentityComponent
  },
  {
    path: 'account/view/nostr/:index', component: NostrIdentityComponent
  },
  {
    path: 'account/create', component: AccountCreateComponent
  },
  {
    path: 'account/edit/:index', component: AccountEditComponent
  },
  {
    path: 'account/remove/:index', component: AccountRemoveComponent
  },
  {
    path: 'vault/view/:index', component: VaultComponent
  },
  {
    path: 'vault/view/identity/:index', component: VaultIdentityComponent
  },
  {
    path: 'vault/create', component: VaultCreateComponent
  },
  {
    path: 'vault/edit/:index', component: VaultEditComponent
  },
  {
    path: 'vault/remove/:index', component: VaultRemoveComponent
  },
  {
    path: 'dashboard', component: DashboardComponent
  },
  {
    path: 'wallet/create', component: WalletCreateComponent
  },
  {
    path: 'wallet/edit', component: WalletEditComponent
  },
  {
    path: 'wallet/remove', component: WalletRemoveComponent
  },
  {
    path: 'action/sign', component: ActionSignComponent
  },
  {
    path: 'action/identity', component: ActionIdentityComponent
  },
  {
    path: 'action/login', component: ActionLoginComponent
  },
  {
    path: 'action/sid', component: ActionStratisIdentityComponent
  },
  {
    path: 'action/nostr', component: ActionNostrIdentityComponent
  },
  {
    path: 'popup',
    loadChildren: () => import('./modules/popup/popup.module').then(m => m.PopupModule)
  },
  {
    path: 'tab',
    loadChildren: () => import('./modules/tab/tab.module').then(m => m.TabModule)
  },
  {
    path: 'options',
    loadChildren: () => import('./modules/options/options.module').then(m => m.OptionsModule)
  },
  {
    path: '**', redirectTo: '/'
  },
];

@NgModule({
  // imports: [RouterModule.forRoot(routes)],
  imports: [RouterModule.forRoot(routes, { enableTracing: false, useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
