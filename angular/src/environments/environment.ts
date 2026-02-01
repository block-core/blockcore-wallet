/*
 * In development mode, to ignore zone related error stack frames such as
 * `zone.run`, `zoneDelegate.invokeTask` for easier debugging, you can
 * import the following file, but please comment it out in production mode
 * because it will have performance impact when throw error
 */
import 'zone.js/dist/zone-error'; // Included with Angular CLI.

// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import { IEnvironment } from "../shared/interfaces";

export const environment: IEnvironment = {
  production: false,
  enableDebugTools: true,
  logLevel: 'debug',
  features: ['wallet', 'identity', 'vault', 'handler:pay', 'handler:bitcoin', 'handler:vault', 'handler:sid', 'handler:did', 'handler:nostr'],
  releaseUrl: 'https://github.com/block-core/blockcore-wallet/releases',
  sourceUrl: 'https://github.com/block-core/blockcore-wallet',
  instance: 'blockcore',
  instanceName: 'Blockcore Wallet',
  instanceUrl: 'https://www.blockcore.net/',
  instanceExplorerUrl: 'https://explorer.blockcore.net',
  networks: [] as string[] // Returns all
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
