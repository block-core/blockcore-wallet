// export interface VerificationMethod {
//     id: string;
//     type: string;
//     controller: string;
//     publicKeyMultibase: string;
//   }

//   export interface VerificationMethodWithPrivateKey extends VerificationMethod {
//     privateKeyMultibase: string;
//   }

export interface KeyPair {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
  identifier: string;
}
