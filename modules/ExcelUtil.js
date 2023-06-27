const { Workbook } = require('exceljs');
const columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
const addRowsToSheet = (sheet, list, langs) => {
  sheet.columns = [
    {
      header: 'Key', width: 60,
      style: {
        alignment: { vertical: 'middle' },
      }
    },
    ...langs.map(lang => ({
      header: lang,
      width: 120,
      style: {
        alignment: { wrapText: true }
      }
    }))
  ];

  for (const row of list) {
    const line = [row.path];
    for (const lang of langs) {
      line.push(row.value[lang] ?? '');
    }
    sheet.addRow(line);
  }
  sheet.getRow(0).height = 20;
  sheet.addConditionalFormatting({
    ref: `A1:${columns[langs.length]}1`,
    rules: [
      {
        type: 'expression',
        formulae: ['1=1'],
        style: {
          fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFAAAAAA' } },
          alignment: { horizontal: 'center' },
          font: { size: 14, color: { argb: 'FFFFFFFF' }},
        },
      }
    ]
  });
};


const ExcelUtil = {
  saveXlsx: async (data, filePath, langs, name) => {
    const workbook = new Workbook();
    if (Array.isArray(data)) {
      const sheet = workbook.addWorksheet(name);
      addRowsToSheet(sheet, data, langs);
    } else {
      const chapters = Object.keys(data);
      for (const chapter of chapters) {
        if (!data[chapter].length) continue;
        const sheet = workbook.addWorksheet(chapter);
        addRowsToSheet(sheet, data[chapter], langs);
      }
    }
    await workbook.xlsx.writeFile(filePath);
  },
  parseXlsx: async (filePath, allowLangs) => {
    const workbook = new Workbook();
    await workbook.xlsx.readFile(filePath);
    const result = {};
    for (const sheet of workbook.worksheets) {
      const keyIndex = sheet.getRow(1).values.findIndex(l => l?.toLowerCase() === 'key');
      if (keyIndex === -1) continue;
      const list = [];
      const table = sheet.getSheetValues().slice(2);
      const langs = sheet.getRow(1).values.map(lang => allowLangs.includes(lang) ? lang : null);
      for (const rowValue of table) {
        if (!rowValue || !rowValue[keyIndex]) continue;
        const row = { path: rowValue[keyIndex], value: {} };
        for (let i = 0; i < rowValue.length; ++i) {
          if (!rowValue[i]) continue;
          if (typeof rowValue[i] === 'object') rowValue[i] = rowValue[i].richText?.map(o => o.text).join('');
          if (langs[i] && rowValue[i]) row.value[langs[i]] = rowValue[i];
        }
        list.push(row);
      }
      result[sheet.name] = list;
    }
    return result;
  }
};

module.exports = ExcelUtil;