import { ipcRenderer } from "electron";
import { autoUpdater } from "electron-updater";
import env from "env";

ipcRenderer.on("app-path", (event, appDirPath) => {
  // const appDir = jetpack.cwd(appDirPath);
  // const manifest = appDir.read("package.json", "json");
  // document.querySelector("#author").innerHTML = manifest.author;
});

ipcRenderer.send("need-app-path");

document.querySelector(".electron-website-link").addEventListener(
  "click",
  event => {
    ipcRenderer.send("open-external-link", event.target.href);
    event.preventDefault();
  },
  false
);
