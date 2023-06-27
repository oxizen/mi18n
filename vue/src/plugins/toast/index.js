import ToastContainer from './components/ToastContainer.vue';

export default {
  install(Vue) {
    const getContainer = c => {
      const toastHolder = c['$root'];

      if (!toastHolder._toastContainer) {
        toastHolder._toastContainer = new (Vue.extend(ToastContainer))({ parent: toastHolder });
        toastHolder._toastContainer['$mount']();
        toastHolder.$el.appendChild(toastHolder._toastContainer.$el);
        toastHolder._toastContainer.init(toastHolder);
      }
      return toastHolder._toastContainer;
    };

    /**
     * @param {string|string[]} message
     * @param {{type?: 'success'|'fail', dura?: number, clear?: boolean}?} options
     * @returns {void}
     */
    Vue.prototype.$toast = function (message, { type, dura, clear } = {}) {
      if (typeof window === 'undefined') return;
      getContainer(this).toast(message, { type, dura, clear });
    };

  },
};
