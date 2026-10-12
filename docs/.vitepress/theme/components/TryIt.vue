<script setup lang="ts">
import { ref, useId } from 'vue';
const props = withDefaults(defineProps<{ cmd: string; output?: string; cwd?: string; title?: string }>(), { cwd: 'labs', title: 'Try it' });
const copied = ref(false);
const showOut = ref(false);
const id = useId();
async function copy() {
  try {
    await navigator.clipboard.writeText(props.cmd);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = props.cmd;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  copied.value = true;
  setTimeout(() => (copied.value = false), 1600);
}
</script>
<template>
  <figure class="tryit" :aria-label="title">
    <div class="bar">
      <span class="ttl"><Icon name="terminal" :size="15" /> {{ title }} <span class="cwd">~/mastra-primitives-course/{{ cwd }}</span></span>
      <button type="button" class="cp" @click="copy" :aria-label="copied ? 'Copied' : 'Copy command'">
        <Icon :name="copied ? 'check' : 'copy'" :size="15" /> {{ copied ? 'Copied' : 'Copy' }}
      </button>
    </div>
    <pre class="cmd"><code><template v-for="(line, i) in cmd.split('\n')" :key="i"><span class="ps" aria-hidden="true">$ </span>{{ line }}
</template></code></pre>
    <div v-if="$slots.default" class="note"><slot /></div>
    <template v-if="output">
      <button type="button" class="toggle" :aria-expanded="showOut" :aria-controls="id" @click="showOut = !showOut">
        <Icon :name="showOut ? 'up' : 'down'" :size="14" /> {{ showOut ? 'Hide' : 'Show' }} expected output
      </button>
      <pre v-show="showOut" :id="id" class="out"><code>{{ output }}</code></pre>
    </template>
    <span class="mpc-sr" aria-live="polite">{{ copied ? 'Command copied to clipboard' : '' }}</span>
  </figure>
</template>
<style scoped>
/* One code surface for the whole site: hairline box, terminal label, copy button (no faux window chrome). */
.tryit { margin: 24px 0; border: 1px solid var(--mpc-line); border-radius: var(--mpc-r-md, 10px); overflow: hidden; background: var(--vp-code-block-bg); color: var(--vp-c-text-1); }
.bar { display: flex; align-items: center; gap: 10px; padding: 7px 10px 7px 14px; border-bottom: 1px solid var(--mpc-line); font-size: 13px; color: var(--vp-c-text-2); }
.ttl { flex: 1; font-weight: 500; display: flex; align-items: center; gap: 6px; min-width: 0; color: var(--vp-c-text-1); }
.cwd { font-weight: 400; color: var(--vp-c-text-2); font-family: var(--mpc-mono); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cp, .toggle { display: inline-flex; align-items: center; gap: 5px; background: transparent; color: var(--vp-c-text-2); border: 1px solid var(--mpc-line); border-radius: 6px; padding: 2px 9px; font-size: 12.5px; cursor: pointer; transition: background .15s, color .15s; }
.cp:hover, .toggle:hover { background: var(--vp-c-default-soft); color: var(--vp-c-text-1); }
.cp:focus-visible, .toggle:focus-visible { outline: 2px solid var(--vp-c-brand-1); outline-offset: 1px; }
pre { margin: 0; padding: 14px 16px; overflow-x: auto; font-family: var(--mpc-mono); font-size: 14px; line-height: 1.6; background: transparent !important; }
.ps { color: var(--vp-c-text-3); user-select: none; }
.note { padding: 0 16px 12px; font-size: 14px; color: var(--vp-c-text-2); }
.note :deep(p) { margin: 0; font-size: 14px !important; }
.toggle { margin: 0 16px 12px; }
.out { border-top: 1px solid var(--mpc-line); color: var(--vp-c-text-2); font-size: 13px; }
</style>
