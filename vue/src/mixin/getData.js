import { toApp } from '@/utils/toApp';
import { flatten, mergeJsonData } from '@/utils/serializeUtils';
import _omitBy from 'lodash/omitBy';

export default {
  methods: {
    async getJsData() {
      this.chapters = await toApp('getChapters');
      if (!this.chapters.includes(this.chapter)) this.chapter = null;
      const raw = await toApp('getFullData');
      const full = {};
      this.chapters.forEach(c => {
        if (c === 'common') {
          full[c] = flatten(_omitBy(raw, (v, k) => this.chapters.includes(k)), this.langs);
        } else {
          full[c] = flatten(raw[c], this.langs);
        }
      });
      this.full = full;
    },
    async getJsSepData() {
      const full = {};
      const raw = await toApp('getSepData');
      this.chapters = Object.keys(raw);
      this.chapters.forEach(c => {
        full[c] = flatten(raw[c], this.langs);
      });
      this.full = full;
    },
    async getJsonData() {
      const jsonData = await toApp('getJsonData', this.langs);
      const raw = mergeJsonData(jsonData);
      const keys = Object.keys(raw);
      this.chapters = keys.length > 20 ? null : keys;
      if (this.chapters) {
        const full = {};
        this.chapters.forEach(c => {
          full[c] = flatten(raw[c], this.langs);
        });
        this.full = full;
      } else {
        this.full = flatten(raw, this.langs);
      }
    },
    async getData() {
      this.conflict = false;
      if (this.currentRepo.type === 'json') {
        await this.getJsonData();
      } else if (this.currentRepo.type === 'bi18n') {
        await this.getJsData();
      } else {
        await this.getJsSepData();
      }
      const status = await toApp('getGitStatus');
      this.staged = status.includes('modified');
      this.conflict = this.conflict || status.includes('both modified') || status.includes('interactive rebase in progress');
    },
  }
}