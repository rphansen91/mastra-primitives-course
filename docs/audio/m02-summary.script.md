---
id: m02-summary
module: "02"
kind: summary
title: "The agent loop, in two minutes"
verifiedCore: 1.77.0
---
[curious] So what's actually happening when you call agent dot stream? A loop, that's it. Ask the model, run the tools it asks for, fold the results back in, and ask again. [emphasis] It stops only when the model answers without asking for a tool.

You wrote this loop by hand in Module 1, so what's different in Mastra? The shape, because the loop is a workflow, a do-while wrapped around another workflow, and every phase is a step. The model call, the tool calls, folding results back, checking signals, checking goals.

That costs you some simplicity, but it buys you something big. A step has a serializable input and output, its own trace span, and a boundary where progress can be saved, which is what lets the durable agent in Module 7 run the same loop and survive a crash.

You can plug in your own code at every phase using processors. Process input runs once at the start, and process input step runs before every model call. Process output step runs after the model answers but before any tool runs, so it can veto a dangerous call. Process output result runs once at the end.

What if two people message the same conversation at once? The second one waits, because Mastra reserves the thread so there's one run per thread. Careful though, that holds per process unless you set up a distributed pub-sub.

Two launch-day bugs are worth knowing. First, the runaway agent. Max steps is a budget, not a policy, so if you want to stop when the model is stuck, write a stop-when condition. Second, parallel tools. Mastra runs up to ten tool calls at once and folds the results back in call order. [emphasis] Order is guaranteed, but isolation is not. If two calls read and write the same row, you lose an update, so set tool call concurrency to one, or better, make the tool atomic.

So when should you not use the agent loop? When you already know the control flow, write a workflow. For one model call in a script, use the AI SDK. For a custom graph of agents, use a workflow with agent steps, or LangGraph.

The trade is flexibility for control. Next, open the loop visualizer and run the runaway case first.
