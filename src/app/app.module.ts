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

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    AboutComponent,
    AccountComponent,
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
    WipeComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
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
    MatSnackBarModule
  ],
  exports: [NetworkPipe, TruncatePipe],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
