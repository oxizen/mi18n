<template>
  <div repo-modal>
    <div class="panel">
      <h2 v-if="publicKey">공개키 확인</h2>
      <h2 v-else-if="edit">저장소 수정</h2>
      <h2 v-else>저장소 추가</h2>
      <a @click="$emit('close')"><SvgClose /></a>
      <template v-if="publicKey">
        <label><textarea v-model="publicKey" readonly></textarea></label>
        <p>위 Public Key를 복사하여 GitHub Settings - Deploy keys 에 Deploy Key를 추가해주세요.</p>
      </template>
      <template v-else>
        <label><span>저장소 ID</span><input :disabled="edit" type="text" v-model="model.name" placeholder="영문, 숫자, - 만 사용" title="저장소 ID" data-validate="[a-zA-Z0-9-]+" data-invalid="영문, 숫자, - 만 사용해 주세요"></label>
        <div class="row"><span>연동방식</span>
          <label><input type="radio" v-model="model.method" value="ssh">키페어사용(SSH)</label>
          <label><input type="radio" v-model="model.method" value="https">계정사용(HTTPS)</label>
        </div>
        <label v-if="model.method === 'https'"><span>Git URL(HTTPS)</span><input type="text" v-model="model.httpsUrl" title="Git URL" data-validate="https:.*" data-invalid="HTTPS 경로인지 확인해주세요"></label>
        <label v-else><span>Git URL(SSH)</span><input type="text" v-model="model.sshUrl" title="Git URL" data-validate="((?!http).)+" data-invalid="SSH 경로인지 확인해주세요"></label>
        <label><span>Branch</span><input type="text" v-model="model.branch" title="Branch" data-validate></label>
        <label><span>i18n 경로</span><input type="text" v-model="model.path" title="i18n 경로" data-validate></label>
        <label><span>언어</span><input type="text" v-model="model.langs" placeholder=", 로 구분해서 입력" title="언어" data-validate="[a-zA-Z,-]+" data-invalid="영문, - 만 사용해 주세요"></label>
        <label><span>형식</span>
          <select v-model="model.type">
            <option value="bi18n">Javascript (BI18N)</option>
            <option value="bi18ns">Javascript (BI18N Seperated)</option>
            <option value="json">JSON</option>
          </select>
        </label>
        <template v-if="model.type === 'bi18ns'">
          <div class="row"><span>모듈방식</span>
            <label><input type="radio" v-model="model.module" value="cjs">CommonJS(.js)</label>
            <label><input type="radio" v-model="model.module" value="mjs">ESM(.mjs)</label>
          </div>
          <label><span>챕터 필터</span><input type="text" v-model="model.filter" placeholder="일부 챕터만 사용할경우 입력하세요(, 로 구분해서 입력)" title="챕터"></label>
        </template>
        <template v-if="model.type === 'bi18ns' && model.filter">
          <label><span>추가 경로</span><input type="text" v-model="model.path2" placeholder="추가 경로가 있을경우 입력해주세요" title="추가경로"></label>
        </template>
      </template>
      <div class="btn-holder" v-if="edit">
        <template v-if="!publicKey">
          <button @click="toPublic" v-if="model.method === 'ssh'">공개키 확인</button>
          <button @click="remove">삭제</button>
        </template>
        <button @click="save">확인</button>
      </div>
      <div class="btn-holder" v-else>
        <button @click="next">확인</button>
      </div>
    </div>
  </div>
</template>
<script>
import SvgClose from '@/svg/SvgClose';
import { toApp } from '@/utils/toApp';
export default {
  name: 'RepoModal',
  components: { SvgClose },
  props: {
    options: null
  },
  data() {
    return {
      orgUrl: '',
      model: {
        method: 'ssh',
        module: 'cjs',
        name: '',
        httpsUrl: '',
        sshUrl: '',
        branch: '',
        path: '',
        path2: '',
        filter: '',
        type: 'bi18n',
        publicKey: '',
      },
      publicKey: '',
      edit: false,
    };
  },
  methods: {
    async next() {
      if (this.publicKey) {
        this.$store.commit('changeRepository', this.model.name);
        this.$emit('close');
      } else {
        if (!this.$validate('[data-validate]')) return;
        if (this.model.method === 'ssh') {
          this.model.publicKey = await toApp('getPublicKey', this.model);
        }
        await this.$store.commit('addRepository', this.model);
        if (this.model.method === 'ssh') {
          this.publicKey = this.model.publicKey;
        } else {
          this.$store.commit('updateRepository', this.model);
          this.$emit('resolve');
        }
        this.$toast('저장소가 추가되었습니다');
      }
    },
    async save() {
      if (!this.$validate('[data-validate]')) return;
      if (this.orgUrl !== this.model.sshUrl) await toApp('clearRepo');
      this.$store.commit('updateRepository', this.model);
      this.$emit('resolve');
    },
    async remove() {
      if (!confirm('정말 삭제하시겠습니까?')) return;
      this.$store.commit('removeRepository', this.model);
      await toApp('removeRepo');
      this.$store.commit('changeRepository', this.$store.state.repos[0]?.name);
      this.$emit('resolve');
    },
    toPublic() {
      this.publicKey = this.model.publicKey;
    }
  },
  mounted() {
    if (this.options) {
      this.edit = true;
      this.model = JSON.parse(JSON.stringify(this.options));
      if (!this.model.method) this.model.method = 'ssh';
      if (!this.model.module) this.model.module = 'cjs';
      this.orgUrl = this.model.sshUrl;
    }
  }
}
</script>
<style lang="less">
@import "~@/less/proj.less";

[repo-modal] { .flex; .items-center; .justify-center; .hf; .bgc(rgba(0,0,0,0.7));
  .panel { .w(600); .bgc(#fff); .br(10); .-a(#ccc); .p(20); .rel;
    h2 { .m; .mb(20); }
    [svg-close] { .wh(20); .abs; .rt(20,20); }
    > label, >.row { .block; .mb(10);
      span { .ib; .wh(150, 28); .vat; .lh(28); }
      input[type=text], select { .w(450); .-box; }
      textarea { .-box; .wf; .h(210); resize: none; }
      > label + label { .ml(10); .lh(28); }
    }
    .btn-holder { .flex; .justify-end;
      button + button { .ml(10); }
    }
  }
}
</style>