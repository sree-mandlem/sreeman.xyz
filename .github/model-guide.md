# Copilot CLI — Model Selection Guide

When picking a model for a task, use this table as a reference.
Prefer the newest iteration within the same family and cost tier.

### Design & Architecture

| Ideal for | Meaning | Best model | Cost |
|---|---|---|---|
| Architecture | Defining system structure, boundaries, and technical direction | GPT-5.4 | standard |
| Planning | Breaking work into steps and deciding execution order | GPT-5.2 | standard |
| Strategy | Choosing higher-level technical approach | Claude Opus 4.6 | premium |
| Design | Shaping solutions before implementation | Claude Opus 4.6 | premium |

### Implementation

| Ideal for | Meaning | Best model | Cost |
|---|---|---|---|
| Coding | Writing new implementation code | GPT-5.3-Codex | standard |
| Refactoring | Improving structure without changing behavior | GPT-5.1-Codex-Max | standard |
| Debugging | Finding and fixing defects | GPT-5.1-Codex-Max | standard |
| Editing | Making small, precise code changes | GPT-5.1-Codex-Mini | fast/cheap |

### Research & Analysis

| Ideal for | Meaning | Best model | Cost |
|---|---|---|---|
| Research | Gathering information and comparing options | Claude Sonnet 4.6 | standard |
| Analysis | Interpreting findings and identifying patterns | Claude Sonnet 4.6 | standard |
| Reasoning | Working through complex logic carefully | Claude Sonnet 4.6 | standard |
| Synthesis | Combining information from many sources | Claude Sonnet 4.6 | standard |
| Exploration | Investigating an unfamiliar codebase or problem space | Gemini 3 Pro (Preview) | standard |

### Review & QA

| Ideal for | Meaning | Best model | Cost |
|---|---|---|---|
| Reviewing | Evaluating code changes for bugs or risks | GPT-4.1 | fast/cheap |
| Scanning | Fast broad inspection of files or results | Claude Haiku 4.5 | fast/cheap |

### Quick / Low-Stakes

| Ideal for | Meaning | Best model | Cost |
|---|---|---|---|
| Triage | Quickly assessing issues or incoming work | GPT-5.4 mini | fast/cheap |
| Drafting | Producing fast first-pass content or code | GPT-5.4 mini | fast/cheap |

## Rules

- Within the same model family and cost tier, always prefer the higher version number.
- Use `fast/cheap` models for quick, low-stakes tasks (triage, scanning, drafting).
- Reserve `premium` (Opus) for high-stakes decisions: architecture strategy and system design.
- Use `/model` in the CLI to switch models mid-session.
