import { Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { User } from 'src/shared/interfaces/user';
import { EnvironmentService, CredentialService, WebAuthnService } from '../../services';
import { UIState } from '../../services/ui-state.service';

@Component({
  selector: 'app-biometric',
  templateUrl: './biometric.component.html',
  styleUrls: ['./biometric.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class BiometricComponent implements OnDestroy {
  title = 'angular-web-authn';
  users: User[];
  username = 'aaa';
  password = 'aaa';
  useFingerprint = true;
  webAuthnAvailable = !!navigator.credentials && !!navigator.credentials.create;
  constructor(public uiState: UIState,
    public env: EnvironmentService, private credentialService: CredentialService, private webAuthnService: WebAuthnService) {
    this.uiState.title = 'Biometric';
    this.uiState.showBackButton = true;
    this.uiState.goBackHome = false;
    this.users = credentialService.getUsers();

  }

  removeCredential() {
    this.credentialService.removeUser(this.username);
    this.users = this.credentialService.getUsers();
  }

  registerCredential() {
    console.log('SIGNUP');

    // Save into the 'DB'
    const prevUser = this.credentialService.getUser(this.username);
    if (prevUser) {
      alert('🚫 credentials already exists');
      return;
    }
    const user: User = this.credentialService.addUser({ username: this.username, password: this.password, credentials: [] });
    this.users = this.credentialService.getUsers();

    // Ask for WebAuthn Auth method
    if (this.webAuthnAvailable && this.useFingerprint) {
      this.webAuthnService.webAuthnSignup(user)
        .then((credential: PublicKeyCredential) => {
          console.log('credentials.create RESPONSE', credential);
          const valid = this.credentialService.registerCredential(user, credential);
          this.users = this.credentialService.getUsers();
        }).catch((error) => {
          console.log('credentials.create ERROR', error);
        });
    }
  }

  verifyCredential() {
    const user = this.credentialService.getUser(this.username);
    this.webAuthnService.webAuthnSignin(user).then((response) => {
      // TODO: validate attestion
      alert('✅ Congrats! Authentication went fine!');
      console.log('SUCCESSFULLY GOT AN ASSERTION!', response);
    })
      .catch((error) => {
        alert('🚫 Sorry :( Invalid credentials!');
        console.log('FAIL', error);
      });
  }


  ngOnDestroy() {
  }
}
