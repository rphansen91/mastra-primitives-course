<script setup lang="ts">
const cols = [
  { title: 'Comes back', color: 'teal', icon: 'check', items: ['Completed LLM steps (not re-asked)', 'Completed tool steps', 'MessageList, memory, requestContext', 'Workflow snapshot after every step'] },
  { title: 'Runs again', color: 'amber', icon: 'reset', items: ['The in-flight step, from its start', 'Its side effect, unless the receiver dedupes', 'A whole sub-agent call (one opaque step)'] },
  { title: 'Gone', color: 'coral', icon: 'x', items: ['Plain agent.stream() runs (no checkpoints)', 'In-memory signal queues', 'SignalProvider subscriptions', 'Timers on the default engine'] },
];
</script>
<template>
  <figure class="rm" aria-label="What survives a kill -9">
    <div class="cols">
      <div v-for="c in cols" :key="c.title" class="col mpc-card" :class="`c-${c.color}`">
        <div class="h"><span class="ic"><Icon :name="c.icon" :size="18" /></span><strong>{{ c.title }}</strong></div>
        <ul><li v-for="it in c.items" :key="it">{{ it }}</li></ul>
      </div>
    </div>
    <figcaption>After <code>kill -9</code>, a durable agent with <code>recovery.durableAgents: 'auto'</code>, at the pinned commit.</figcaption>
  </figure>
</template>
<style scoped>
.cols { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.col { margin: 0 !important; padding: 14px; }
.c-teal { background: var(--mpc-teal-soft); }
.c-amber { background: var(--mpc-amber-soft); }
.c-coral { background: var(--mpc-coral-soft); }
.h { display: flex; gap: 8px; align-items: center; font-size: var(--fs-body); }
.ic { width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--mpc-line); background: var(--mpc-paper); display: grid; place-items: center; }
ul { margin: 10px 0 0 !important; padding-left: 18px !important; }
li { font-size: var(--fs-sm); line-height: 1.45 !important; margin: 6px 0 !important; }
figcaption { text-align: center; font-size: var(--fs-sm); color: var(--vp-c-text-2); margin-top: 12px; }
.rm { margin: 28px 0; }
@media (max-width: 720px) { .cols { grid-template-columns: 1fr; } }
</style>
