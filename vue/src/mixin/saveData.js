import { toApp } from '@/utils/toApp';
import { makeJs } from '@/utils/serializeUtils';
import _set from 'lodash/set';

export default {
  methods: {
    async saveJsData() {
      for (const chapter in this.full) {
        await toApp('saveJs', { jsString: makeJs(this.full[chapter]), file: chapter });
      }
      await this.getData();
    },
    async updateJsData(v) {
      await toApp('saveJs', { jsString: makeJs(v), file: this.chapter });
      this.$toast('저장되었습니다');
      await this.getData();
    },
    async saveJsonData() {
      const split = {}
      this.langs.forEach(lang => {
        split[lang] = {};
        if (this.chapters) {
          this.chapters.forEach(c => {
            this.full[c].forEach(it => {
              if (it.value[lang] !== undefined) _set(split[lang], c + '.' + it.path, it.value[lang]);
            });
          })
        } else {
          this.full.forEach(it => {
            if (it.value[lang] !== undefined) _set(split[lang], it.path, it.value[lang])
          });
        }
      });
      await toApp('saveJsonData', split);
      await this.getData();
    },
    async updateJsonData(v) {
      if (this.chapter) this.full[this.chapter] = v;
      else this.full = v;
      await this.saveJsonData();
      this.$toast('저장되었습니다');
    },
    async saveData(v) {
      if (this.currentRepo.type === 'json') {
        await this.updateJsonData(v);
      } else {
        await this.updateJsData(v);
      }
    },
  }
}