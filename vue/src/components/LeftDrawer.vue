<template>
  <div left-drawer>
    <div class="repos">
      <select v-if="list.length" v-model="repoName">
        <option v-for="item in list" :key="item.name" :value="item.name">{{ item.name }}</option>
      </select>
      <select v-else disabled>
        <option>No Repository</option>
      </select>
      <button @click="addRepo">+</button>
    </div>
    <div class="chapter" v-if="chapters">
      <h3>Chapters</h3>
      <table>
        <tr v-for="c in chapters" :key="c">
          <td @click="e => selectChapter(c, e.altKey, e.shiftKey)" :class="{ active: chapter === c }">{{ c }} <i v-if="searchNums">({{ searchNums[c] }})</i></td>
        </tr>
      </table>
      <button @click="addChapter" v-if="repo && !repo.filter">+ Add Chapter</button>
    </div>
    <div class="fnc">
      <button :disabled="!canEdit" @click="$emit('editRepository')" :title="canReset ? '수정한 내용이 있을경우 저장소 수정을 할수 없습니다' : ''">Edit Repository</button>
      <button :disabled="!canReset" @click="resetToBase">Reset to Base</button>
      <button :disabled="!canCommit" @click="commitAndPush">Commit And Push</button>
      <button @click="$emit('exportToExcel')">Export to Excel</button>
      <button :disabled="conflict" @click="$emit('importExcel')">Import Excel</button>
    </div>
    <p v-if="conflict">수정하고 커밋하지 않은 파일이 원격에서 갱신되었습니다. <em>Reset to Base</em> 한 뒤에 수정사항을 다시 반영해주세요.</p>
  </div>
</template>

<script>
import RepoModal from '@/components/RepoModal';
import { toApp } from '@/utils/toApp';
import InputModal from '@/components/InputModal';
import UserModal from '@/components/UserModal';

export default {
  name: 'LeftDrawer',
  props: {
    chapters: null,
    chapter: null,
    repo: null,
    staged: Boolean,
    conflict: Boolean,
    searchNums: Object
  },
  computed: {
    list() {
      return this.$store.state.repos;
    },
    repoName: {
      set(v) {
        this.$store.commit('changeRepository', v);
      },
      get() {
        return this.$store.state.currentRepo;
      }
    },
    canEdit() {
      return this.repoName && !this.canReset;
    },
    canReset() {
      return this.staged || this.conflict;
    },
    canCommit() {
      return this.staged && !this.conflict;
    }
  },
  methods: {
    addRepo() {
      this.$modal(RepoModal);
    },
    async selectChapter(chapter, ctrl, shift) {
      if (shift && ctrl) {
        this.$emit('deleteChapter', chapter);
      } else if (ctrl) {
        const val = await this.$modal(InputModal, { title: 'Chapter명 변경', preset: chapter });
        if (!/^[a-zA-Z]+$/.test(val)) {
          this.$toast('Chapter는 영문 대소문자로만 입력해주세요', { type: 'fail' });
          return;
        }
        this.$emit('changeChapter', { org: chapter, change: val });
      } else {
        this.$emit('chapter', chapter);
      }
    },
    async addChapter() {
      const val = await this.$modal(InputModal, { title: 'Chapter 입력' })
      if (!/^[a-zA-Z]+$/.test(val)) {
        this.$toast('Chapter는 영문 대소문자로만 입력해주세요', { type: 'fail' });
        return;
      }
      this.$emit('addChapter', val);
    },
    async resetToBase() {
      if (!confirm('정말 리셋하시겠습니까?')) return;
      await toApp('resetToBase');
      this.$emit('reset');
      this.$toast('리셋되었습니다');
    },
    async commitAndPush() {
      if (!confirm('정말 커밋하시겠습니까?')) return;
      const user = await toApp('checkGitUser')
      if (!user) await this.$modal(UserModal);
      await toApp('commitAndPush');
      this.$emit('reset');
      this.$toast('커밋되었습니다');
    },
  },
};
</script>

<style lang="less">
@import "~@/less/proj";
[left-drawer] { .w(250); .bgc(#EEE); .p(20); .-box; overflow-y: auto; .sticky; .t(0);
  .repos { .wf; .flex;
    select { .flex-grow(1); }
    button { .ml(5); }
  }
  .chapter {
    table { .wf; .-collapse;
      td { .p(5); .-a(#aaa); .pointer; user-select: none;
        &.active { .bgc(#fff); .bold; }
        i { .c(#337); font-style: normal; .bold; }
      }
    }
    button { .wf; .mt(5); }
  }
  .fnc { .mt(20);
    button { .wf; .mt(5); }
  }
  p { .fs(18, 26); .mt(30);
    em { .c(#f60); font-style: normal; }
  }
}
</style>