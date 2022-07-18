import { Injectable } from '@angular/core';
import { ClientDataObj } from '../interfaces/client-data-obj';
import { DecodedAttestionObj } from '../interfaces/decoded-attestion-obj';
import { User } from '../interfaces/user';
import * as CBOR from '../utils/cbor';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class ServerMockService {

  constructor(private userService: UserService) { }

  // Validate and Store credential
  registerCredential(user: User, credential: PublicKeyCredential): boolean {
    const authData = this.extractAuthData(credential);
    const credentialIdLength = this.getCredentialIdLength(authData);
    const credentialId: Uint8Array = authData.slice(55, 55 + credentialIdLength);
    console.log('credentialIdLength', credentialIdLength);
    console.log('credentialId', credentialId);
    const publicKeyBytes: Uint8Array = authData.slice(55 + credentialIdLength);
    const publicKeyObject = CBOR.decode(publicKeyBytes.buffer);
    console.log('publicKeyObject', publicKeyObject);

    const valid = true;

    if (valid) {
      user.credentials.push( { credentialId, publicKey: publicKeyBytes } );
      this.updateUser(user);
    }

    return valid;
  }

  getCredentialIdLength(authData: Uint8Array): number {
    // get the length of the credential ID
    const dataView = new DataView(new ArrayBuffer(2));
    const idLenBytes = authData.slice(53, 55);
    idLenBytes.forEach((value, index) => dataView.setUint8(index, value));
    return dataView.getUint16(0);
  }

  extractAuthData(credential: PublicKeyCredential): Uint8Array {
    // decode the clientDataJSON into a utf-8 string
    const utf8Decoder = new TextDecoder('utf-8');
    const decodedClientData = utf8Decoder.decode(credential.response.clientDataJSON);

    const clientDataObj: ClientDataObj = JSON.parse(decodedClientData);
    console.log('clientDataObj', clientDataObj);

    const decodedAttestationObj: DecodedAttestionObj = CBOR.decode((credential.response as any).attestationObject);
    console.log('decodedAttestationObj', decodedAttestationObj);

    const { authData } = decodedAttestationObj;
    console.log('authData', authData);

    return authData;
  }

  getUsers() {
    return this.userService.getUsers();
  }

  updateUser(user: User) {
    this.removeUser(user.email);
    this.addUser(user);
  }

  addUser(user: User) {
    user.id = '' + Math.floor(Math.random() * 10000000);
    this.userService.addUser(user);
    return user;
  }

  getUser(email: string) {
    return this.userService.getUser(email);
  }

  removeUser(email: string) {
    return this.userService.removeUser(email);
  }

  getChallenge() {
    return Uint8Array.from('someChallengeIsHereComOn', c => c.charCodeAt(0));
  }
}
