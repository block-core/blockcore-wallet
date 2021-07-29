import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AboutComponent } from './about/about.component';
import { AccountComponent } from './account/account.component';
import { HomeComponent } from './home/home.component';
import { LoadingResolverService } from './shared/loading.resolver';

const routes: Routes = [
  {
    path: '', component: HomeComponent, pathMatch: 'full', resolve: {
      chain: LoadingResolverService
    }
  },
  {
    path: 'about', component: AboutComponent
  },
  {
    path: 'account', component: AccountComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
