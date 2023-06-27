const { exec } = require('child_process');
const dataPath = require('./DataPath');
const fs = require('fs');
const keygen = require('ssh-keygen-lite');
const path = require('path');

class GitRepo {
  repo;
  callback;
  windowOut;

  constructor(repo, callback, windowOut) {
    this.repo = repo;
    this.callback = callback;
    this.windowOut = windowOut;
  }

  setRepo(repo) {
    this.repo = repo;
  }

  get repoPath() {
    return dataPath.getRepoPath(this.repo.name);
  }

  get sshOption() {
    return `-c core.sshCommand="ssh -F none -o StrictHostKeyChecking=no -i '${dataPath.getKeyPath(this.repo.name)}'"`;
  }

  getPublicKey() {
    return new Promise(resolve => {
      keygen({
        comment: this.repo.name + '@BI18N',
        size: 4096,
        format: 'PEM'
      }, (err, out) => {
        fs.writeFileSync(dataPath.getKeyPath(this.repo.name), out.key, { mode: 0o600 });
        resolve(out.pubKey);
      });
    });
  }

  /**
   * @param {string} command
   * @returns {Promise<string>}
   */
  exec(command) {
    return new Promise((resolve, reject) => {
      exec(`git ${this.sshOption} ${command}`, { cwd: this.repoPath }, (e, i, o) => {
        this.windowOut('------------------------------------------');
        if (e) {
          const out = o.toString('utf-8');
          const code = out.includes("'git'") ? 'NO_GIT'
            : out.includes('command not found') ? 'NO_GIT'
            : out.includes('not a git repository') ? 'NO_REPOSITORY'
            : out.includes('did not match any file(s) known to git') ? 'NO_BRANCH'
            : out.includes('CommandLineTools') ? 'MAC_TOOLS'
            : out.includes('Permission denied (publickey)') ? 'PUBLIC_KEY_EXPIRED'
            : out.includes('would be overwritten') ? 'CONFLICT'
            : out.includes('Resolve all conflicts') ? 'CONFLICT'
            : out.includes('You are not currently on a branch') ? 'CONFLICT'
            : out.includes('You have unstaged changes') ? 'IGNORE'
            : out.includes('middle of another rebase') ? 'CONFLICT'
            : out.includes('rejected') ? 'CONFLICT'
            : out;
          this.windowOut('git ' + command + ' error =>');
          this.windowOut(out);
          reject(code);
        } else {
          this.windowOut('git ' + command + ' success =>');
          const out = i.toString('utf-8');
          this.windowOut(out);
          resolve(out);
        }
      });
    });
  }

  async getBranch() {
    const out = await this.exec('branch');
    return out.match(/\* (\w+)/)?.[1];
  }

  async _prepare() {
    const branch = await this.getBranch();
    if (branch !== this.repo.branch) await this.exec(`checkout ${this.repo.branch}`);
    await this.exec('pull');
  }

  prepare() {
    return new Promise((resolve, reject) => {
      this.callback('동기화 중입니다', true);
      this._prepare().then(() => {
        this.callback();
        resolve();
      }).catch(e => {
        if (e === 'NO_REPOSITORY') {
          this.callback('원격 저장소 내용을 복제중입니다', true);
          this.exec(`clone ${this.repo.sshUrl} .`).then(() => {
            this._prepare().then(() => {
              this.callback();
              resolve(false);
            });
          }).catch(() => {
            reject('UNAUTHENTICATED');
            this.callback();
          });
          return;
        }
        reject(e);
        this.callback();
      });
    });
  }

  getChapters() {
    return new Promise(resolve => {
      fs.readdir(path.join(dataPath.getRepoPath(this.repo.name), this.repo.path), null, (e, files) => {
        if (e) this.callback('경로가 유효하지 않습니다');
        else {
          resolve(files.filter(n => n !== 'index.js').map(n => n.replace(/\.js/, '')).sort((a,b) => a === 'common' ? -1 : b === 'common' ? 1 : 0));
        }
      });
    });
  }

  getFullData() {
    this.removeCache();
    return require(path.join(dataPath.getRepoPath(this.repo.name), this.repo.path, 'index.js'));
  }

  appendSepData(result, repoPath) {
    return new Promise(resolve => {
      fs.readdir(path.join(dataPath.getRepoPath(this.repo.name), repoPath), null, (e, files) => {
        if (e) this.callback('경로가 유효하지 않습니다');
        else {
          const filter = this.repo.filter ? this.repo.filter.split(',') : null;
          files.map(n => n.replace(/\.js/, '')).filter(n => n !== 'index' && (!filter || filter.includes(n))).sort((a,b) => a === 'common' ? -1 : b === 'common' ? 1 : 0).forEach(file => {
            if (!result[file]) result[file] = require(path.join(dataPath.getRepoPath(this.repo.name), repoPath, file + '.js'))
          })
          resolve();
        }
      });
    })
  }

  async getSepData() {
    this.removeCache();
    const result = {};
    await this.appendSepData(result, this.repo.path);
    if (this.repo.path2) await this.appendSepData(result, this.repo.path2);
    return result;
  }

  getJsonData(langs) {
    this.removeCache();
    const result = {};
    langs.forEach(lang => {
      const f = path.join(dataPath.getRepoPath(this.repo.name), this.repo.path, lang + '.json');
      result[lang] = fs.existsSync(f) ? require(f) : {};
    });
    return result;
  }

  saveJson(jsonString, file) {
    return new Promise(resolve => {
      fs.writeFile(path.join(dataPath.getRepoPath(this.repo.name), this.repo.path, file + '.json'), jsonString, resolve);
    });
  }

  async saveJsonData(data) {
    const langs = Object.keys(data);
    for (const lang of langs) {
      await this.saveJson(JSON.stringify(data[lang], null, 2), lang);
    }
  }

  saveJs(jsString, file) {
    return new Promise(resolve => {
      if (this.repo.path2 && !fs.existsSync(path.join(dataPath.getRepoPath(this.repo.name), this.repo.path, file + '.js'))) {
        fs.writeFile(path.join(dataPath.getRepoPath(this.repo.name), this.repo.path2, file + '.js'), jsString, resolve);
      } else {
        fs.writeFile(path.join(dataPath.getRepoPath(this.repo.name), this.repo.path, file + '.js'), jsString, resolve);
      }
    });
  }

  deleteJs(file) {
    return new Promise(resolve => {
      fs.rm(path.join(dataPath.getRepoPath(this.repo.name), this.repo.path, file + '.js'), resolve);
    });
  }

  renameJs(org, change) {
    return new Promise(resolve => {
      fs.rename(path.join(dataPath.getRepoPath(this.repo.name), this.repo.path, org + '.js'), path.join(dataPath.getRepoPath(this.repo.name), this.repo.path, change + '.js'), resolve);
    });
  }

  removeCachePath(repoPath) {
    fs.readdir(path.join(dataPath.getRepoPath(this.repo.name), repoPath), null, (e, files) => {
      if (e) this.callback('경로가 유효하지 않습니다');
      else {
        files.forEach(f => {
          delete require.cache[require.resolve(path.join(dataPath.getRepoPath(this.repo.name), repoPath, f))];
        });
      }
    });
  }

  removeCache() {
    this.removeCachePath(this.repo.path);
    if (this.repo.path2) this.removeCachePath(this.repo.path2);
  }

  async reset() {
    await this.exec(`reset --hard origin/${this.repo.branch}`);
    await this.exec('clean -fd');
  }

  async commit() {
    await this.exec('add .');
    await this.exec('commit -m "update by ' + this.repo.name + '@BI18N"');
    await this.exec('push');
  }

  remove() {
    this.clear();
    fs.rmSync(dataPath.getKeyPath(this.repo.name));
  }

  clear() {
    fs.rmSync(dataPath.getRepoPath(this.repo.name), { recursive: true, force: true });
  }

  async gitUser() {
    return await this.exec('config user.email');
  }

  async gitUserSet(user) {
    await this.exec('config user.name '+ user.name);
    await this.exec('config user.email '+ user.email);
  }
}

module.exports = GitRepo;