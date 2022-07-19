export interface DecodedAttestionObj {
  attStmt: {
    alg: number;
    sig: Uint8Array;
  };
  authData: Uint8Array;
  fmt: string;
}
