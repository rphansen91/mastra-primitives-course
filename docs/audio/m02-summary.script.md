---
id: m02-summary
module: "02"
kind: summary
title: "The agent loop, in two minutes"
verifiedCore: 1.77.0
---
When you call agent dot stream and text comes back, what is actually happening? A loop. Ask the model. Run whatever tools it asks for. Fold the results back into the conversation. Ask again. It stops when the model answers without asking for a tool.

You wrote that loop by hand in Module 1. What Mastra changes is its shape. The loop is a workflow: a do-while wrapped around another workflow, and each phase is a step. The model call, the tool calls, folding results back, checking signals, checking goals.

That costs some simplicity, and here is what you get for it. A step has a serializable input and output, its own trace span, and a boundary where progress can be saved. That is what lets the durable agent in Module 7 run the same loop and survive a crash.

You can plug in your own code at every phase, using processors. Process input runs once at the start. Process input step runs before every model call. Process output step runs after the model answers but before any tool runs, so it can veto a dangerous call. Process output result runs once at the end.

If two people message the same conversation at once, the second waits. Mastra reserves the thread, so there is one run per thread. Careful, though: that holds per process, unless you set up a distributed pub-sub.

Two launch-day bugs are worth knowing. First, the runaway agent. Max steps is a budget, not a policy. If you want to stop when the model is stuck, write a stop-when condition. Second, parallel tools. Mastra runs up to ten tool calls at once and folds the results back in call order. Order is guaranteed. Isolation is not. If two calls read and write the same row, you lose an update. Set tool call concurrency to one, or better, make the tool atomic.

And when should you not use the agent loop? When you already know the control flow, write a workflow. When you need one model call in a script, use the AI SDK. When you need a custom graph of agents, use a workflow with agent steps, or LangGraph.

The trade is flexibility for control. Next, open the loop visualizer and run the runaway case first.
