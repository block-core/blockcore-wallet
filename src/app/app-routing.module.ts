import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AboutComponent } from './about/about.component';
import { AccountComponent } from './account/account.component';
import { AccountRemoveComponent } from './account/remove/remove.component';
import { HomeComponent } from './home/home.component';
import { LoadingComponent } from './loading/loading.component';
import { WalletComponent } from './wallet/wallet.component';

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
    path: 'account', component: AccountComponent
  },
  {
    path: 'remove', component: AccountRemoveComponent
  },
  {
    path: 'wallet', component: WalletComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
