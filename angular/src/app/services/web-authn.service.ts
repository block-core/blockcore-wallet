import { Injectable } from '@angular/core';
import { User } from '../shared/interfaces/user';
import { CredentialServices } from './credential.services';

@Injectable({
  providedIn: 'root'
})
export class WebAuthnService {

  constructor(private credentialServices: CredentialServices) { }

  webAuthnSignup(user: User): Promise<any> {
    console.log('[webAuthnSignup]');
    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      // Challenge shoulda come from the server
      challenge: this.credentialServices.getChallenge(),
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
      challenge: this.credentialServices.getChallenge(),
      allowCredentials,
    };

    return navigator.credentials.get({
      publicKey: credentialRequestOptions,
    });
  }
}
