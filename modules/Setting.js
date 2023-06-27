const path = require('path');
const fs = require('fs');
const dataPath = require('./DataPath');

function parseDataFile(filePath, defaults) {
  try {
    return JSON.parse(fs.readFileSync(filePath).toString());
  } catch (error) {
    return defaults;
  }
}

class Setting {
  constructor(opts) {
    this.path = path.join(dataPath.root, 'setting.json');
    this.data = parseDataFile(this.path, opts.defaults);
  }

  get(key, fallback) {
    return this.data[key] ?? fallback;
  }

  set(key, val) {
    this.data[key] = val;
    fs.writeFileSync(this.path, JSON.stringify(this.data));
  }
}

module.exports = new Setting({ defaults: { bounds: {} } });
