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
  features: ['wallet', 'identity', 'handler:pay', 'handler:did', 'handler:nostr'],
  releaseUrl: 'https://github.com/block-core/blockcore-wallet/releases',
  sourceUrl: 'https://github.com/block-core/blockcore-wallet',
  instance: 'freecity',
  instanceName: 'Free City Wallet',
  instanceUrl: 'https://www.freeplatform.city/',
  instanceExplorerUrl: 'https://explorer.blockcore.net',
  networks: ['CITY', 'IDENTITY', 'NOSTR', 'JWK', 'KEY', 'BTC']
};
