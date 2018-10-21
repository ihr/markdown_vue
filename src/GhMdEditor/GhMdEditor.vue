<template>
	<div class="relative bg-white border border-grey-light rounded-sm break-words text-sm font-sans">
    <div class="relative">
      <div class="relative bg-grey-lighter rounded-sm p-2 pb-0 mb-3 border-b border-grey-light">
        <nav class="block -mb-px" role="tablist">
          <button type="button" @click="currentTab = 'write'" :class="tabClass('write')" role="tab" :aria-selected="writeTab" style="outline:none;">Write</button>
          <button type="button" @click="currentTab = 'preview'" :class="tabClass('preview')" role="tab" :aria-selected="previewTab" style="outline:none;">Preview</button>
        </nav>
      </div>
      <div class="relative block m-3 mt-0">
        <div v-show="writeTab">
          <at-ta at=":" :items="colonItems" name-key="name" suffix=": " @insert="update">
            <at-ta at="@" :items="atItems" name-key="username" :filterMatch="fuzzyFilter" @insert="update">
              <at-ta at="#" :items="hashItems" name-key="number" :filterMatch="fuzzyFilter" @insert="update">
                <textarea
                  class="block bg-grey-lightest p-3 w-full resize-y rounded border border-grey-light rounded-b-none"
                  :class="borderClass"
                  style="max-height: 500px;border-bottom-style: dashed; outline: none;"
                  :style="style"
                  name="value"
                  :value.once="initValue"
                  ref="ta"
                  :placeholder="placeholder"
                  :aria-label="placeholder"
                  @dragover.prevent
                  @dragenter.prevent="dragover = true"
                  @dragleave.prevent="dragover = false"
                  @drop.prevent="drop"
                  @focus="focus = true"
                  @blur="focus = false"
                  @input="update"
                ></textarea>
                <template slot="item" slot-scope="s">
                  <span class="inline-block text-xs font-light">#{{ s.item.number }}</span> {{ s.item.title }}
               </template>
              </at-ta>
              <template slot="item" slot-scope="s">
                <span class="font-bold text-sm inline-block mr-1">{{ s.item.username }}</span> <span class="text-xs font-thin">{{ s.item.name }}</span>
              </template>
            </at-ta>
            <template slot="item" slot-scope="s">
              <img class="inline-block align-middle mr-1" :alt="`:${s.item.name}:`" height="20" width="20" :src="s.item.url"/>
              {{ s.item.name }}
            </template>
          </at-ta>
          <!-- Upload zone -->
          <p :class="borderClass" class="relative text-grey-dark p-2 text-xs leading-tight bg-grey-lightest border border-grey-light border-t-0 rounded rounded-t-none">
            <input 
              class="absolute pin p-2 cursor-pointer"
              style="opacity: 0.0001"
              accept=".gif,.jpeg,.jpg,.png,.docx,.gz,.log,.pdf,.pptx,.txt"
              type="file"
              aria-label="Attach files to your comment"
              @change="uploadFile">
            <span v-if="!status" class="inline-block leading-normal">Attach files by dragging &amp; dropping or <span class="text-blue">selecting them</span>.</span>
            <span v-if="status === 'uploading'" class="inline-block leading-normal"><img class="inline align-top" alt="" width="16" height="16" src="https://user-images.githubusercontent.com/904724/33183636-ec4064dc-d078-11e7-9dd7-3d3165f586a7.gif"> &nbsp;Uploading your file…</span>
            <span v-if="status === 'badFileType'" class="inline-block leading-normal text-red-dark">We don’t support that file type. <span class="text-blue">Try again</span> with a GIF, JPEG, JPG or PNG.</span>
            <span v-if="status === 'fileTooBig'" class="inline-block leading-normal text-red-dark">Sorry, this file is too big, <span class="text-blue">try again</span> with a file smaller than 2MB.</span>
            <span v-if="status === 'failedRequest'" class="inline-block leading-normal text-red-dark">Something went wrong, and we can’t process that file, <span class="text-blue">Try again</span>.</span>
          </p>
        </div>
        <div v-show="previewTab" class="markdown-body" v-html="preview"></div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import autosize from 'autosize'
import AtTa from './AtTa'
import { fuzzySearch } from './utils'
import emojis from './emojis'

const localStorage = window && window.localStorage
const emojisArray = Object.keys(emojis).map((name) => ({ name, url: emojis[name] }))

export default {
  name: 'markdown-editor',
  props: {
    uploadUrl: {
      type: String,
      default: ''
    },
    storageKey: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: 'Leave a comment'
    },
    // Given by v-model
    value: {
      type: String,
      default: ''
    },
    colonItems: {
      type: Array,
      default: () => emojisArray
    },
    atItems: {
      type: Array,
      default: []
    },
    hashItems: {
      type: Array,
      default: []
    },
    height: {
      type: Number,
      default: 100
    }
  },
  data () {
    return {
      currentTab: 'write',
      status: '',
      focus: false,
      dragover: false,
      preview: ''
    }
  },
  watch: {
    value(value) {
      // If value has been reseted
      if (!value && this.storageKey && localStorage) {
        localStorage.removeItem(this.storageKey)
      }
    },
    async currentTab(tab) {
      if (tab !== 'preview') return
      const { data } = await axios.post('https://api.github.com/markdown', {
        text: this.value
      })
      this.preview = data || 'Nothing to preview'
    }
  },
  beforeMount() {
    // Emit event with value from localStorage
    if (this.initValue !== this.value) {
      this.$emit('input', this.initValue)
    }
  },
  mounted() {
    autosize(this.$refs.ta)
  },
  beforeDestroy() {
    autosize.destroy(this.$refs.ta)
  },
  computed: {
    initValue() {
      // Load data from localStorage only if key defined and value not defined
      if (this.value || !this.storageKey || !localStorage) {
        return this.value
      }
      return localStorage.getItem(this.storageKey) || ''
    },
    borderClass() {
      return {
        'border-blue-light': !this.dragover && this.focus,
        'border-yellow-dark': this.dragover,
        'shadow-inner': this.dragover
      }
    },
    style() {
      return {
        height: `${this.height}px`,
        minHeight: `${this.height}px`
      }
    },
    writeTab() {
      return this.currentTab === 'write'
    },
    previewTab() {
      return this.currentTab === 'preview'
    }
  },
  methods: {
    update() {
      this.$emit('input', this.$refs.ta.value)
      // Update in localStorage
      if (this.storageKey && localStorage) {
        localStorage.setItem(this.storageKey, this.$refs.ta.value)
      }
    },
    fuzzyFilter(key, search, item) {
      const full = Object.values(item).join(' ')
      return fuzzySearch(search, full)
    },
    drop(event) {
      this.dragover = false
      this.process(event.dataTransfer.files[0])
    },
    uploadFile(event) {
      this.process(event.target.files[0])
    },
    async process(file) {
      if (!file) return
      const placeholder = `![Uploading ${file.name}]()\n`
      const form = new FormData()
      const value = this.$refs.ta.value
      const index = this.$refs.ta.selectionEnd || this.$refs.ta.selectionStart || 0

      // Add placeholder
      this.$refs.ta.value = value.slice(0, index) + (!value[index - 1] || value[index - 1] === '\n' ? '' : '\n') + placeholder + value.slice(index)
      this.update()

      // Add file to form
      form.append('file', file)
      this.status = 'uploading'
      await new Promise((resolve) => setTimeout(resolve, 1000))
      try {
        // Upload file
        const { data } = axios.post(this.uploadUrl, form)
        this.$refs.ta.value = this.$refs.ta.value.replace(placeholder, `![${data.name}](${data.location})\n`)
        this.status = ''
      } catch(err) {
        this.$refs.ta.value = this.$refs.ta.value.replace(placeholder, `![Failed to upload ${file.name}]\n`)
        this.status = 'failedRequest'
      }
      this.update()
    },
    tabClass(tab) {
      if (this.currentTab === tab) {
        return 'leading-tight text-black bg-white border rounded rounded-b-none border-grey-light border-b-0 px-3 py-2'
      }
      return 'leading-tight text-grey-darkest hover:text-black border rounded rounded-b-none border-transparent border-b-0 px-3 py-2'
    }
  },
  components: {
    AtTa
  }
}
</script>

<style scoped>
textarea::-webkit-input-placeholder {
  color: #555;
}
</style>

<style>
.markdown-body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    font-size: 16px;
    line-height: 1.5;
    word-wrap: break-word;
}
.markdown-body::before {
    display: table;
    content: "";
}
.markdown-body::after {
    display: table;
    clear: both;
    content: "";
}
.markdown-body>*:first-child {
    margin-top: 0 !important;
}
.markdown-body>*:last-child {
    margin-bottom: 0 !important;
}
.markdown-body a:not([href]) {
    color: inherit;
    text-decoration: none;
}
.markdown-body .absent {
    color: #cb2431;
}
.markdown-body .anchor {
    float: left;
    padding-right: 4px;
    margin-left: -20px;
    line-height: 1;
}
.markdown-body .anchor:focus {
    outline: none;
}
.markdown-body p,
.markdown-body blockquote,
.markdown-body ul,
.markdown-body ol,
.markdown-body dl,
.markdown-body table,
.markdown-body pre {
    margin-top: 0;
    margin-bottom: 16px;
}
.markdown-body hr {
    height: 0.25em;
    padding: 0;
    margin: 24px 0;
    background-color: #e1e4e8;
    border: 0;
}
.markdown-body blockquote {
    padding: 0 1em;
    color: #6a737d;
    border-left: 0.25em solid #dfe2e5;
}
.markdown-body blockquote>:first-child {
    margin-top: 0;
}
.markdown-body blockquote>:last-child {
    margin-bottom: 0;
}
.markdown-body kbd {
    display: inline-block;
    padding: 3px 5px;
    font-size: 11px;
    line-height: 10px;
    color: #444d56;
    vertical-align: middle;
    background-color: #fafbfc;
    border: solid 1px #c6cbd1;
    border-bottom-color: #959da5;
    border-radius: 3px;
    box-shadow: inset 0 -1px 0 #959da5;
}
.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
    margin-top: 24px;
    margin-bottom: 16px;
    font-weight: 600;
    line-height: 1.25;
}
.markdown-body h1 .octicon-link,
.markdown-body h2 .octicon-link,
.markdown-body h3 .octicon-link,
.markdown-body h4 .octicon-link,
.markdown-body h5 .octicon-link,
.markdown-body h6 .octicon-link {
    color: #1b1f23;
    vertical-align: middle;
    visibility: hidden;
}
.markdown-body h1:hover .anchor,
.markdown-body h2:hover .anchor,
.markdown-body h3:hover .anchor,
.markdown-body h4:hover .anchor,
.markdown-body h5:hover .anchor,
.markdown-body h6:hover .anchor {
    text-decoration: none;
}
.markdown-body h1:hover .anchor .octicon-link,
.markdown-body h2:hover .anchor .octicon-link,
.markdown-body h3:hover .anchor .octicon-link,
.markdown-body h4:hover .anchor .octicon-link,
.markdown-body h5:hover .anchor .octicon-link,
.markdown-body h6:hover .anchor .octicon-link {
    visibility: visible;
}
.markdown-body h1 tt,
.markdown-body h1 code,
.markdown-body h2 tt,
.markdown-body h2 code,
.markdown-body h3 tt,
.markdown-body h3 code,
.markdown-body h4 tt,
.markdown-body h4 code,
.markdown-body h5 tt,
.markdown-body h5 code,
.markdown-body h6 tt,
.markdown-body h6 code {
    font-size: inherit;
}
.markdown-body h1 {
    padding-bottom: 0.3em;
    font-size: 2em;
    border-bottom: 1px solid #eaecef;
}
.markdown-body h2 {
    padding-bottom: 0.3em;
    font-size: 1.5em;
    border-bottom: 1px solid #eaecef;
}
.markdown-body h3 {
    font-size: 1.25em
}
.markdown-body h4 {
    font-size: 1em
}
.markdown-body h5 {
    font-size: 0.875em
}
.markdown-body h6 {
    font-size: 0.85em;
    color: #6a737d
}
.markdown-body ul,
.markdown-body ol {
    padding-left: 2em
}
.markdown-body ul.no-list,
.markdown-body ol.no-list {
    padding: 0;
    list-style-type: none
}
.markdown-body ul ul,
.markdown-body ul ol,
.markdown-body ol ol,
.markdown-body ol ul {
    margin-top: 0;
    margin-bottom: 0
}
.markdown-body li {
    word-wrap: break-all
}
.markdown-body li>p {
    margin-top: 16px
}
.markdown-body li+li {
    margin-top: 0.25em
}
.markdown-body dl {
    padding: 0
}
.markdown-body dl dt {
    padding: 0;
    margin-top: 16px;
    font-size: 1em;
    font-style: italic;
    font-weight: 600
}
.markdown-body dl dd {
    padding: 0 16px;
    margin-bottom: 16px
}
.markdown-body table {
    display: block;
    width: 100%;
    overflow: auto
}
.markdown-body table th {
    font-weight: 600
}
.markdown-body table th,
.markdown-body table td {
    padding: 6px 13px;
    border: 1px solid #dfe2e5
}
.markdown-body table tr {
    background-color: #fff;
    border-top: 1px solid #c6cbd1
}
.markdown-body table tr:nth-child(2n) {
    background-color: #f6f8fa
}
.markdown-body table img {
    background-color: transparent
}
.markdown-body img {
    max-width: 100%;
    box-sizing: content-box;
    background-color: #fff
}
.markdown-body img[align=right] {
    padding-left: 20px
}
.markdown-body img[align=left] {
    padding-right: 20px
}
.markdown-body .emoji {
    max-width: none;
    vertical-align: text-top;
    background-color: transparent
}
.markdown-body span.frame {
    display: block;
    overflow: hidden
}
.markdown-body span.frame>span {
    display: block;
    float: left;
    width: auto;
    padding: 7px;
    margin: 13px 0 0;
    overflow: hidden;
    border: 1px solid #dfe2e5
}
.markdown-body span.frame span img {
    display: block;
    float: left
}
.markdown-body span.frame span span {
    display: block;
    padding: 5px 0 0;
    clear: both;
    color: #24292e
}
.markdown-body span.align-center {
    display: block;
    overflow: hidden;
    clear: both
}
.markdown-body span.align-center>span {
    display: block;
    margin: 13px auto 0;
    overflow: hidden;
    text-align: center
}
.markdown-body span.align-center span img {
    margin: 0 auto;
    text-align: center
}
.markdown-body span.align-right {
    display: block;
    overflow: hidden;
    clear: both
}
.markdown-body span.align-right>span {
    display: block;
    margin: 13px 0 0;
    overflow: hidden;
    text-align: right
}
.markdown-body span.align-right span img {
    margin: 0;
    text-align: right
}
.markdown-body span.float-left {
    display: block;
    float: left;
    margin-right: 13px;
    overflow: hidden
}
.markdown-body span.float-left span {
    margin: 13px 0 0
}
.markdown-body span.float-right {
    display: block;
    float: right;
    margin-left: 13px;
    overflow: hidden
}
.markdown-body span.float-right>span {
    display: block;
    margin: 13px auto 0;
    overflow: hidden;
    text-align: right
}
.markdown-body code,
.markdown-body tt {
    padding: 0.2em 0.4em;
    margin: 0;
    font-size: 85%;
    background-color: rgba(27, 31, 35, 0.05);
    border-radius: 3px
}
.markdown-body code br,
.markdown-body tt br {
    display: none
}
.markdown-body del code {
    text-decoration: inherit
}
.markdown-body pre {
    word-wrap: normal
}
.markdown-body pre>code {
    padding: 0;
    margin: 0;
    font-size: 100%;
    word-break: normal;
    white-space: pre;
    background: transparent;
    border: 0
}
.markdown-body .highlight {
    margin-bottom: 16px
}
.markdown-body .highlight pre {
    margin-bottom: 0;
    word-break: normal
}
.markdown-body .highlight pre,
.markdown-body pre {
    padding: 16px;
    overflow: auto;
    font-size: 85%;
    line-height: 1.45;
    background-color: #f6f8fa;
    border-radius: 3px
}
.markdown-body pre code,
.markdown-body pre tt {
    display: inline;
    max-width: auto;
    padding: 0;
    margin: 0;
    overflow: visible;
    line-height: inherit;
    word-wrap: normal;
    background-color: transparent;
    border: 0
}
.markdown-body .csv-data td,
.markdown-body .csv-data th {
    padding: 5px;
    overflow: hidden;
    font-size: 12px;
    line-height: 1;
    text-align: left;
    white-space: nowrap
}
.markdown-body .csv-data .blob-num {
    padding: 10px 8px 9px;
    text-align: right;
    background: #fff;
    border: 0
}
.markdown-body .csv-data tr {
    border-top: 0;
}
.markdown-body .csv-data th {
    font-weight: 600;
    background: #f6f8fa;
    border-top: 0;
}
</style>