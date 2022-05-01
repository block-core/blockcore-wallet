// import { CapacitorConfig } from '@capacitor/cli';

// const config: CapacitorConfig = {
//   appId: 'net.blockcore.wallet',
//   appName: 'blockcore-wallet',
//   webDir: 'dist/extension',
//   bundledWebRuntime: false
// };

// export default config;


import { ElectronCapacitorConfig } from '@capacitor-community/electron';

const config: ElectronCapacitorConfig = {
  appId: 'net.blockcore.wallet',
  appName: 'blockcore-wallet',
  webDir: 'dist/extension',
  bundledWebRuntime: false,
  electron: {
    // Custom scheme for your app to be served on in the electron window.
    customUrlScheme: 'capacitor-electron',
    // Switch on/off a tray icon and menu, which is customizable in the app.
    trayIconAndMenuEnabled: false,
    // Switch on/off whether or not a splashscreen will be used.
    splashScreenEnabled: false,
    // Custom image name in the electron/assets folder to use as splash image (.gif included)
    splashScreenImageName: 'splash.png',
    // Switch on/off if the main window should be hidden until brought to the front by the tray menu, etc.
    hideMainWindowOnLaunch: false,
    // Switch on/off whether or not to use deeplinking in your app.
    deepLinkingEnabled: false,
    // Custom protocol to be used with deeplinking for your app.
    deepLinkingCustomProtocol: 'mycapacitorapp',
  },
};

export default config;