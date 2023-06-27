import { toApp } from '@/utils/toApp';
import { makeIndex } from '@/utils/serializeUtils';

const importValues = (org, imported) => {
  for (const row of imported) {
    const ex = org.find(ex => ex.path === row.path);
    if (ex) ex.value = row.value;
    else org.push({ key: row.path, ...row });
  }
};

export default {
  methods: {
    async importExcel() {
      const imported = await toApp('importExcel', this.langs);
      if (!imported) return;
      if (this.chapters) {
        for (const chapter in imported) {
          if (!this.full[chapter]) this.full[chapter] = [];
          if (!this.chapters.includes(chapter)) this.chapters.push(chapter);
          importValues(this.full[chapter], imported[chapter]);
        }
      } else {
        importValues(this.full, imported[this.currentRepo.name]);
      }
      if (this.currentRepo.type === 'json') {
        await this.saveJsonData();
      } else {
        await this.saveJsData();
        if (this.currentRepo.type === 'bi18n') {
          await toApp('saveJs', { jsString: makeIndex(this.chapters), file: 'index' });
          await this.getJsData();
        }
      }
      this.$unblock();
      this.$toast('반영되었습니다');
    }
  }
};