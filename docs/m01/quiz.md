---
pageClass: lesson
aside: false
---

<script setup>
const q1 = [
  { text: 'Immediately, at second 5: the loop interrupts the tool', why: 'Delivery is cooperative, not preemptive. Nothing interrupts a running tool.' },
  { text: 'At the next model request, after the tool finishes (second 30+)', correct: true, why: 'Signals are drained at safe points (the top of a step). The tool result is folded in, then the signal joins the next prompt.' },
  { text: 'Never: signals only start new runs', why: 'In the from-scratch loop, signals are queued and drained into the running loop.' },
]
const q2 = [
  { text: 'Completion order is faster, so call order is just for readability', why: 'It\'s not about readability. It\'s about the next prompt being deterministic.' },
  { text: 'So the next prompt is a deterministic function of the model\'s previous turn', correct: true, why: 'That makes replays, prompt caching and tests stable, and providers expect tool results to match the order of the tool calls.' },
  { text: 'Because tools always finish in call order anyway', why: 'They don\'t. A fast second tool can finish first. That\'s exactly why the fold has to reorder.' },
]
const q3 = [
  { text: 'The journal remembers the email, so it isn\'t sent again', why: 'The process died **before** the journal write. There\'s nothing to remember.' },
  { text: 'It\'s sent again; the only complete fix is an idempotency key the receiver dedupes on', correct: true, why: 'At-least-once. Derive the key from stable identifiers (run id + step id) so the effect applies once even if the request is sent twice.' },
  { text: 'It\'s sent again; write the journal before sending to fix it', why: 'Then a crash after the write and before the send loses the email: at-most-once. You\'ve moved the window, not closed it.' },
]
const q4 = [
  { text: 'True: when the TTL expires, the old worker stops', why: 'A paused worker (GC, VM freeze) doesn\'t know its lease expired and keeps writing.' },
  { text: 'False: you also need fencing tokens checked by storage', correct: true, why: 'Each lease gets an increasing token; storage rejects writes with an old one. The TTL alone can\'t stop a zombie.' },
]
const q5 = [
  { text: 'They\'re the same thing with different names', why: 'One is a budget; the other is a policy.' },
  { text: '`maxSteps` is a budget (a hard cap with no reason); `stopWhen` is a policy that encodes a reason', correct: true, why: '"Loop detected", "goal met", "tool X was called". Use both: the policy for intent, the budget as a backstop.' },
  { text: '`stopWhen` runs before each step; `maxSteps` only at the end', why: 'Both are checked as the loop goes. The difference is what they mean.' },
]
const q6 = [
  { text: 'Two unrelated users, or a caller that needs a synchronous answer with a clean prompt', correct: true, why: 'Signals are for information that should change what the **current** work does. Independent requests deserve their own run.' },
  { text: 'A notice that CI is rate limited, while the agent is pushing', why: 'That\'s exactly what signals are for: it should change the current work.' },
  { text: 'A user correcting the agent mid-task: "actually, use staging"', why: 'Also a signal: it changes the current work.' },
]
const loopOrder = ['Drain pending signals into the transcript', 'Call the model with the transcript', 'Run the tool calls (in parallel)', 'Fold results back in call order', 'Check stop conditions, then go again']
</script>

# Check your understanding: Module 1

Answer before reading the explanations. Your progress is saved in this browser.

<Quiz module="01" id="cq-1" question="A tool takes 30 s. A signal arrives at second 5. In the from-scratch loop, when does the model see it?" :options="q1" />

<Quiz module="01" id="cq-2" question="Why fold parallel tool results in **call** order instead of completion order?" :options="q2" />

<Quiz kind="predict" module="01" id="cq-3" question="A durable step sends an email, then the process is killed **before** the journal write. What happens on replay?" :options="q3" />

<Quiz module="01" id="cq-4" question="True or false: a lease with a TTL guarantees only one worker writes at a time." :options="q4" />

<Quiz module="01" id="cq-5" question="What's the difference between `maxSteps` and a `stopWhen` condition?" :options="q5" />

<Quiz module="01" id="cq-6" question="When is a **new run per message** better than delivering a signal into a running loop?" :options="q6" />

<OrderSteps module="01" id="cq-order" prompt="Order one turn of the from-scratch loop." :items="loopOrder" explain="Signals are drained at the top of the step, so they're in the prompt for the very next model call." />

<Reflect question="Your journal keys effects by step name. A step is called in a for loop over 10 pages. What breaks, and how do you fix it without making keys position-based again?">

All 10 calls share one key, so calls 2 to 10 replay page 1's result. Include the loop identity in the key (`fetchPage:${pageNumber}`, using the page number, which is semantic, not a global counter). Engines do this with iteration indexes within a named loop, plus a determinism check.

</Reflect>
