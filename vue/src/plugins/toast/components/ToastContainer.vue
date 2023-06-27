<template>
  <div toast-container>
    <div v-for="toast in toastStack" :key="toast.id" :style="{transform: `translateY(${toast.top})`}" :class="[toast.type, toast.out ? 'out' : null]" @click="remove(toast.id)">
      <span v-html="toast.message" />
    </div>
  </div>
</template>

<script>

export default {
  name: 'ToastContainer',
  data() {
    return {
      seq: 0,
      toastStack: [],
      intervalId: -1,
      fullscreen: false,
      fullscreenStyle: {},
      toastHolder: null,
    };
  },
  methods: {
    toast(message, { type = 'success', dura = 2, clear = false } = {}) {
      if (clear) this.toastStack.forEach(it => it.life = 0);
      this.toastStack.unshift({ message, type, life: dura * 10 + 5, id: this.seq++, out: false });
      if (this.intervalId === -1) this.intervalId = setInterval(this.tick, 100);
    },
    remove(id) {
      this.toastStack = this.toastStack.filter(t => t.id !== id);
      this.emptyCheck();
    },
    tick() {
      this.toastStack.forEach((t, i) => {
        t.life -= 1;
        t.top = (i * 98) + '%';
        if (t.life < 5) t.out = true;
      });
      this.toastStack = this.toastStack.filter(t => t.life > 0);
      this.emptyCheck();
    },
    emptyCheck() {
      if (this.toastStack.length === 0) {
        clearInterval(this.intervalId);
        this.intervalId = -1;
      }
    },
    fullscreenChanged() {
      const fullscreen = !!document.fullscreenElement;
      if (this.fullscreen === fullscreen) return;
      /** @type {HTMLElement} */
      const el = this.$el;
      if (fullscreen) {
        document.fullscreenElement.appendChild(el);
      } else {
        this.toastHolder.$el.appendChild(el);
      }
      this.fullscreen = fullscreen;
    },
    init(holder) {
      this.toastHolder = holder;
      this.fullscreenChanged();
      document.addEventListener('fullscreenchange', this.fullscreenChanged);
    },
  },
};
</script>

<style lang="less">
@import '~@/less/proj';

[toast-container] { .fix; .wf; .lt; .z(6000); .fs(14); .c(#000);
  div { .abs; .lt; .wh(100%, 30); .flex-center; .tr-to(0.5s); .t-y(-100%); .p(10, 0);
    &.success { .bgc(#12d5a3); }
    &.fail { .bgc(#e9b718); }
    &.out { .o(0); }
    svg { .ib; .vam; .wh(20); .mr(5); }
    span { .ib; .vam; }
  }
}
</style>
