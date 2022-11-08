/*
 * In development mode, to ignore zone related error stack frames such as
 * `zone.run`, `zoneDelegate.invokeTask` for easier debugging, you can
 * import the following file, but please comment it out in production mode
 * because it will have performance impact when throw error
 */
import 'zone.js/dist/zone-error'; // Included with Angular CLI.

import { IEnvironment } from "../shared/interfaces";

export const environment: IEnvironment = {
  production: true,
  enableDebugTools: false,
  logLevel: 'info',
  features: ['wallet', 'identity', 'collectible', 'vault', 'handler:pay', 'handler:bitcoin', 'handler:vault', 'handler:sid', 'handler:did', 'handler:nostr'],
  releaseUrl: 'https://github.com/block-core/blockcore-wallet/releases',
  sourceUrl: 'https://github.com/block-core/blockcore-wallet',
  instance: 'blockcore',
  instanceName: 'Blockcore Wallet',
  instanceUrl: 'https://www.blockcore.net/',
  instanceExplorerUrl: 'https://explorer.blockcore.net',
  networks: [] as string[] // Returns all
  // networks: ['STRAX', 'CRS', 'TSTRAX', 'TCRS', 'IMPLX', 'MOL', 'CITY', 'CY', 'RSC', 'SBC', 'X42']
};
