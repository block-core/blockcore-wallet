export interface DecodedAttestion {
  attStmt: {
    alg: number;
    sig: Uint8Array;
  };
  authData: Uint8Array;
  fmt: string;
}
