export interface Credential {
  credentialId: Uint8Array;
  publicKey: Uint8Array;
}

export interface User {
  id?: string;
  email: string;
  password: string;
  // TODO
  credentials: Credential[];
}
