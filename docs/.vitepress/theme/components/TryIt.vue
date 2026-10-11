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
      <span class="dots" aria-hidden="true"><i /><i /><i /></span>
      <span class="ttl"><Icon name="terminal" :size="15" /> {{ title }} <span class="cwd">~/mastra-primitives-course/{{ cwd }}</span></span>
      <button type="button" class="cp" @click="copy" :aria-label="copied ? 'Copied' : 'Copy command'">
        <Icon :name="copied ? 'check' : 'copy'" :size="15" /> {{ copied ? 'Copied!' : 'Copy' }}
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
.tryit { margin: 24px 0; border: 2px solid var(--mpc-ink); border-radius: 14px; overflow: hidden; background: #17142b; box-shadow: var(--mpc-card-shadow); color: #e9e6ff; }
.bar { display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: #262145; font-size: 13px; }
.dots { display: flex; gap: 5px; }
.dots i { width: 10px; height: 10px; border-radius: 50%; background: #ff6b81; }
.dots i:nth-child(2) { background: #ffc24b; }
.dots i:nth-child(3) { background: #3fd6a6; }
.ttl { flex: 1; font-weight: 700; display: flex; align-items: center; gap: 6px; min-width: 0; }
.cwd { font-weight: 400; color: #a9a3d6; font-family: var(--mpc-mono); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cp, .toggle { display: inline-flex; align-items: center; gap: 5px; background: transparent; color: #e9e6ff; border: 1.5px solid #6c63a8; border-radius: 8px; padding: 2px 9px; font-size: 12.5px; cursor: pointer; }
.cp:hover, .toggle:hover { background: #3a3366; }
.cp:focus-visible, .toggle:focus-visible { outline: 3px solid var(--mpc-sky); outline-offset: 1px; }
pre { margin: 0; padding: 14px 16px; overflow-x: auto; font-family: var(--mpc-mono); font-size: 14px; line-height: 1.6; background: transparent !important; }
.ps { color: #3fd6a6; user-select: none; }
.note { padding: 0 16px 12px; font-size: 14px; color: #c9c4ee; }
.note :deep(p) { margin: 0; font-size: 14px !important; }
.note :deep(code) { color: #fff; background: #332d5c; }
.toggle { margin: 0 16px 12px; }
.out { border-top: 1px dashed #4a437c; color: #c9c4ee; font-size: 13px; }
</style>
