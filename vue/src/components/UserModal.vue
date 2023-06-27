<template>
  <div user-modal>
    <div class="panel">
      <h3>Git User 설정</h3>
      <a @click="$emit('close')"><SvgClose /></a>
      <label><span>Username</span><input type="text" data-validate="[a-zA-Z][a-zA-Z ]*" data-invalid="영문만 사용해주세요" title="Username" v-model="name"></label>
      <label><span>Email</span><input type="text" data-validate="^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$" title="Email" data-invalid="형식에 맞춰 입력해주세요" v-model="email"></label>
      <div class="btn-holder">
        <button @click="resolve">확인</button>
      </div>
    </div>
  </div>
</template>
<script>
import SvgClose from '@/svg/SvgClose';
import { toApp } from '@/utils/toApp';

export default {
  name: 'UserModal',
  components: { SvgClose },
  props: {
    options: null
  },
  data() {
    return {
      name: null,
      email: null,
    };
  },
  methods: {
    async resolve() {
      if (!this.$validate('[data-validate]')) return;
      await toApp('gitUser', { name: this.name, email: this.email });
      this.$emit('resolve');
    }
  },
  async mounted() {
    await this.$nextTick();
    this.$el.querySelector('input').focus();
  }
}
</script>
<style lang="less">
@import "~@/less/proj";

[user-modal] { .flex; .items-center; .justify-center; .hf; .bgc(rgba(0,0,0,0.7));
  .panel { .w(600); .bgc(#fff); .br(10); .-a(#ccc); .p(20); .rel;
    h2 { .m; .mb(20); }
    [svg-close] { .wh(20); .abs; .rt(20,20); }
    label { .block; .mb(10);
      span { .ib; .wh(150, 28); .vat; .lh(28); }
      input { .w(450); .-box; }
    }
    .btn-holder { .flex; .justify-end;
      button + button { .ml(10); }
    }
  }
}
</style>