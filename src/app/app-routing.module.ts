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
    path: 'settings', component: SettingsComponent
  },
  {
    path: 'account/view/:index', component: AccountComponent
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
