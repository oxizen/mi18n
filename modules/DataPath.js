const path = require('path');
const electron = require('electron');
const fs = require('fs');

class DataPath {
  get root() {
    return (electron.app || electron.remote.app).getPath('userData');
  }

  getFolder(type) {
    const folder = path.join(this.root, type);
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder);
    }
    return folder;
  }

  getKeyPath(site) {
    return path.join(this.getFolder('keys'), site);
  }

  getRepoPath(site) {
    const repo = path.join(this.getFolder('repos'), site);
    if (!fs.existsSync(repo)) {
      fs.mkdirSync(repo);
    }
    return repo;
  }
}

module.exports = new DataPath();