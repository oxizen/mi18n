import _set from 'lodash/set';

export const makeJs = flattened => {
  const root = {};
  flattened.forEach(it => _set(root, it.path, it.value));
  let result = 'module.exports = {\n';
  const indentStep = '  ';
  let indent = '  ';
  if (!root) return result;
  let prev = null, i = 0, obj = root, keys = Object.keys(obj);
  if (keys.length) {
    while (i === 0 || i < keys.length) {
      const k = keys[i];
      const t = k?.trim();
      const key = /^\d/.test(t) || /\W/.test(t) ? `'${t}'` : t;
      const value = obj[k];
      if (value && typeof value === 'object') {
        result += indent + key + ': {\n';
        indent += indentStep;
        prev = [i, obj, keys, prev];
        obj = value;
        keys = Object.keys(obj);
        i = 0;
      } else {
        if (value) {
          const s = value.toString();
          const q = s.includes('\n') || s.includes("'") ? '`' : `'`;
          result += indent + key + ': ' + q + value + q + ',\n';
        }
        while (i + 1 >= keys.length && prev) {
          [i, obj, keys, prev] = prev;
          indent = indent.substring(0, indent.length - 2);
          result += indent + '},\n'
        }
        i += 1;
      }
    }
  }
  result += '};\n';
  return result;
};

export const makeIndex = chapters => {
  let result = '';
  chapters.forEach(chapter => {
    result += `const ${chapter} = require('./${chapter}');\n`;
  });
  result += '\n';
  result += 'module.exports = {\n';
  chapters.forEach(chapter => {
    result += '  ';
    if (chapter === 'common') result += '...';
    result += chapter + ',\n';
  });
  result += '};\n';
  return result;
}

export const flatten = (root, langs) => {
  const result = [];
  const stack = [];
  if (!root) return result;
  let prev = null, i = 0, obj = root, keys = Object.keys(obj);
  while (i === 0 || i < keys.length) {
    const key = keys[i];
    const value = obj[key];
    if (value && typeof value === 'object') {
      const vk = Object.keys(value);
      if (vk.some(k => langs.includes(k)) || vk.length === 0) {
        const path = [...stack, key].join('.');
        result.push({ path, key: path, value, up: false });
        while (i + 1 >= keys.length && prev) {
          [i, obj, keys, prev] = prev;
          stack.pop();
        }
        i += 1;
      } else {
        stack.push(key);
        prev = [i, obj, keys, prev];
        obj = value;
        keys = Object.keys(obj);
        i = 0;
      }
    } else {
      const path = [...stack, key].join('.');
      result.push({ path, key: path, up: false, value: { [langs[0]]: value } });
      while (i + 1 >= keys.length && prev) {
        [i, obj, keys, prev] = prev;
        stack.pop();
      }
      i += 1;
    }
  }
  return result;
};

export const flattenPlain = root => {
  const result = [];
  const stack = [];
  if (!root) return result;
  let prev = null, i = 0, obj = root, keys = Object.keys(obj);
  while (i === 0 || i < keys.length) {
    const key = keys[i];
    const value = obj[key];
    if (value && typeof value === 'object') {
      stack.push(key);
      prev = [i, obj, keys, prev];
      obj = value;
      keys = Object.keys(obj);
      i = 0;
    } else {
      const path = [...stack, key].join('.');
      if (value !== undefined) result.push({ path, value });
      while (i + 1 >= keys.length && prev) {
        [i, obj, keys, prev] = prev;
        stack.pop();
      }
      i += 1;
    }
  }
  return result;
}

export const mergeJsonData = (jsonData) => {
  const result = {};
  if (!jsonData) return result;
  const langs = Object.keys(jsonData);
  langs.forEach(lang => {
    flattenPlain(jsonData[lang]).forEach(it => _set(result, it.path+'.'+lang, it.value));
  });
  return result;
}