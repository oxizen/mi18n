const setting = require('./modules/Setting');
const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const GitRepo = require('./modules/GitRepo');
const path = require('path');
const os = require('os');
const ExcelUtil = require('./modules/ExcelUtil');
let mainWindow;
/** @type {GitRepo} */
let git;
// single instance lock 요청
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  return;
}

const vueDevToolsPath = path.join(
  os.homedir(),
  '/Library/Application Support/Google/Chrome/Default/Extensions/nhdogjmejiglipccpnnnanhbledajbpd/6.1.4_5'
);

const toast = m => mainWindow && mainWindow.webContents.executeJavaScript(`app.$toast('${m}', { clear: true, type: 'fail' })`);
const blockMsg = m => mainWindow && mainWindow.webContents.executeJavaScript(`app.$block('${m}')`);
const conflict = () => mainWindow && mainWindow.webContents.executeJavaScript(`app._vnode.elm.__vue__._data.conflict = true`);
const unblock = () => mainWindow && mainWindow.webContents.executeJavaScript(`app.$unblock()`);
const windowOut = e => mainWindow && mainWindow.webContents.executeJavaScript('console.log(`'+e+'`)');

/** @returns { GitRepo } */
const getGit = repo => {
  if (!git) git = new GitRepo(repo, (m, b) => {
    if (b) {
      blockMsg(m);
    } else {
      unblock();
      if (m) toast(m);
    }
  }, windowOut);
  git.setRepo(repo);
  return git;
};

const fromWeb = {
  store: async payload => {
    setting.set('store', payload);
  },
  restore: async () => {
    await mainWindow.webContents.executeJavaScript(`app.$store.replaceState(${JSON.stringify(setting.get('store', {
      repos: [],
      currentRepo: null,
      changed: {}
    }))})`);
  },
  getPublicKey: async repo => {
    return await getGit(repo).getPublicKey();
  },
  prepare: async repo => {
    return await getGit(repo).prepare();
  },
  getChapters: async () => {
    return await git.getChapters();
  },
  getFullData: async () => {
    return await git.getFullData();
  },
  getSepData: async () => {
    return await git.getSepData();
  },
  saveJs: async ({ jsString, file }) => {
    return await git.saveJs(jsString, file);
  },
  deleteJs: async ({ file }) => {
    return await git.deleteJs(file);
  },
  renameJs: async ({ org, change }) => {
    return await git.renameJs(org, change);
  },
  resetToBase: async () => {
    return await git.reset();
  },
  commitAndPush: async () => {
    await git.prepare();
    return await git.commit();
  },
  getJsonData: async (langs) => {
    return git.getJsonData(langs);
  },
  saveJsonData: async (data) => {
    return await git.saveJsonData(data);
  },
  exportToExcel: async ({ data, name, langs }) => {
    const options = {
      title: 'Export to Excel',
      defaultPath: name + '.xlsx',
      buttonLabel: '저장',
      filters: [
        { name: 'XLSX', extensions: ['xlsx'] }
      ]
    };
    const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, options);
    if (!canceled) {
      await ExcelUtil.saveXlsx(data, filePath, langs, name);
      return true;
    } else {
      return false;
    }
  },
  importExcel: async langs => {
    const options = {
      title: 'Export to Excel',
      buttonLabel: '불러오기',
      filters: [
        { name: 'XLSX', extensions: ['xlsx'] }
      ]
    };
    const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, options)
    if (!canceled) {
      return await ExcelUtil.parseXlsx(filePaths[0], langs);
    } else {
      return false;
    }
  },
  removeRepo: async () => {
    git.remove();
  },
  clearRepo: async () => {
    git.clear();
  },
  checkGitUser: async () => {
    try {
      return await git.gitUser();
    } catch(e) {
      return null;
    }
  },
  gitUser: async user => {
    return await git.gitUserSet(user);
  },
  getGitStatus: async () => {
    return await git.exec('status')
  }
};

async function init() {
  const bounds = setting.get('bounds');
  const bound = bounds.main || { width: 1000, height: 700, x: 0, y: 0 };
  mainWindow = new BrowserWindow({ ...bound, webPreferences: { nativeWindowOpen: true, preload: path.join(__dirname, '/modules/preload.js') }, title: 'BI18N' });
  try {
    if (process.env.NODE_ENV === 'dev') await mainWindow.webContents.session.loadExtension(vueDevToolsPath, { allowFileAccess: true });
  } catch (e) {}
  mainWindow.addListener('closed', () => app.quit());
  mainWindow.setMenuBarVisibility(false);
  const saveBounds = () => {
    bounds.main = mainWindow.getBounds();
    setting.set('bounds', bounds);
  };
  mainWindow.addListener('resized', saveBounds);
  mainWindow.addListener('moved', saveBounds);
  for (const action in fromWeb) {
    ipcMain.handle(action, (e, payload) => fromWeb[action](payload)?.catch(e => {
      if (e === 'IGNORE') {
        // 무시
      } else if (e === 'NO_GIT') {
        toast('먼저 GIT 을 설치해주세요');
      } else if (e === 'MAC_TOOLS') {
        toast('CommandLineTools 설치가 필요합니다. (명령어 라인에서 xcode-select --install 를 실행해주세요)');
      } else if (e === 'UNAUTHENTICATED') {
        toast('Git URL이 올바르지 않거나 공개키가 등록되지 않았습니다');
      } else if (e === 'PUBLIC_KEY_EXPIRED') {
        toast('공개키가 유효하지 않습니다. 공개키를 등록해주세요.');
      } else if (e === 'NO_BRANCH') {
        toast('동기화를 실패했습니다 브랜치를 확인해주세요');
      } else if (e === 'CONFLICT') {
        toast('수정하고 커밋하지 않은 파일이 원격에서 갱신되었습니다. Reset to Base 한 뒤에 수정사항을 다시 반영해주세요.');
        conflict();
      } else {
        toast('오류가 발생했습니다.');
        windowOut(e);
      }
    }));
  }
  if (process.env.NODE_ENV === 'dev') {
    await mainWindow.loadURL('http://localhost:8080');
  } else {
    await mainWindow.loadFile('vue/dist/index.html');
  }
}

app.whenReady().then(init);

app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') app.quit();
});


