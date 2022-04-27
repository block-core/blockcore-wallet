import { ElectronCapacitorConfig } from '@capacitor-community/electron';

const config: ElectronCapacitorConfig  = {
  appId: 'net.blockcore.coinvault',
  appName: 'Blockcore Wallet',
  webDir: 'dist/extension',
  bundledWebRuntime: false,
  electron: {
    customUrlScheme: 'blockcore',
    trayIconAndMenuEnabled: true,
    splashScreenEnabled: true,
    splashScreenImageName: 'splash.png',
    hideMainWindowOnLaunch: false,
    deepLinkingEnabled: true,
    deepLinkingCustomProtocol: 'blockcore'
  },
};

export default config;
