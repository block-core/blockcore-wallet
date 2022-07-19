export interface Credential {
  credentialId: Uint8Array;
  publicKey: Uint8Array;
}

export interface User {
  id?: string;
  username: string;
  password: string;
  // TODO
  credentials: Credential[];
}
