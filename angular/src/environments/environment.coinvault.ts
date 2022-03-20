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
  version: "0.0.15",
  features: ['wallet', 'collectible', 'handler:sid'],
  releaseUrl: 'https://github.com/CoinVault/coinvault-extension/releases',
  sourceUrl: 'https://github.com/CoinVault/coinvault-extension',
  instance: 'coinvault',
  instanceName: 'CoinVault',
  instanceUrl: 'https://www.coinvault.io',
  instanceExplorerUrl: 'https://explorer.coinvault.io',
  networks: ['STRAX', 'CRS', 'TSTRAX', 'TCRS']
};
