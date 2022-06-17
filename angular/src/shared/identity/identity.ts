// Based on Decentralized Identifiers (DIDs) v1.0
// W3C Working Draft 26 January 2021 / W3C Working Draft 09 March 2021
// https://w3c.github.io/did-core/

import { createJWS, createJWT, decodeJWT } from 'did-jwt';
import {
  DIDDocument,
  ParsedDID,
  Resolver,
  VerificationMethod,
} from 'did-resolver';
import * as secp256k1 from '@transmute/did-key-secp256k1';
import {
  createVerifiableCredentialJwt,
  Issuer,
  JwtCredentialPayload,
  normalizeCredential,
} from 'did-jwt-vc';
import { SchnorrSigner } from './schnorr-signer';

export class BlockcoreIdentityIssuer {}


// NOTES:

// Signature scheme: "SchnorrSecp256k1Signature2019" 
// This is part of the "proof": { "type": "SchnorrSecp256k1Signature2019" } part of the VC.
// Link: https://github.com/decentralized-identity/SchnorrSecp256k1Signature2019

// What about "JsonWebSignature2020"? ... it would mean we can't do Schnorr, but ECSDA.

// JOSE Alg: "SS256K"
// The signed JWT (JWS) should use this value for "alg" field. 
// Link: https://identity.foundation/SchnorrSecp256k1Signature2019/#SS256K

// JsonWebKey2020
// This is the type of verificationMethod (key) to be used.
// Link: https://w3c-ccg.github.io/lds-jws2020/


/** Blockcore DID only supports SchnorrSecp256k1Signature2019. Each instance of this object represents an DID. */
export class BlockcoreIdentity {
  public static readonly PREFIX = 'did:is:';
  public readonly id: string;

  // readonly privateKey: string;
  private readonly verificationMethod;

  constructor(verificationMethod: VerificationMethod) {
    // console.log('BlockcoreIdentity input:');
    // console.log(verificationMethod);

    this.id = verificationMethod.controller;
    this.verificationMethod = verificationMethod;

    // if (privateKey.substring(0, 2) != '0x') {
    //    privateKey += '0x';
    // }

    // this.privateKey = privateKey;
  }

  // constructor(address: string, privateKey: string) {
  //    this.id = 'did:is:' + address;

  //    if (privateKey.substring(0, 2) != '0x') {
  //       privateKey += '0x';
  //    }

  //    this.privateKey = privateKey;
  // }

  private ordered(a: any, b: any) {
    let comparison = 0;
    if (a.id > b.id) {
      comparison = 1;
    } else if (a.id < b.id) {
      comparison = -1;
    }
    return comparison;
  }

  /** Sign a payload, this method only supports ES256K. */
  // public async signJwt(params: { header?: any, payload: any, privateKeyJwk: ISecp256k1PrivateKeyJwk }) {

  //    let method = 'sign';
  //    let header = params.header || {};

  //    header = Object.assign(header, {
  //       alg: 'ES256K'
  //    });

  //    // TODO: Until the signing library supports Multibase, we'll rely on Jwk for now.
  //    // Initially we performed transforms to multibase on all our APIs, but changed to Jwk to reduce code.
  //    const signed = await secp256k1.ES256K.sign(params.payload, params.privateKeyJwk, header);
  //    return signed;
  // }

  /** Signs a payload and encodes as JWT (JWS). The key should be in string format (hex, base58, base64). Adds "iat", "iss" to payload and "typ" to header. */
  public async jwt(options: { privateKey: string | any; payload: any }) {
    const signer = SchnorrSigner(options.privateKey);
    let jwt = await createJWT(options.payload, { issuer: this.id, signer });
    return jwt;
  }

  /** Returns a signed JWS from the payload. This method does NOT append any extra fields to the payload, but adds "issuer" to header. */
  public async jws(options: { privateKey: string | any; payload: any }) {
    const signer = SchnorrSigner(options.privateKey);
    let jwt = await createJWS(options.payload, signer, { issuer: this.id });
    return jwt;
  }

  // public async vc(options: { privateKey: string | any, payload: any }) {

  //    const vcPayload: JwtCredentialPayload = {
  //       sub: this.id,
  //       nbf: Math.floor(Date.now() / 1000),
  //       vc: {
  //         '@context': ['https://www.w3.org/2018/credentials/v1'],
  //         type: ['VerifiableCredential'],
  //         credentialSubject: {
  //           degree: {
  //             type: 'BachelorDegree',
  //             name: 'Baccalauréat en musiques numériques'
  //           }
  //         }
  //       }
  //     }

  //    const vcJwt = await createVerifiableCredentialJwt(vcPayload, issuer);
  //    console.log(vcJwt);

  //    const signer = SchnorrSigner(options.privateKey);
  //    let jwt = await createJWT(options.payload, { alg: 'ES256K', issuer: this.id, signer })
  //    return jwt;
  // }

  /** Generate the did.json document for this identity. This is a simple structure with only the identifier. */
  public did() {
    return {
      // '@context': ['https://www.w3.org/ns/did/v1'], // We only implement application/did+json
      id: this.id,
    };
  }

  /** Generates the DID document for the current identity. */
  public document(options: { service: [] } | any = null) {
    const data: any = {};
    // data['@context'] = ['https://www.w3.org/ns/did/v1'];  // We only implement application/did+json
    data.id = this.id;
    data.verificationMethod = [this.verificationMethod];

    if (options?.service) {
      data.service = options.service.sort(this.ordered);
    }

    // Get the unique ID of the verification method, this might have extra data to make it unique in the list (#key-1).
    data.authentication = [this.verificationMethod.id];
    data.assertionMethod = [this.verificationMethod.id];

    return data;
  }

//   public async getJsonWebKeyPair(keyPair?: secp256k1.Secp256k1KeyPair) {
//     if (!keyPair) {
//       keyPair = await _generateKeyPair();
//     }

//     const { publicKeyJwk, privateKeyJwk } = await keyPair.toJsonWebKeyPair(
//       true
//     );
//     return {
//       publicJwk: publicKeyJwk,
//       privateJwk: privateKeyJwk,
//     };
//   }

//   public async generateKeyPair() {
//     return await _generateKeyPair();
//   }

//   public async generateDidPayload(content = {}) {
//     return {
//       operation: 'create',
//       content: content,
//       recovery: await this.getJsonWebKeyPair(), // Generate random keys
//       update: await this.getJsonWebKeyPair(), // Generate random keys
//     };
//   }

  public async generateOperation(
    type: string,
    operation: string,
    sequence: number,
    content = {}
  ) {
    return {
      type,
      operation,
      sequence,
      content,
    };
  }

  /** Generates the DID document for the current identity. */
  public configuration2(options: { service: [] } | any = null) {
    const data: any = {};
    data['@context'] = [
      'https://www.w3.org/2018/credentials/v1',
      'https://identity.foundation/.well-known/did-configuration/v1',
    ];
    data.id = this.id;
    data.verificationMethod = [this.verificationMethod];

    data.issuer = this.id;
    // data.issuanceDate =

    if (options?.service) {
      data.service = options.service.sort(this.ordered);
    }

    return data;
  }

  /** Generates an issuer based on the identity */
  public issuer(options: { privateKey: Uint8Array | string | any }): Issuer {
    return {
      did: this.id,
      signer: SchnorrSigner(options.privateKey),
      alg: 'SS256K',
    };
  }

  /** Generates a well known configuration for DID resolver host. */
  public async configurationVerifiableCredential(domain: string, issuer: any) {
    const date = new Date();
    const expiredate = new Date(
      new Date().setFullYear(date.getFullYear() + 100)
    );
    let expiredateNumber = Math.floor(expiredate.getTime() / 1000);

    // Due to issue with Microsoft middleware for JWT validation, we cannot go higher than this expiration date.
    // Source: https://stackoverflow.com/questions/43593074/jwt-validation-fails/46654832#46654832
    if (expiredateNumber > 2147483647) {
      expiredateNumber = 2147483647;
    }

    const currentDateNumber = Math.floor(date.getTime() / 1000);

    const vcPayload: JwtCredentialPayload = {
      // iss: this.id, // This is automatically added by the library and not needed.
      exp: expiredateNumber,
      iat: currentDateNumber,
      nbf: currentDateNumber,
      sub: this.id,
      vc: {
        '@context': [
          'https://www.w3.org/2018/credentials/v1',
          'https://identity.foundation/.well-known/did-configuration/v1',
        ],
        type: ['VerifiableCredential', 'DomainLinkageCredential'],
        credentialSubject: {
          id: this.id,
          origin: domain,
        },
        //"expirationDate": expiredate.toISOString(),
        //"issuanceDate": date.toISOString(),
        //"issuer": this.id,
      },
    };

    const vcJwt = await createVerifiableCredentialJwt(vcPayload, issuer);

    return vcJwt;
  }

  /** Generates a well known configuration for DID resolver host. */
  public async configuration(domain: string, issuer: any) {
    var vc = await this.configurationVerifiableCredential(domain, issuer);

    var vcNormalized = normalizeCredential(vc, true);
    // var vcDecoded = decodeJWT(vc); // This is wrong and does not convert the JWT-VC according to the "vc-data-model" specification. Use normalize from "did-jwt-vc" library.

    const data: any = {};
    data['@context'] =
      'https://identity.foundation/.well-known/did-configuration/v1';

    data.linked_dids = [vcNormalized, vc];

    return data;
  }
}

export interface Identity {}

// JWK example:
// const { publicKeyJwk, privateKeyJwk } = await keyPair.toJsonWebKeyPair(true);

// return {
//    publicJwk: publicKeyJwk,
//    privateJwk: privateKeyJwk
// };
