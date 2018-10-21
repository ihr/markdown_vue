<template>
  <div ref="wrap" @input="handleInput()" @keydown="handleKeyDown">
    <slot></slot>
    <div v-if="panel" class="absolute pin-t pin-l z-30" :style="style">
      <div class="block relative bg-white border border-grey-light shadow rounded mt-6">
        <div class="overflow-auto">
          <ul class="block list-reset">
            <li v-for="(item, index) in panel.list"
              class="block font-bold border-b border-grey-light hover:bg-blue hover:text-white"
              style="padding: 5px 10px"
              :class="currenClasses(index)"
              :ref="isCurrentIndex(index) && 'currentIndex'"
              :data-index="index"
              @mouseenter="handleItemHover"
              @click="handleItemClick"
            >
              <slot name="item" :item="item">
                <span v-text="itemName(item)"></span>
              </slot>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import getCaretCoordinates from 'textarea-caret'
import {
  closest, getOffset, getPrecedingRange,
  getRange, applyRange,
  scrollIntoView, getAtAndIndex
} from './utils'

export default {
  name: 'at-ta',
  props: {
    at: {
      type: String,
      default: null
    },
    ats: {
      type: Array,
      default: () => ['@']
    },
    suffix: {
      type: String,
      default: ' '
    },
    loop: {
      type: Boolean,
      default: true
    },
    hoverSelect: {
      type: Boolean,
      default: true
    },
    items: {
      type: Array,
      default: () => []
    },
    itemsLimit: {
      type: Number,
      default: 5
    },
    nameKey: {
      type: String,
      default: ''
    },
    filterMatch: {
      type: Function,
      default: function (name, chunk, item, at) {
        // match at lower-case
        return name.toLowerCase().indexOf(chunk.toLowerCase()) > -1
      }
    }
  },
  data() {
    return {
      hasComposition: false,
      panel: null
    }
  },
  mounted() {
    const $ta = this.$el.querySelector('textarea')
    if ($ta) $ta.addEventListener('blur', this.closePanel)
  },
  beforeDestroy() {
    const $ta = this.$el.querySelector('textarea')
    if ($ta) $ta.removeEventListener('blur', this.closePanel)
  },
  computed: {
    atItems() {
      return this.at ? [this.at] : this.ats
    },
    style() {
      if (!this.panel) return
      const { x, y } = this.panel
      const { wrap } = this.$refs
      const el = this.$el.querySelector('textarea')
      if (wrap) {
        const left = x + el.offsetLeft - el.scrollLeft + 'px'
        const top = y + el.offsetTop - el.scrollTop + 'px'
        return { left, top }
      }
    }
  },
  watch: {
    items() {
      this.handleInput(true)
    }
  },
  methods: {
    itemName(v) {
      const { nameKey } = this
      return nameKey ? v[nameKey] : v
    },
    isCurrentIndex(index) {
      return index === this.panel.index
    },
    currenClasses(index) {
      const classes = []
      if (index === 0) classes.push('rounded-t')
      if ((index + 1) === this.panel.list.length) classes.push('rounded-b')
      if (this.isCurrentIndex(index)) {
        classes.push('bg-blue', 'text-white')
      }
      return classes
    },
    handleItemHover(e) {
      if (this.hoverSelect) {
        this.selectByMouse(e)
      }
    },
    handleItemClick(e) {
      this.selectByMouse(e)
      this.insertItem()
    },
    handleKeyDown(e) {
      if (!this.panel) return
      // ↑/↓
      if (e.keyCode === 38 || e.keyCode === 40) {
        if (!(e.metaKey || e.ctrlKey)) {
          e.preventDefault()
          e.stopPropagation()
          this.selectByKeyboard(e)
        }
        return
      }
      // enter
      if (e.keyCode === 13) {
        this.insertItem()
        e.preventDefault()
        e.stopPropagation()
        return
      }
      // esc
      if (e.keyCode === 27) {
        this.closePanel()
        return
      }
    },
    selectByMouse(e) {
      const el = closest(e.target, d => d.getAttribute('data-index'))
      this.panel.index = +el.getAttribute('data-index')
    },
    selectByKeyboard(e) {
      const offset = e.keyCode === 38 ? -1 : 1
      const { index, list } = this.panel
      this.panel.index = this.loop
        ? (index + offset + list.length) % list.length
        : Math.max(0, Math.min(index + offset, list.length - 1))
    },
    handleInput(itemsChanged) {
      const el = this.$el.querySelector('textarea')
      const text = el.value.slice(0, el.selectionEnd)

      if (!text) return this.closePanel()
      let show = true
      const { at, index } = getAtAndIndex(text, this.atItems)

      if (index < 0) return this.closePanel()
      const prev = text[index - 1]
      const chunk = text.slice(index + at.length, text.length)
      // No email possible
      if (/^[a-z0-9]$/i.test(prev)) show = false
      // no spaces in chunk allowed
      if (/\s/.test(chunk)) show = false
      // If previous char is same as found at char
      if (prev === at) show = false
      if (!show) {
        return this.closePanel()
      }
      if (!itemsChanged) {
        this.$emit('at', chunk)
      }
      let matched = this.items.filter((item) => this.filterMatch(this.itemName(item), chunk, item, at))
      if (this.itemsLimit > 0) {
        matched = matched.slice(0, this.itemsLimit)
      }
      if (matched.length) {
        this.openPanel(matched, chunk, index, at)
      } else {
        this.closePanel()
      }
    },
    openPanel(list, chunk, offset, at) {
      const fn = () => {
        const el = this.$el.querySelector('textarea')
        const atEnd = offset + at.length // 从@后第一位开始
        const rect = getCaretCoordinates(el, atEnd)
        this.panel = {
          chunk,
          offset,
          list,
          atEnd,
          x: rect.left,
          y: rect.top - 4,
          index: 0
        }
      }
      if (this.panel) {
        return fn()
      }
      // The focus is out of the display area
      // a delay is required to move the pointer to recalculate the position
      setTimeout(fn, 10)
    },
    closePanel() {
      if (this.panel) {
        this.panel = null
      }
    },
    insertText(text, ta) {
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const newEnd = start + text.length

      ta.value = ta.value.slice(0, start) + text + ta.value.slice(end)      
      ta.selectionStart = newEnd
      ta.selectionEnd = newEnd
    },
    insertItem() {
      const { suffix, atItems, itemName } = this
      const el = this.$el.querySelector('textarea')
      const text = el.value.slice(0, this.panel.atEnd)
      const { at, index } = getAtAndIndex(text, atItems)
      const start = index + at.length
      el.selectionStart = start
      el.focus()
      const t = itemName(this.panel.list[this.panel.index]) + suffix
      this.insertText(t, el)
      this.$emit('insert')
      this.handleInput()
    }
  }
}
</script>