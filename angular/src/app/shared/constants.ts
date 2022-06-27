export const MILLISECOND = 1;
export const SECOND = MILLISECOND * 1000;
export const MINUTE = SECOND * 60;
export const HOUR = MINUTE * 60;
export const DAY = HOUR * 24;

export const NETWORK_IDENTITY = 616;
export const NETWORK_NOSTR = 1237;
export const NETWORK_CITY = 1926;
export const NETWORK_BTC = 0;

export const VAULT_URL = 'https://vault.blockcore.net';
export const INDEXER_URL = 'https://{id}.indexer.blockcore.net';
export const AUTO_TIMEOUT = 15; // 15 minutes

export const SATOSHI_FACTOR = 100000000;
export const DECIMAL_POINTS = 8;
export const FEE_FACTOR = 100000;

export const STATUS_INTERVAL = SECOND * 45; // 45 seconds.

export enum Actions {
  'publicKey',
  'identity',
  'sign',
  'encrypt',
  'decrypt',
};

export const PERMISSIONS: any = ['publicKey', 'identity', 'sign', 'encrypt', 'decrypt'];

// {
//   publicKey: 'publicKey',
//   identity: 'identity',
//   sign: 'sign',
//   encrypt: 100,
//   decrypt: 200,
// };
