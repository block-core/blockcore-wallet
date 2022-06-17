import * as secp from '@noble/secp256k1';
import { Signer } from 'did-jwt';

/**
 *  Creates a configured signer function for signing data using the SS256K (ES256K) algorithm and Schnorr signatures.
 *
 *  The signing function itself takes the data as a `Uint8Array` or `string` and returns a `base64Url`-encoded signature
 *
 *  @example
 *  ```typescript
 *  const sign: Signer = SchorrSigner(process.env.PRIVATE_KEY)
 *  const signature: string = await sign(data)
 *  ```
 *
 *  This signer is suppose to be used with the "did-jwt" library and implementats interface similar to existing signers:
 *  https://github.com/decentralized-identity/did-jwt/tree/master/src/signers
 *
 *  @param    {String}    privateKey   a private key as `Uint8Array`
 *  @param    {Boolean}   recoverable  an optional flag to add the recovery param to the generated signatures
 *  @return   {Function}               a configured signer function `(data: string | Uint8Array): Promise<string>`
 */
export function SchnorrSigner(privateKey: Uint8Array): Signer {
  const privateKeyBytes: Uint8Array = privateKey;

  if (privateKeyBytes.length !== 32) {
    throw new Error(`bad_key: Invalid private key format. Expecting 32 bytes, but got ${privateKeyBytes.length}`);
  }

  return async (data: string | Uint8Array): Promise<string> => {
    const dataBytes: Uint8Array = typeof data === 'string' ? new Uint8Array(Buffer.from(data)) : data;
    const messageHash = await secp.utils.sha256(dataBytes);
    const signature = await secp.schnorr.sign(messageHash, privateKey);
    return secp.utils.bytesToHex(signature);
  };
}
