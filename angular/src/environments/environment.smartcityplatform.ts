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
  features: ['wallet', 'identity', 'collectible', 'vault', 'inbox', 'handler:vault', 'handler:did'],
  releaseUrl: 'https://github.com/CityChainFoundation/smart-city-platform/releases',
  sourceUrl: 'https://github.com/CityChainFoundation/smart-city-platform',
  instance: 'smartcityplatform',
  instanceName: 'Smart City Platform',
  instanceUrl: 'https://www.city-chain.org/',
  instanceExplorerUrl: 'https://explorer.city-chain.org',
  networks: ['CITY', 'IDENTITY', 'NOSTR']
};
