---
title: "Switching Models Mid-Session in Copilot CLI"
description: "When you switch AI models mid-session, context continuity is automatic but coherence is not. Here's what that distinction means in practice and how to close the gap."
subtitle: "Context travels. Understanding doesn't."
date: 2026-03-22
tags: ["copilot", "ai", "developer-workflow"]
---

I had an interesting session last week. I started with a fast, cheap model to scan a codebase I hadn't touched in a while. Then I switched to a heavier Codex model for some debugging. Then back down to a lighter one to make a few targeted edits.

The session worked. But at the end, staring at the diff, I wasn't entirely sure the changes were *actually* inline with what my debugging has uncovered. The question was - did the last model just made changes based on a surface read of the conversation that are plausible or the right changes.

That got me thinking properly about what model switching in Copilot CLI actually guarantees, and what it doesn't.

---

## What the CLI gives you for free

When you switch models mid-session using `/model`, the full conversation history travels with you. Every message, every tool call result, every model response — it's all handed to the next model as context.

This means the new model is not starting blind. In theory, it can see the scanning results, the debugging conclusions, the decisions made. That's the continuity.

---

## The thing continuity doesn't buy you

Here's what I've come to think of as the problem.

Before proceeding further, a few words and definitions: **Continuity** means the information is present. **Coherence** means the model is *weighing* that information the way you'd expect — consistently, and with the same understanding the previous model built up.

A smaller or differently-tuned model reading a 30-message conversation doesn't necessarily reconstruct the same mental model of the problem that a larger model spent the last 10 turns building. Despite the lesser size of context window, it will make *reasonable* inferences. But reasonable isn't the same as *consistent with what we just figured out*.

This matters most in the scenario I described: *scan* → *debug* → *edit*. Each step builds on the last. If the editing model doesn't fully internalize what the debugging step concluded, you end up with edits that look plausible but are subtly off-target.

---

## What I do now

### Summarize before you switch

Before I use `/model` to drop to a lighter model, I ask the current model to write a structured handoff:

> *Before I switch models, I need a precise handoff summary. Write it in this format:*  
> ***What we were looking at** — the specific files, functions, or areas we investigated.*  
> ***What we found** — the exact issues, root causes, or decisions made. No vague summaries.*  
> ***What still needs to change** — a numbered list of specific edits, in the order they should happen.*  
> ***What to leave alone** — anything we explicitly decided not to touch and why.*  
> ***Open questions** — anything unresolved that the next model should know about.*  
> *If you cannot be specific on any point, say so explicitly. Do not pad.*

That summary becomes an explicit, high-signal anchor in the conversation. The next model will weight a clear, recent summary much more reliably than it will reconstruct understanding from a long back-and-forth. The "what to leave alone" section is the one most people skip — and it's the one that prevents the next model from helpfully touching things you already decided not to change.

### Use `/compact` when the conversation gets long

Copilot CLI's `/compact` command condenses the full conversation into a tight summary. This is useful not just for token efficiency — it means the essential findings are close to the top of the context, not buried under 20 turns of intermediate exploration. A smaller model at the end of a long session is working with less signal-to-noise than you think.

### Write an explicit handoff prompt when you switch

The first message after switching models sets the frame. Don't assume the new model will pick up where the last one left off with the same priorities. Say it explicitly:

> *"Based on the debugging above, we identified X as the root cause. Make only these targeted changes: [list]. Do not alter anything else."*  
> *"We scanned the codebase and the only areas relevant to this issue are [files/functions]. Ignore everything else. Start by looking only at these."*   
> *"We are not sure about [X]. Do not make assumptions about it. Either ask or skip it and note it as unresolved."*

This sounds obvious. It feels a little over-specified. But it's the difference between the model doing what you mean and the model doing something adjacent to what you mean.

### Use **Plan** mode for multi-step work.

If I know upfront that a session will involve multiple models and multiple phases, I start in Plan mode (`Shift+Tab`). The plan becomes a shared reference that survives model switches. Every model in the session can be pointed back to it. It's the closest thing to a consistent spec across a heterogeneous session. 

Just to stress on it, this is not same as using `/plan` command.

More on this later...

---

## The underlying principle

The thing to internalize is that AI models don't have memory in the way humans do. They have context. Context is a snapshot, not a running state. When you switch models, you're handing the next model a snapshot and asking it to resume execution — and the quality of that resume depends heavily on how well the snapshot captures what actually matters.

The CLI does the mechanical part automatically. The semantic part — making sure the new model understands what *you* understand about the problem — is on you.

Once I started treating model switches as explicit handoffs rather than seamless transitions, the quality of the final output got noticeably more consistent. It's a small habit shift with a larger-than-expected payoff.
