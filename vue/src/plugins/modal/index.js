import ModalContainer from './components/ModalContainer.vue';

export default {
  install(Vue, type, blocker) {
    const getContainer = c => {
      let modalHolder = c;
      let global = true;
      while (modalHolder['$parent']) {
        if (modalHolder['$options']['modalHolder']) {
          global = false;
          break;
        }
        modalHolder = modalHolder['$parent'];
      }

      if (!modalHolder._modalContainer) {
        modalHolder._modalContainer = new (Vue.extend(ModalContainer))({ parent: modalHolder, propsData: { global, type, blocker } });
        modalHolder._modalContainer.$mount();
        modalHolder.$el.appendChild(modalHolder._modalContainer.$el);
      }
      return modalHolder._modalContainer;
    };

    /**
     * @param {any & {singleModal?: boolean}} component
     * @param {any?} options
     * @param {boolean} clear 배경을 가득 채우지 않음
     * @returns {*}
     */
    Vue.prototype.$modal = function (component, options, clear = false) {
      if (typeof window === 'undefined') return;
      return getContainer(this).add(component, options, clear);
    };

    Vue.prototype.$checkModal = function (component) {
      if (typeof window === 'undefined') return;
      return getContainer(this).checkModal(component);
    };

    Vue.prototype.$closeModal = function (component) {
      if (typeof window === 'undefined') return;
      return getContainer(this).closeModal(component);
    };

    Vue.prototype.$block = function (msg) {
      if (typeof window === 'undefined') return;
      getContainer(this).block(msg);
    };

    Vue.prototype.$unblock = function () {
      if (typeof window === 'undefined') return;
      getContainer(this).unblock();
    };
  },
};
