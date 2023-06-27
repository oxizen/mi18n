const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('appInterface', {
  invoke: (command, payload) => ipcRenderer.invoke(command, payload)
});