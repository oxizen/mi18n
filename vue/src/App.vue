<template>
  <div id="app" :class="{ finding }">
    <div class="area">
      <LeftDrawer :search-nums="searchNums" :chapters="chapters" :chapter="chapter" :repo="currentRepo" :staged="staged" :conflict="conflict" @chapter="focusChapter" @reset="getData" @addChapter="addChapter" @changeChapter="changeChapter" @deleteChapter="deleteChapter" @editRepository="editRepository" @exportToExcel="exportToExcel" @importExcel="importExcel"/>
      <ListViewer v-if="chapterData && !pending" :info="chapterData" :conflict="conflict" :chapter="chapter" :search-keys="searchKeys" @save="saveData" :langs="langs" @focus="inputFocused" @moveNext="moveNext"/>
    </div>
    <div class="finder">
      <div class="finder-inner">
        <b>검색</b> <input v-model="searchWords" @keydown.enter="startSearch" type="text" :disabled="searchKeys">
        <b v-if="searchKeys">
          <template v-if="searchKeys.length">검색 결과: {{ searchCursor || '-' }} / {{ searchKeys.length }}</template>
          <template v-else>검색 결과가 없습니다.</template>
        </b>
      </div>
    </div>
  </div>
</template>

<script>
import _forEach from 'lodash/forEach';
import _find from 'lodash/find';
import LeftDrawer from '@/components/LeftDrawer';
import { toApp } from '@/utils/toApp';
import ListViewer from '@/components/ListViewer';
import RepoModal from '@/components/RepoModal';
import saveData from '@/mixin/saveData';
import addChapter from '@/mixin/addChapter';
import getData from '@/mixin/getData';
import importExcel from '@/mixin/importExcel';

const sleep = t => new Promise(resolve => setTimeout(resolve, t));

export default {
  name: 'App',
  mixins: [saveData, addChapter, getData, importExcel],
  components: {
    ListViewer,
    LeftDrawer
  },
  data() {
    return {
      chapters: null,
      chapter: null,
      full: null,
      pending: false,
      staged: false,
      conflict: false,
      finding: false,
      searchWords: '',
      searchKeys: null,
      searchNums: null,
      searchInputs: null,
      focusInput: null,
    };
  },
  computed: {
    repos() {
      return this.$store.state.repos;
    },
    currentRepo() {
      return this.repos.find(it => it.name === this.$store.state.currentRepo);
    },
    langs() {
      return this.currentRepo?.langs?.split(',') ?? ['ko'];
    },
    chapterData() {
      return this.chapters ? this.full?.[this.chapter] : this.full;
    },
    searchCursor() {
      return this.focusInput && this.searchKeys && this.searchKeys.indexOf(this.focusInput.dataset.idx) + 1
    }
  },
  watch: {
    currentRepo: 'prepare'
  },
  methods: {
    focusChapter(chapter) {
      this.chapter = chapter;
    },
    async prepare() {
      this.pending = true;
      this.chapters = null;
      this.chapter = null;
      this.searchReset();
      if (this.currentRepo) {
        await toApp('prepare', this.currentRepo);
        await this.getData();
      }
      this.pending = false;
    },
    async editRepository() {
      await this.$modal(RepoModal, this.currentRepo);
      await this.prepare();
    },
    async exportToExcel() {
      if (await toApp('exportToExcel', { data: this.full, name: this.currentRepo.name, langs: this.langs }))
        this.$toast('저장되었습니다');
    },
    searchReset() {
      this.searchKeys = null;
      this.searchNums = null;
      this.searchInputs = null;
      this.searchWords = '';
    },
    keydown(e) {
      if (e.keyCode === 78 && (e.metaKey || e.ctrlKey)) {
        this.moveNext();
      } else if (e.keyCode === 70 && (e.metaKey || e.ctrlKey)) {
        this.finding = true;
        this.searchReset();
        this.$nextTick(() => {
          this.$el.querySelector('.finder input').focus();
        });
      } else if (e.keyCode === 27 && this.finding ) {
        this.finding = false;
        this.searchReset();
      }
    },

    async startSearch(e) {
      if (e.keyCode !== 13) return;
      await sleep(10);
      if (!this.searchWords) {
        this.searchReset();
        this.finding = false;
        return;
      }
      this.searchKeys = [];
      if (this.chapters) {
        this.searchNums = {};
        this.chapters.forEach(c => this.searchNums[c] = 0)
        _forEach(this.full, (rows, chapter) => {
          rows.forEach(item => {
            if (item.path.includes(this.searchWords) || Object.values(item.value).some(t => t?.includes(this.searchWords))) {
              this.searchKeys.push(chapter+'.'+item.key);
              this.searchNums[chapter] += 1;
            }
          });
        });
      } else {
        this.full.forEach(item => {
          if (item.path.includes(this.searchWords) || Object.values(item.value).some(t => t?.includes(this.searchWords))) {
            this.searchKeys.push(item.key);
          }
        });
      }
      await this.moveInit();
    },
    async moveInit() {
      if (this.chapters) {
        const idx = this.chapters.indexOf(this.chapter);
        this.chapter = this.chapters.slice(idx + 1).find(c => this.searchNums[c] > 0);
      }
      await sleep(100);
      this.searchInputs = this.$el.querySelectorAll('.key-item.active .key-input');
      await this.moveNext(true);
    },
    async moveNext(first) {
      if (!this.searchKeys) return;
      if (!this.searchInputs) return;
      const next = first ? this.searchInputs[0] : _find(this.searchInputs, el => el.offsetTop > (this.focusInput?.offsetTop?? 0));
      if (next) {
        next.focus();
        this.$el.querySelector('[list-viewer]').scrollTo({ top: next.offsetTop - 100, behavior: 'smooth' });
      } else {
        if (this.chapters) await this.moveInit();
        else await this.moveNext(true);
      }
    },
    inputFocused(el) {
      this.focusInput = el;
    }
  },
  async created() {
    const setInnerHeight = () => {
      const rootStyle = document.documentElement.style;
      rootStyle.setProperty('--innerHeight', `${window.innerHeight}px`);
    };
    window.addEventListener('resize', setInnerHeight);
    window.addEventListener('keydown', this.keydown);
    setInnerHeight();
    await this.sleep(500);
    await toApp('restore');
  }
};
</script>
<style lang="less">
@import "~@/less/proj";
body { .m; }
#app { .flex; .flex-column; .h(100vh);
  .t1(50);
  @finder_h: @_t1;
  select { .p(5, 10); .-a(#aaa); .br(3); }
  button { .-a(#aaa); .br(3); .p(5, 10); .pointer; }
  input { .p(5, 10); .-a(#aaa); .br(3); }
  textarea { .p(5, 10); .-a(#aaa); .br(3); }
  a { .pointer; }

  .area { .flex; transition: height .3s; .h(100vh);
    [list-viewer] { .flex-grow; }
  }
  .finder { .h(0); .bgc(#FFF); transition: height .3s; .crop;
    .finder-inner { .h(@finder_h); .flex; .p(0,20); .gap(20); .items-center; .-t(#aaa); .-box; .bgc(rgb(143, 227, 116));
      input { .w(200); }
    }
  }

  &.finding {
    .area { .h(calc(100vh - @finder_h)) }
    .finder { .h(@finder_h); }
  }
}
</style>
