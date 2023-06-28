// import * as cbor from '@ipld/dag-cbor';
// import { CID } from 'multiformats/cid';
// import { sha256 } from 'multiformats/hashes/sha2';
// import { importer } from 'ipfs-unixfs-importer';
// import * as Secp256k1 from '@noble/secp256k1';

// // a map of all supported CID hashing algorithms. This map is used to select the appropriate hasher
// // when generating a CID to compare against a provided CID
// const hashers = {
//   [sha256.code]: sha256,
// };

// // a map of all support codecs.This map is used to select the appropriate codec
// // when generating a CID to compare against a provided CID
// const codecs = {
//   [cbor.code]: cbor,
// };

// export class Dwn {}

// /**
//  * generates a CID for the provided payload
//  * @param payload
//  * @param codecCode - the codec to use. Defaults to cbor
//  * @param multihashCode - the multihasher to use. Defaults to sha256
//  * @returns payload CID
//  * @throws {Error} codec is not supported
//  * @throws {Error} encoding fails
//  * @throws {Error} if hasher is not supported
//  */
// export async function generateCid(payload: any, codecCode = cbor.code, multihashCode = sha256.code): Promise<CID> {
//   const codec = codecs[codecCode];
//   if (!codec) {
//     throw new Error(`codec [${codecCode}] not supported`);
//   }

//   const hasher = hashers[multihashCode];
//   if (!hasher) {
//     throw new Error(`multihash code [${multihashCode}] not supported`);
//   }

//   const payloadBytes = codec.encode(payload);
//   const payloadHash = await hasher.digest(payloadBytes);

//   return await CID.createV1(codec.code, payloadHash);
// }

// export function parseCid(str: string): CID {
//   const cid = CID.parse(str).toV1();

//   const cod = codecs as any;
//   const has = hashers as any;

//   if (!cod[cid.code]) {
//     throw new Error(`codec [${cid.code}] not supported`);
//   }

//   if (!has[cid.multihash.code]) {
//     throw new Error(`multihash code [${cid.multihash.code}] not supported`);
//   }

//   return cid;
// }

// /**
//  * Compares two CIDs given in lexicographical order.
//  * @returns 1 if `a` is larger than `b`; -1 if `a` is smaller/older than `b`; 0 otherwise (same message)
//  */
// export function compareCids(a: CID, b: CID): number {
//   // the < and > operators compare strings in lexicographical order
//   if (a > b) {
//     return 1;
//   } else if (a < b) {
//     return -1;
//   } else {
//     return 0;
//   }
// }

// export function toBytes(data: any): Uint8Array {
//   const { encode } = new TextEncoder();

//   if (data instanceof Uint8Array) {
//     return data;
//   } else if (data instanceof ArrayBuffer) {
//     return new Uint8Array(data);
//   } else if (typeof data === 'object') {
//     const stringifiedData = JSON.stringify(data);
//     return encode(stringifiedData);
//   } else {
//     return encode(data.toString());
//   }
// }

// /**
//  * @returns V1 CID of the DAG comprised by chunking data into unixfs dag-pb encoded blocks
//  */
// export async function getDagCid(data: any): Promise<any> {
//   const dataBytes = toBytes(data);
//   const chunk = importer([{ content: dataBytes }], undefined, { onlyHash: true, cidVersion: 1 });
//   let root;

//   for await (root of chunk);

//   return root.cid;
// }

// import { base64url } from 'multiformats/bases/base64';

// const textEncoder = new TextEncoder();

// export function stringToBytes(content: string): Uint8Array {
//   const bytes = textEncoder.encode(content);
//   return bytes;
// }

// export function stringToBase64Url(content: string): string {
//   const bytes = textEncoder.encode(content);
//   const base64UrlString = base64url.baseEncode(bytes);
//   return base64UrlString;
// }

// export function base64urlToBytes(base64urlString: string): Uint8Array {
//   const content = base64url.baseDecode(base64urlString);
//   return content;
// }

// export function bytesToBase64Url(bytes: Uint8Array): string {
//   const base64UrlString = base64url.baseEncode(bytes);
//   return base64UrlString;
// }

// /**
//  * Class containing JWS related operations.
//  */
// export class Jws {
//   /**
//    * signs the provided message. Signed payload includes the CID of the message's descriptor by default
//    * along with any additional payload properties provided
//    * @param message - the message to sign
//    * @param signatureInput - the signature material to use (e.g. key and header data)
//    * @param payloadProperties - additional properties to include in the signed payload
//    * @returns General JWS signature
//    */
//   public static async sign(message: any, signatureInput: any, payloadProperties?: { [key: string]: CID }): Promise<any> {
//     const descriptorCid = await generateCid(message.descriptor);

//     const authPayload = { ...payloadProperties, descriptorCid: descriptorCid.toString() };
//     const authPayloadStr = JSON.stringify(authPayload);
//     const authPayloadBytes = new TextEncoder().encode(authPayloadStr);

//     const signer = await GeneralJwsSigner.create(authPayloadBytes, [signatureInput]);

//     return signer.getJws();
//   }
// }

// // export const signers: any = {
// //   secp256k1: secp256k1,
// // };

// export class GeneralJwsSigner {
//   private jws: any;

//   constructor(jws: any) {
//     this.jws = jws;
//   }

//   static async create(payload: Uint8Array, signatureInputs: any[] = []): Promise<GeneralJwsSigner> {
//     const jws: any = {
//       payload: bytesToBase64Url(payload),
//       signatures: [],
//     };

//     const signer = new GeneralJwsSigner(jws);

//     for (const signatureInput of signatureInputs) {
//       await signer.addSignature(signatureInput);
//     }

//     return signer;
//   }

//   async addSignature(signatureInput: any): Promise<void> {
//     const { jwkPrivate, protectedHeader } = signatureInput;
//     const signer = secp256k1;

//     if (!signer) {
//       throw new Error(`unsupported crv. crv must be one of`);
//     }

//     const protectedHeaderString = JSON.stringify(protectedHeader);
//     const protectedHeaderBase64UrlString = stringToBase64Url(protectedHeaderString);

//     const signingInputString = `${protectedHeaderBase64UrlString}.${this.jws.payload}`;
//     const signingInputBytes = stringToBytes(signingInputString);

//     const signatureBytes = await signer.sign(signingInputBytes, jwkPrivate);
//     const signature = bytesToBase64Url(signatureBytes);

//     this.jws.signatures.push({ protected: protectedHeaderBase64UrlString, signature });
//   }

//   getJws(): any {
//     return this.jws;
//   }
// }

// export const secp256k1: any = {
//   sign: async (content: Uint8Array, privateJwk: any): Promise<Uint8Array> => {

//     // the underlying lib expects us to hash the content ourselves:
//     // https://github.com/paulmillr/noble-secp256k1/blob/97aa518b9c12563544ea87eba471b32ecf179916/index.ts#L1160
//     const hashedContent = await sha256.encode(content);
//     const privateKeyBytes = base64urlToBytes(privateJwk.d);

//     return await Secp256k1.sign(hashedContent, privateKeyBytes, { der: false });
//   },

//   verify: async (content: Uint8Array, signature: Uint8Array, publicJwk: any): Promise<boolean> => {

//     const xBytes = base64urlToBytes(publicJwk.x);
//     const yBytes = base64urlToBytes(publicJwk.y);

//     const publicKeyBytes = new Uint8Array(xBytes.length + yBytes.length + 1);

//     // create an uncompressed public key using the x and y values from the provided JWK.
//     // a leading byte of 0x04 indicates that the public key is uncompressed
//     // (e.g. x and y values are both present)
//     publicKeyBytes.set([0x04], 0);
//     publicKeyBytes.set(xBytes, 1);
//     publicKeyBytes.set(yBytes, xBytes.length + 1);

//     const hashedContent = await sha256.encode(content);

//     return Secp256k1.verify(signature, hashedContent, publicKeyBytes);
//   },

//   generateKeyPair: async (): Promise<{ publicJwk: any; privateJwk: any }> => {
//     const privateKeyBytes = Secp256k1.utils.randomPrivateKey();
//     const publicKeyBytes = await Secp256k1.getPublicKey(privateKeyBytes);

//     const d = bytesToBase64Url(privateKeyBytes);
//     const publicJwk: any = publicKeyToJwk(publicKeyBytes);
//     const privateJwk: any = { ...publicJwk, d };

//     return { publicJwk, privateJwk };
//   },

// //   publicKeyToJwk: async (publicKeyBytes: Uint8Array): Promise<any> => {
// //     return publicKeyToJwk(publicKeyBytes);
// //   },
// };

// function publicKeyToJwk(publicKeyBytes: Uint8Array): any {
//     // ensure public key is in uncompressed format so we can convert it into both x and y value
//     let uncompressedPublicKeyBytes;
//     if (publicKeyBytes.byteLength === 33) {
//       // this means given key is compressed
//       const publicKeyHex = Secp256k1.etc.bytesToHex(publicKeyBytes);
//       const curvePoints = Secp256k1.Point.fromHex(publicKeyHex);
//       uncompressedPublicKeyBytes = curvePoints.toRawBytes(false); // isCompressed = false
//     } else {
//       uncompressedPublicKeyBytes = publicKeyBytes;
//     }
  
//     // the first byte is a header that indicates whether the key is uncompressed (0x04 if uncompressed), we can safely ignore
//     // bytes 1 - 32 represent X
//     // bytes 33 - 64 represent Y
  
//     // skip the first byte because it's used as a header to indicate whether the key is uncompressed
//     const x = bytesToBase64Url(uncompressedPublicKeyBytes.subarray(1, 33));
//     const y = bytesToBase64Url(uncompressedPublicKeyBytes.subarray(33, 65));
  
//     const publicJwk: any = {
//       alg : 'ES256K',
//       kty : 'EC',
//       crv : 'secp256k1',
//       x,
//       y
//     };
  
//     return publicJwk;
//   }