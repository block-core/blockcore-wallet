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

const routes: Routes = [
  {
    path: '', component: LoadingComponent, pathMatch: 'full',
    // resolve: {
    //   chain: LoadingResolverService
    // }
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
    path: 'account/view/:index', component: AccountComponent
  },
  {
    path: 'account/view/identity/:index', component: AccountIdentityComponent
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
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
