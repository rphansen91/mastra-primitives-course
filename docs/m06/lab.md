# Lab 6: Signals mid-run, wakes, and notifications

**Code:** [`labs/m06-signals`](https://github.com/rphansen91/mastra-primitives-course/tree/main/labs/m06-signals) · **Runs against:** `@mastra/core@1.75.0` (and 1.76 alpha in CI) · **Runs in:** ~6 s

```bash
npm run lab:signals
npm run lab:notifications
node --import tsx --test m06-signals/lab.test.ts
```

## 6.1 Mid-run delivery, idle wake, persist

[`signal-mid-run.ts`](https://github.com/rphansen91/mastra-primitives-course/blob/main/labs/m06-signals/signal-mid-run.ts): a worker agent runs `push_branch` (400 ms). While the tool runs, an ops notice arrives.

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
   user      <notification source="chat" channel="ops" author="oncall">We're getting rate limited by GitHub, please stagger pushes.</notification>
-- doStream #3
   system    You push code. Obey operational notices.
   user      <notification source="github">CI recovered; Docker Hub healthy.</notification>
```

Read it carefully:

- The signal was accepted **during** the tool but reached the model **after** the tool result: cooperative delivery.
- It arrived as a **user-role XML-tagged** message.
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
```

The urgent event woke the idle thread; everything after it arrived while the thread was **active** and was summarized. The dispatcher batched the two lows into one summary signal; the medium calendar item was summarized immediately and joined the woken run. `decide` may be called more than once per record (receipt time and delivery time), which is why deciders must be pure.

## Break it: Exercise 6.1, a delivery policy

**File:** [`exercises/ex1-delivery-policy.ts`](https://github.com/rphansen91/mastra-primitives-course/blob/main/labs/m06-signals/exercises/ex1-delivery-policy.ts)

```bash
LAB_TARGET=exercises node --import tsx --test m06-signals/break-it.test.ts
```

Requirements: calendar items always `deliver` (interject into an active run); low-priority chat `persist` (inbox only, never wake, never summarize); source `spam` `discard`; everything else uses the default. The test wakes the thread with an urgent item, then sends calendar/chat/spam while it's active, and checks record statuses and that spam never reached the model.

::: details Solution
```ts
export const decide = ({ record }) => {
  if (record.source === 'spam') return 'discard';
  if (record.source === 'calendar') return 'deliver';
  if (record.source === 'chat' && record.priority === 'low') return 'persist';
  return undefined; // fall through to sources → priorities → default → built-in
};
```
Observed statuses on 1.75.0: `calendar-medium: delivered`, `chat-low: pending` (no `summaryAt`), `spam-high: discarded`.
:::

## More tasks

1. **Blocked.** Give an agent a tool with `requireApproval`, start a run that suspends on it, then `sendSignal` to that thread. Assert `blocked`. What should the sender do now?
2. **Transient.** Send `{ transient: true }` to an idle thread with `ifIdle: { behavior: 'persist' }`. Confirm `{ action: 'discard' }`. Then send it to an active run: is it in memory afterwards?
3. **Interruption.** Script the model with `reasoning` only and `delayMs: 500`; send a signal at 100 ms. How many model calls, and how many steps were counted?
4. **Woken run options.** Return `{ action: 'deliver', streamOptions: { maxSteps: 2 } }` from `decide` and verify the woken run honors it.
5. **Dedupe.** Push the same firehose event twice with the same `dedupeKey`. How many records?
