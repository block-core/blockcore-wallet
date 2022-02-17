export const environment = {
  production: true,
  version: "0.0.14",
  features: ['wallet', 'identity', 'collectible', 'vault', 'handler:bitcoin', 'handler:vault', 'handler:sid', 'handler:did', 'handler:nostr'],
  releaseUrl: 'https://github.com/block-core/blockcore-extension/releases',
  sourceUrl: 'https://github.com/block-core/blockcore-extension',
  instance: 'blockcore',
  instanceName: 'Blockcore',
  instanceUrl: 'https://blockcore.net/',
  instanceExplorerUrl: 'https://explorer.blockcore.net',
  networks: [] as string[] // Returns all
};
