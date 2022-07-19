import { Injectable } from '@angular/core';
import { User } from '../../shared/interfaces';
import { CredentialService } from './credential.service';

@Injectable({
  providedIn: 'root'
})
export class WebAuthnService {

  constructor(private credentialService: CredentialService) { }

  webAuthnSignup(user: User): Promise<any> {
    console.log('[webAuthnSignup]');
    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      // Challenge shoulda come from the server
      challenge: this.credentialService.getChallenge(),
      rp: {
        name: 'WebAuthn Test',
        // id: 'localhost:4200',
      },
      user: {
        // Some user id coming from the server
        id: Uint8Array.from(user.id, c => c.charCodeAt(0)),
        name: user.username,
        displayName: user.username,
      },
      pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        // requireResidentKey: true,
      },
      timeout: 60000,
      attestation: 'direct'
    };

    return navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    });

  }

  webAuthnSignin(user: User): Promise<any> {
    const allowCredentials: PublicKeyCredentialDescriptor[] = user.credentials.map(c => {
      console.log(c.credentialId);
      return { type: 'public-key', id: Uint8Array.from(Object.values(c.credentialId)) };
    });

    console.log('allowCredentials', allowCredentials);

    const credentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge: this.credentialService.getChallenge(),
      allowCredentials,
    };

    return navigator.credentials.get({
      publicKey: credentialRequestOptions,
    });
  }
}
