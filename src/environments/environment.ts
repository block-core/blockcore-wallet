// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  version: "0.0.14",
  features: ['wallet', 'identity', 'collectible', 'vault'],
  releaseUrl: 'https://github.com/block-core/blockcore-extension/releases',
  sourceUrl: 'https://github.com/block-core/blockcore-extension',
  instance: 'blockcore',
  instanceName: 'Blockcore',
  instanceUrl: 'https://blockcore.net/',
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
