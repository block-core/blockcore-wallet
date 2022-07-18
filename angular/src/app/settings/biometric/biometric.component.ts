import { Component, HostBinding, OnDestroy, ViewEncapsulation } from '@angular/core';
import { User } from 'src/app/interfaces/user';
import { EnvironmentService, ServerMockService, WebAuthnService } from '../../services';
import { UIState } from '../../services/ui-state.service';

@Component({
    selector: 'app-biometric',
    templateUrl: './biometric.component.html',
    styleUrls: ['./biometric.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class BiometricComponent implements OnDestroy {
    // @HostBinding('class.changes') hostClass = true;
    title = 'angular-web-authn';
    users: User[];
    email = 'a@a.com';
    password = 'aaa';
    useFingerprint = true;
    webAuthnAvailable = !!navigator.credentials && !!navigator.credentials.create;
    constructor(public uiState: UIState,
        public env: EnvironmentService,private serverMockService: ServerMockService, private webAuthnService: WebAuthnService) {
        this.uiState.title = 'Biometric';
        this.uiState.showBackButton = true;
        this.uiState.goBackHome = false;
        this.users = serverMockService.getUsers();

    }

    registerCredential()
    {
      this.signup();
    }

    removeUser(email: string) {
      this.serverMockService.removeUser(email);
      this.users = this.serverMockService.getUsers();
    }

    signup() {
      console.log('SIGNUP');

      // Save into the 'DB'
      const prevUser = this.serverMockService.getUser(this.email);
      if (prevUser) {
        alert('🚫 User already exists with this email address');
        return;
      }
      const user: User = this.serverMockService.addUser({ email: this.email, password: this.password, credentials: [] });
      this.users = this.serverMockService.getUsers();

      // Ask for WebAuthn Auth method
      if (this.webAuthnAvailable && this.useFingerprint) {
        this.webAuthnService.webAuthnSignup(user)
          .then((credential: PublicKeyCredential) => {
            console.log('credentials.create RESPONSE', credential);
            const valid = this.serverMockService.registerCredential(user, credential);
            this.users = this.serverMockService.getUsers();
          }).catch((error) => {
            console.log('credentials.create ERROR', error);
          });
      }
    }

    signin() {
      console.log('[signin]');
      const user = this.serverMockService.getUsers().find(u => u.email === this.email && u.password === this.password );
      if (user) {
        alert('✅ Congrats! Authentication went fine!');
      } else {
        alert('🚫 Sorry :( Invalid credentials!');
      }
    }

    webAuthSignin() {
      const user = this.serverMockService.getUser(this.email);
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
