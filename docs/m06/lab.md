---
pageClass: lesson
aside: false
---

<script setup>
const cmd1 = "npm run lab:signals\nnpm run lab:notifications\nnode --import tsx --test m06-signals/lab.test.ts"
const cmd2 = "LAB_TARGET=exercises node --import tsx --test m06-signals/break-it.test.ts"
const q_mid = [{"text": "In the first request, before the tool call", "why": "The first request was already sent before the signal existed."}, {"text": "In the second request, after the tool result, as a user-role notification", "correct": true, "why": "Cooperative delivery: the run drains it at the next safe point, after the tool result is folded in."}, {"text": "In a separate new run", "why": "That's what happens when the thread is **idle**. This one was active."}]
</script>

# Lab 6: Signals mid-run, wakes, and notifications

<LabHeader module="06" folder="m06-signals" runs="~6 s" :tests="2" mood="happy">

Signals delivered into a running loop, an idle thread woken, a signal persisted for later, and the notification pipeline from a custom provider to the dispatcher.

</LabHeader>


<TryIt :cmd="cmd1" />

## 6.1 Mid-run delivery, idle wake, persist

[`signal-mid-run.ts`](https://github.com/rphansen91/mastra-primitives-course/blob/main/labs/m06-signals/signal-mid-run.ts): a worker agent runs `push_branch` (400 ms). While the tool runs, an ops notice arrives.

<Quiz kind="predict" module="06" id="lab-mid" question="An ops notice is sent while `push_branch` (400 ms) is running. Where does it appear in the model's prompts?" :options="q_mid" />

```text
=== 1) Signal while push_branch is executing ==============================
thread state while tool runs: active
sendSignal accepted → { action: 'deliver' }
run1 text: Staggering pushes: waiting 10 minutes between pushes.

=== 2) Thread idle; signal WAKES a new run (default ifIdle: wake) =========
thread state: idle
accepted → wake | woken run text: Resuming normal push cadence.

=== 3) ifIdle: persist ====================================================
accepted → { action: 'persist' } | persisted resolves: true

=== Prompts the model actually received ===================================
-- doStream #2
   system    You push code. Obey operational notices.
   user      Push feat/auth
   assistant [tool-call push_branch]
   tool      [tool-result push_branch: {"pushed":"feat/auth"}]
   user      <notification author="oncall" channel="ops" source="chat">We're getting rate limited by GitHub, please stagger pushes.</notification>
-- doStream #3
   system    You push code. Obey operational notices.
   user      <notification source="github">CI recovered; Docker Hub healthy.</notification>
```

Read it carefully:

- The signal was accepted **during** the tool but reached the model **after** the tool result: cooperative delivery.
- It arrived as a **user-role XML-tagged** message. (On 1.76.0 and later the tag attributes are sorted alphabetically; on 1.75.0 they kept insertion order, `source` first. Don't string-match the exact tag in your tests.)
- The woken run (#3) has **no history**: this agent has no memory. Module 4's point, observed.
- `persist` didn't call the model (3 model calls total), but one `subscribeToThread` subscription saw all **3 runs**, including the persisted signal's `data-signal` chunk.

## 6.2 Notifications, a custom provider, and the dispatcher

[`notifications.ts`](https://github.com/rphansen91/mastra-primitives-course/blob/main/labs/m06-signals/notifications.ts): `FirehoseSignals extends SignalProvider` polls a fake event feed every 100 ms, classifies each event (a stand-in for an LLM classifier), and calls `notify()`. The coordinator agent has memory, the inbox tool and a logging `decide` that defers to the default.

```text
=== Delivery decisions (policy input) and inbox records ===================
  gh-1 urgent thread=idle
  ch-1 low thread=active
  gh-2 low thread=active
  cal-1 medium thread=active
  ...
  cal-1  medium  status=pending   reason=active-batch-summary summaryAt=-
  gh-2   low     status=pending   reason=active-batch-summary summaryAt=set
  ch-1   low     status=pending   reason=active-batch-summary summaryAt=set
  gh-1   urgent  status=delivered reason=urgent summaryAt=-

=== Dispatcher tick (normally a cron workflow) emits due summaries ========
  delivered: [ 'ch-1:pending', 'gh-2:pending' ] signals: [ '<notification-summary> chat: 1, github: 1' ]

=== What the model saw (last message of each request) =====================
  #1 (3 msgs) user      <notification-summary pending="1" priority="medium">calendar: 1</notification-summary>

=== Thread history persisted in memory (roles) ============================
  signal(notification), signal(notification-summary), assistant, signal(notification-summary)
```

The urgent event woke the idle thread; everything after it arrived while the thread was **active** and was summarized. The dispatcher batched the two lows into one summary signal; the medium calendar item was summarized immediately and joined the woken run. **Version note:** on 1.76.0 the calendar summary is drained into the woken run's *first* model request (one model call, 3 messages).

On 1.75.0 the woken run made two model calls, the urgent item first and the summary second ([`core-1.75.0/m06-notifications.txt`](https://github.com/rphansen91/mastra-primitives-course/blob/main/labs/expected-output/core-1.75.0/m06-notifications.txt)). Same signals, same history, different number of LLM calls: count model calls per version before you budget for them. `decide` may be called more than once per record (receipt time and delivery time), which is why deciders must be pure.

## 6.3 Write your own signal source

Build a provider for an event source you actually have (a CI webhook, a chat socket, a queue). Copy [`notifications.ts`](https://github.com/rphansen91/mastra-primitives-course/blob/main/labs/m06-signals/notifications.ts) as a template and meet this contract (from [`signal-providers.mdx`](https://github.com/mastra-ai/mastra/blob/f88217d19b63d362ff97723c1a339fbf89a1bbb0/docs/src/content/en/docs/harness/signal-providers.mdx)):

1. `extends SignalProvider<'my-source'>`. Do async setup in `start()`. If you override `stop()`, call `super.stop()` so polling stops and the registry clears.
2. Poll, or override `handleWebhook(request)`. It is **not** an auto-mounted route: call it from your own endpoint.
3. For each event that matches a subscription, call `notify()` with a stable `dedupeKey` (the source's event id) and a `priority`.
4. **Survive a restart.** Subscriptions are in-memory per process, so persist them yourself and rehydrate them in `start()`.
5. **Prove it.** Write a test that sends the same event twice (one record), restarts the provider (the subscription still fires), and kills the process between `accepted` and `persisted` (what does your webhook return?).



**File:** [`exercises/ex1-delivery-policy.ts`](https://github.com/rphansen91/mastra-primitives-course/blob/main/labs/m06-signals/exercises/ex1-delivery-policy.ts)

<TryIt :cmd="cmd2" />

Requirements: calendar items always `deliver` (interject into an active run); low-priority chat `persist` (inbox only, never wake, never summarize); source `spam` `discard`; everything else uses the default. The test wakes the thread with an urgent item, then sends calendar/chat/spam while it's active, and checks record statuses and that spam never reached the model.

<Reveal title="Show the solution">

```ts
export const decide = ({ record }) => {
  if (record.source === 'spam') return 'discard';
  if (record.source === 'calendar') return 'deliver';
  if (record.source === 'chat' && record.priority === 'low') return 'persist';
  return undefined; // fall through to sources → priorities → default → built-in
};
```
Observed statuses on 1.75.0 through 1.77.0: `calendar-medium: delivered`, `chat-low: pending` (no `summaryAt`), `spam-high: discarded`.

</Reveal>

## More tasks

1. **Blocked.** Give an agent a tool with `requireApproval`, start a run that suspends on it, then `sendSignal` to that thread. Assert `blocked`. What should the sender do now?
2. **Transient.** Send `{ transient: true }` to an idle thread with `ifIdle: { behavior: 'persist' }`. Confirm `{ action: 'discard' }`. Then send it to an active run: is it in memory afterwards?
3. **Interruption.** Script the model with `reasoning` only and `delayMs: 500`; send a signal at 100 ms. How many model calls, and how many steps were counted?
4. **Woken run options.** Return `{ action: 'deliver', streamOptions: { maxSteps: 2 } }` from `decide` and verify the woken run honors it.
5. **Dedupe.** Push the same firehose event twice with the same `dedupeKey`. How many records?
