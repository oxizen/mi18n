import { toApp } from '@/utils/toApp';
import { makeIndex, makeJs } from '@/utils/serializeUtils';
export default {
  methods: {
    async addJsChapter(v) {
      this.chapters.push(v);
      this.full[v] = [];
      await toApp('saveJs', { jsString: makeJs([]), file: v });
      if (this.currentRepo.type === 'bi18n') await toApp('saveJs', { jsString: makeIndex(this.chapters), file: 'index' });
      await this.getData();
      this.chapter = v;
    },
    async addJsonChapter(v) {
      this.chapters.push(v);
      this.full[v] = [];
      this.chapter = v;
    },
    async addChapter(v) {
      if (this.currentRepo.type === 'json') {
        await this.addJsonChapter(v);
      } else {
        await this.addJsChapter(v);
      }
    },
    async changeJsChapter(v) {
      const idx = this.chapters.findIndex(c => c === v.org);
      this.chapters[idx] = v.change;
      await toApp('renameJs', v);
      if (this.currentRepo.type === 'bi18n') await toApp('saveJs', { jsString: makeIndex(this.chapters), file: 'index' });
      await this.getData();
    },
    async changeJsonChapter(v) {
      const idx = this.chapters.findIndex(c => c === v.org);
      this.chapters[idx] = v.change;
      const n = this.full[v.org];
      delete n[v.org];
      this.full[v.change] = n;
      await this.saveJsonData();
    },
    async changeChapter(v) {
      if (this.currentRepo.type === 'json') {
        await this.changeJsonChapter(v);
      } else {
        await this.changeJsChapter(v);
      }
      if (this.chapter === v.org) this.chapter = v.change;
    },

    async deleteJsChapter(v) {
      this.chapters = this.chapters.filter(c => c !== v);
      await toApp('deleteJs', { file: v });
      if (this.currentRepo.type === 'bi18n') await toApp('saveJs', { jsString: makeIndex(this.chapters), file: 'index' });
      await this.getData();
    },
    async deleteJsonChapter(v) {
      this.chapters = this.chapters.filter(c => c !== v);
      delete this.full[v];
      await this.saveJsonData();
    },
    async deleteChapter(v) {
      if (!confirm(`${v} 챕터를 삭제하시겠습니까?`)) return;
      if (this.currentRepo.type === 'json') {
        await this.deleteJsonChapter(v);
      } else {
        await this.deleteJsChapter(v);
      }
    }
  }
}