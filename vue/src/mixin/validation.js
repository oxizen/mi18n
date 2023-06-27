import _every from 'lodash/every';
import { finalSoundCheck } from '@/utils/koreanUtil';

const empty = el => {
  const glue = finalSoundCheck(el.title) ? '을' : '를';
  return `${el.title}${glue} 입력해 주세요`;
}

const invalid = el => {
  const glue = finalSoundCheck(el.title) ? '을' : '를';
  return `${el.title}${glue} ${el.dataset.invalid}`;
}

export default {
  methods: {
    $validate(selector) {
      return _every(this.$el.querySelectorAll(selector), el => {
        if (!el.value) {
          this.$toast(empty(el), { type: 'fail' });
          el.focus();
          return false;
        }
        if (el.dataset.validate && !new RegExp('^'+ el.dataset.validate + '$').test(el.value)) {
          this.$toast(invalid(el), { type: 'fail' });
          el.focus();
          return false;
        }
        return true;
      });
    },
    sleep(dura) {
      return new Promise(resolve => setTimeout(resolve, dura));
    }
  }
}