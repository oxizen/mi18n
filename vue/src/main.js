import Vue from 'vue';
import Vuex from 'vuex';
import App from './App.vue';
import toast from '@/plugins/toast';
import modal from '@/plugins/modal';
import { toApp } from '@/utils/toApp';
import validation from '@/mixin/validation';

Vue.config.productionTip = false;
Vue.use(toast);
Vue.use(modal);
Vue.use(Vuex);
Vue.mixin(validation)

const store = new Vuex.Store({
  state: {
    repos: [],
    currentRepo: null,
  },
  mutations: {
    addRepository(state, payload) {
      state.repos.push(payload);
      return toApp('store', state);
    },
    changeRepository(state, payload) {
      state.currentRepo = payload;
      return toApp('store', state);
    },
    updateRepository(state, payload) {
      Object.assign(state.repos.find(r => r.name === payload.name), payload);
      return toApp('store', state);
    },
    removeRepository(state, payload) {
      state.repos = state.repos.filter(repo => repo.name !== payload.name);
      return toApp('store', state);
    }
  },
});

window.app = new Vue({
  render: h => h(App),
  store,
}).$mount('#app');