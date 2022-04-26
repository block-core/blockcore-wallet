import { ElectronCapacitorConfig } from '@capacitor-community/electron';

const config: ElectronCapacitorConfig  = {
  appId: 'net.blockcore.coinvault',
  appName: 'Blockcore Wallet',
  webDir: 'dist/extension',
  bundledWebRuntime: false,
  electron: {
    trayIconAndMenuEnabled: true,
    splashScreenEnabled: true,
    splashScreenImageName: 'splash.gif',
    hideMainWindowOnLaunch: false,
    deepLinkingEnabled: false,
    deepLinkingCustomProtocol: 'mycapacitorapp',
  },
};

export default config;
