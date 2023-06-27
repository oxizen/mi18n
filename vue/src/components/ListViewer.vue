<template>
  <div list-viewer>
    <div class="header">
      <h3 v-if="chapter">{{ chapter }}</h3>
      <button @click="add" :disabled="conflict">추가</button>
      <button @click="save" :disabled="conflict">저장</button>
      <button @click="reset" :disabled="conflict">리셋</button>
    </div>
    <ul>
      <li v-for="item in list" :key="item.key" :class="{ active: searchKeys && searchKeys.includes((chapter ? chapter+'.' : '')+item.key) }" class="key-item">
        <input class="key-input" :data-idx="(chapter ? chapter+'.' : '')+item.key" @focus="e => $emit('focus', e.target)" @keydown.enter="e => e.keyCode === 13 && $emit('moveNext')" v-model="item.path" placeholder="영문, 숫자, _, .만 사용" title="키값" data-validate="[a-zA-Z][a-zA-Z0-9_\-.]*[a-zA-Z0-9_]" data-invalid="영문, 숫자, _만 사용 가능하고, 영문자로 시작해야 합니다">
        <div>
          <label v-for="lang in langs" :key="lang">
            <span>{{ lang }}</span>
            <textarea @focus="e => $emit('focus', e.target)" rows="2" v-model="item.value[lang]"></textarea>
          </label>
        </div>
        <button @click="remove(item.key)">X</button>
      </li>
    </ul>
  </div>
</template>
<script>
export default {
  name: 'ListViewer',
  props: {
    info: null,
    chapter: null,
    langs: null,
    conflict: Boolean,
    searchKeys: { type: Array, default: () => [] },
  },
  data() {
    return {
      list: null,
      sq: 0,
    };
  },
  watch: {
    info: 'reset',
  },
  mounted() {
    this.reset();
  },
  methods: {
    async add() {
      this.list.push({ key: this.sq++, path: '', value: {} });
      await this.$nextTick();
      window.scrollTo(0, window.innerHeight);
      const l = this.$el.querySelectorAll('input');
      if (l.length) l[l.length - 1].focus();
    },
    save() {
      if (!this.$validate('[data-validate]')) return;
      if (this.list.length !== new Set(this.list.map(it => it.path)).size) {
        this.$toast('중복된 키값이 있습니다', { type: 'fail' });
        return;
      }
      if (this.list.some(item => item.path.split('.').some(l => this.langs.includes(l)))) {
        this.$toast('키값에는 언어키가 포함되면 안됩니다 ('+(this.langs)+')', { type: 'fail' });
        return;
      }
      let p1, p2;
      if (this.list.some(i1 => {
        p1 = i1.path;
        const filtered = this.list.filter(i2 => i2.path.startsWith(p1));
        for (const i2 of filtered) {
          p2 = i2.path;
          if (p2[p1.length] === '.') return true;
        }
        return false;
      })) {
        this.$toast(`<strong>${p1}</strong> - <strong>${p2}</strong> 는 함께 사용할 수 없습니다.` , { type: 'fail' });
        return;
      }
      this.$emit('save', this.list);
    },
    remove(key) {
      this.list = this.list.filter(item => item.key !== key);
    },
    reset() {
      this.list = JSON.parse(JSON.stringify(this.info));
    },
  },
};
</script>
<style lang="less">
@import "~@/less/proj";
[list-viewer] { overflow: auto;
  .header { .sticky; .t(0); .p(10); .bgc(#fff); .-b(#aaa); .flex; .justify-end; .items-center;
    h3 { .flex-grow; .m(0); }
    button + button { .ml(10); }
  }
  ul { .p(10,0);
    li { .flex; .p(10);
      input { .wh(300, 26); }
      div { .flex-grow; .ml(10);
        label { .flex; .items-center;
          span { .w(30); }
          textarea { .flex-grow; resize: vertical; }
        }
        label + label { .mt(5); }
      }
      button { .h(30); .ml(5); }
      &.active { .bgc(#ffeeee); }
    }
    li + li { .-t(#aaa); }
  }
}
</style>