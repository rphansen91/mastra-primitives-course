---
id: m02-loop-visualizer
module: "02"
kind: visualizer
title: "Walkthrough: the loop visualizer"
verifiedCore: 1.77.0
---
This is a short tour of the loop visualizer. You can listen with your eyes on the diagram, or read the transcript below it.

Start with the default scenario, one tool call. Press Next, or use the left and right arrow keys while the diagram has focus. Watch the message list grow on each step: the user message, then the model asking for a tool, then the tool result, then a final answer. Notice that the loop only ends when the model answers without asking for a tool.

Now switch to Two tools at once. The model books two seats in a single turn. Each tool reads the seat count, waits, then writes. Step through it without the toggle and notice that both reads see the same starting number, so one booking is lost. Now turn on tool call concurrency one and run it again. The calls run one after the other, and the count comes out right. Remember the trade: you give up speed to get isolation, and making the tool atomic is usually better.

Last, switch to Runaway loop. The model calls the same search tool every step. Without a guard, the only thing that stops it is the max steps budget, after thirty identical calls. Turn on the stop-when toggle and run it again. It stops after three identical calls. Budget plus policy: you usually want both.

When you have seen all three, try the Break it exercises, where you fix the same two bugs in real code.
