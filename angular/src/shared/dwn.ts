import * as cbor from '@ipld/dag-cbor';
import { CID } from 'multiformats/cid';
import { sha256 } from 'multiformats/hashes/sha2';
import { importer } from 'ipfs-unixfs-importer';

// a map of all supported CID hashing algorithms. This map is used to select the appropriate hasher
// when generating a CID to compare against a provided CID
const hashers = {
  [sha256.code]: sha256,
};

// a map of all support codecs.This map is used to select the appropriate codec
// when generating a CID to compare against a provided CID
const codecs = {
  [cbor.code]: cbor,
};

export class Dwn {



}

/**
 * generates a CID for the provided payload
 * @param payload
 * @param codecCode - the codec to use. Defaults to cbor
 * @param multihashCode - the multihasher to use. Defaults to sha256
 * @returns payload CID
 * @throws {Error} codec is not supported
 * @throws {Error} encoding fails
 * @throws {Error} if hasher is not supported
 */
export async function generateCid(payload: any, codecCode = cbor.code, multihashCode = sha256.code): Promise<CID> {
  const codec = codecs[codecCode];
  if (!codec) {
    throw new Error(`codec [${codecCode}] not supported`);
  }

  const hasher = hashers[multihashCode];
  if (!hasher) {
    throw new Error(`multihash code [${multihashCode}] not supported`);
  }

  const payloadBytes = codec.encode(payload);
  const payloadHash = await hasher.digest(payloadBytes);

  return await CID.createV1(codec.code, payloadHash);
}

export function parseCid(str: string): CID {
  const cid = CID.parse(str).toV1();

  const cod = codecs as any;
  const has = hashers as any;

  if (!cod[cid.code]) {
    throw new Error(`codec [${cid.code}] not supported`);
  }

  if (!has[cid.multihash.code]) {
    throw new Error(`multihash code [${cid.multihash.code}] not supported`);
  }

  return cid;
}

/**
 * Compares two CIDs given in lexicographical order.
 * @returns 1 if `a` is larger than `b`; -1 if `a` is smaller/older than `b`; 0 otherwise (same message)
 */
export function compareCids(a: CID, b: CID): number {
  // the < and > operators compare strings in lexicographical order
  if (a > b) {
    return 1;
  } else if (a < b) {
    return -1;
  } else {
    return 0;
  }
}

export function toBytes(data: any): Uint8Array {
    const { encode } = new TextEncoder();
  
    if (data instanceof Uint8Array) {
      return data;
    } else if (data instanceof ArrayBuffer) {
      return new Uint8Array(data);
    } else if (typeof data === 'object') {
      const stringifiedData = JSON.stringify(data);
      return encode(stringifiedData);
    } else {
      return encode(data.toString());
    }
  }

/**
 * @returns V1 CID of the DAG comprised by chunking data into unixfs dag-pb encoded blocks
 */
 export async function getDagCid(data: any): Promise<any> {
    const dataBytes = toBytes(data);
    const chunk = importer([{ content: dataBytes }], undefined, { onlyHash: true, cidVersion: 1 });
    let root;
  
    for await (root of chunk);
  
    return root.cid;
  }


import { base64url } from 'multiformats/bases/base64';

const textEncoder = new TextEncoder();

export function stringToBytes(content: string): Uint8Array {
  const bytes = textEncoder.encode(content);
  return bytes;
}

export function stringToBase64Url(content: string): string {
  const bytes = textEncoder.encode(content);
  const base64UrlString = base64url.baseEncode(bytes);
  return base64UrlString;
}

export function base64urlToBytes(base64urlString: string): Uint8Array {
  const content = base64url.baseDecode(base64urlString);
  return content;
}

export function bytesToBase64Url(bytes: Uint8Array): string {
  const base64UrlString = base64url.baseEncode(bytes);
  return base64UrlString;
}
