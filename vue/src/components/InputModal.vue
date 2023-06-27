<template>
  <div input-modal>
    <div class="panel">
      <h3>{{ title }}</h3>
      <a @click="$emit('close')"><SvgClose /></a>
      <div class="btn-holder">
        <input type="text" v-model="model" @keydown.enter="resolve">
        <button @click="resolve">확인</button>
      </div>
    </div>
  </div>
</template>
<script>
import SvgClose from '@/svg/SvgClose';

export default {
  name: 'InputModal',
  components: { SvgClose },
  props: {
    options: null
  },
  data() {
    return {
      model: null,
      title: null,
    };
  },
  methods: {
    resolve() {
      if (!this.model) {
        this.$toast('입력해주세요', { type: 'fail' });
        this.$el.querySelector('input').focus();
        return;
      }
      this.$emit('resolve', this.model);
    }
  },
  async mounted() {
    if (this.options) {
      this.title = this.options.title;
      this.model = this.options.preset;
    }
    await this.$nextTick();
    this.$el.querySelector('input').focus();
  }
}
</script>
<style lang="less">
@import "~@/less/proj";

[input-modal] { .flex; .items-center; .justify-center; .hf; .bgc(rgba(0,0,0,0.7));
  .panel { .w(600); .bgc(#fff); .br(10); .-a(#ccc); .p(20); .rel;
    h2 { .m; .mb(20); }
    [svg-close] { .wh(20); .abs; .rt(20,20); }
    .btn-holder { .flex;
      input { .w(450); .-box; }
      button  { .ml(10); }
    }
  }
}
</style>