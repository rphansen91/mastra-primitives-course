---
id: m02-loop-visualizer
module: "02"
kind: visualizer
title: "Walkthrough: the loop visualizer"
verifiedCore: 1.77.0
---
[curious] Ready for a quick tour of the loop visualizer? Listen with your eyes on the diagram, or read the transcript below it.

Start with one tool call. Press Next, or use the left and right arrow keys while the diagram has focus, and watch the message list grow: the user message, the model asking for a tool, the tool result, then a final answer. The loop ends only when the model answers without asking for a tool.

Now switch to Two tools at once. The model books two seats in a single turn, and each tool reads the seat count, waits, then writes. Without the toggle, both reads see the same starting number, so one booking is lost. Turn on tool call concurrency one and run it again, and the calls run one after the other and the count comes out right. [emphasis] You give up speed to get isolation, and making the tool atomic is usually better.

Last, switch to Runaway loop. The model calls the same search tool every step, and without a guard the only thing that stops it is the max steps budget, after thirty identical calls. Turn on the stop-when toggle and run it again, and it stops after three identical calls. You usually want both, a budget and a policy.

When you have seen all three, try the Break it exercises, where you fix the same two bugs in real code.
