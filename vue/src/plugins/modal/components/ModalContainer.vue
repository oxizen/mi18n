<template>
  <div modal-container :data-mode="type" v-show="modals.length || blocked" :class="{global, clear}">
    <component v-for="modal in modals" :is="modal.component" :options="modal.options" :key="modal.id"
      @close="close(modal.id)"
      @resolve="(result) => resolve(modal.id, result)"
      @reject="(result) => reject(modal.id, result)" />
    <transition name="fade">
      <div v-if="blocked" class="blocker">
        <h1 class="msg">{{ msg }}</h1>
      </div>
    </transition>
  </div>
</template>

<script>

export default {
  name: 'ModalContainer',
  props: {
    global: { type: Boolean },
    type: String,
    blocker: {
      type: null,
      default: null,
    },
  },
  data() {
    return {
      seq: 0,
      modals: [],
      blocked: false,
      blockTimeout: -1,
      msg: '',
    };
  },
  computed: {
    clear() {
      return !this.blocked && this.modals.every(m => m.clear);
    },
  },
  methods: {
    checkComponentFlag(component) {
      if (component.singleModal) {
        this.modals = this.modals.filter(m => m.component.name !== component.name);
      }
    },
    add(component, options, clear) {
      this.checkComponentFlag(component);
      return new Promise((resolve, reject) => {
        this.modals.push({ id: this.seq++, component, resolve, reject, options, clear });
      });
    },
    closeModal(component) {
      this.modals = this.modals.filter(m => m.component !== component);
    },
    getModal(id) {
      return this.modals.find(m => m.id === id);
    },
    block(msg) {
      clearTimeout(this.blockTimeout);
      this.blocked = true;
      this.msg = msg;
    },
    unblock() {
      this.blockTimeout = setTimeout(() => {
        this.blocked = false;
      }, 300);
    },
    resolve(id, result) {
      this.getModal(id).resolve(result);
      this.close(id);
    },
    reject(id, result) {
      this.getModal(id).reject(result);
      this.close(id);
    },
    close(id) {
      this.modals = this.modals.filter(m => m.id !== id);
    },
    checkModal(component) {
      return this.modals.findIndex(m => (m.component.name === component.name)) !== -1;
    },
  },
};
</script>

<style lang="less">
@import '~@/less/proj';

[modal-container] { .fix; .wh(100vw, var(--innerHeight)); .lt; .z(5000);
  > div { .z(1); }
  .blocker { .abs; .f; .flex-center; .z(10000); .lt; .bgc(rgba(0, 0, 0, 0.7));
    h1 { .c(#fff); .rel; }
  }
  .fade-enter-active { .tr-o(0.5s); }
  .fade-leave-active { .tr-o(0.5s); }
  .fade-enter, .fade-leave-to { .o(0) }
  &.clear { .wh(0, 0); }
}
</style>
