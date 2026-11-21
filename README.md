# Workflow Counterexample

<!-- portfolio-website:start -->
## Website

[Open workflow-counterexample website](https://royalpuskar.github.io/workflow-counterexample/)

GitHub Pages deployment was confirmed during portfolio setup.
<!-- portfolio-website:end -->

Find the shortest path to a forbidden state in an explicit workflow model. An interactive browser workbench combines bounded breadth-first search, dead-end reporting, and step-by-step counterexample replay.

## Counterfactual repair workbench

[Open the repair workbench](https://royalpuskar.github.io/workflow-counterexample/repair.html) · [Planner source](repair.mjs) · [Planner tests](repair.test.mjs)

The planner asks a second question: **what is the smallest allowed change that makes every unsafe state unreachable while preserving a path to each required goal?**

Choose editable transitions and a required destination in `repair.html`. Compare every minimum-cardinality removal set, lost reachable states, remaining deadlocks, and witness paths to preserved goals. Restoring each removed edge produces an unsafe witness explaining why that removal is necessary. Export contains the model, options, and complete results; the page displays up to 30 alternatives.

```js
import { planRepairs } from './repair.mjs';
const result = planRepairs(model, {
  editable: [0, 1, 2, 3],
  goals: ['Published'],
  maxRemovals: 4
});
```

Edge identities are zero-based positions in `model.transitions`. Protected edges cannot be removed. Enumeration proceeds by removal-set size, checking every smaller candidate before reporting a minimum. Reachability is explored exhaustively for each candidate. The planner supports 128 states/edges and at most 12 editable transitions (at most 4096 candidate sets). A removal budget that ends before all subsets are checked produces `budget-exhausted`, not an impossibility claim.

Goals require **existence of a path**, not eventual progress or fairness. Deadlocks are diagnostic and do not invalidate a repair. Only edge removal is supported; this is not automatic source-code repair, an AI model, or proof of production safety. All computation stays in the browser; no login, credentials, API keys, or uploaded data are required. Do not put secrets in models or exported evidence.

Validation: 19 local Node tests passed (9 original checker tests and 10 planner tests), including an independent exhaustive oracle over small graphs, parallel edges, protected choices, budgets, immutability, and extra-field index tampering. JavaScript syntax was checked. The deployed repair page was verified in a desktop browser: the sample finds a two-edge repair preserving Published, a budget of one reports budget-exhausted, changing settings disables stale export, and expanded necessity evidence shows unsafe paths when each removed edge is restored. Mobile/4K layouts and downloaded export contents remain unverified.

## Problem

A workflow can look reasonable while retaining a shortcut around its review step. This tool asks a precise question: can any sequence of the transitions you declared reach a state you marked unsafe?

## Working features

- Explicit finite-state graph validation and deterministic breadth-first search.
- Shortest counterexample by transition count; input-order tie breaking.
- Cycle handling, state/depth limits, and an honest inconclusive result when exploration is incomplete.
- Dead-end detection with separate intentional terminal states.
- Editable examples for approval bypass, repaired approval, and stranded queues.
- Replay controls and JSON export containing the model, search limits, and results.
- Nineteen behavior tests and a GitHub Actions workflow.

## Run

Node.js 22 or newer is recommended. No package dependencies or API keys are needed.

```sh
node --test test.mjs repair.test.mjs
python3 -m http.server 8000
```

Open `http://localhost:8000`. Select the approval-bypass example and choose **Explore state space**. The legacy publish edge reaches the unsafe state in one step. Select the repaired example and explore again: its reachable graph is exhausted without that unsafe state. Set maximum depth to zero to see an inconclusive result.

## Model format

```json
{
  "initial": "Draft",
  "unsafe": ["Published without review"],
  "terminal": ["Published"],
  "transitions": [
    {"from": "Draft", "action": "Legacy publish", "to": "Published without review"}
  ]
}
```

States and action labels are nonempty strings up to 120 characters. Transitions are explicit possible actions, not executable code. `terminal` only suppresses dead-end warnings; it does not stop exploration of outgoing edges. Every edge is treated as enabled. To model guards or variables, encode the resulting conditions into separate state names.

## Architecture and validation

`engine.mjs` validates and explores the graph without a DOM. `examples.mjs` contains synthetic fixtures. `app.mjs` handles editing, analysis, replay, and export. The engine leaves inputs unchanged and never evaluates code from a model.

Tests cover shortest paths, unsafe initial states, cycles, search bounds, exact depth boundaries, terminal states, invalid schemas, unreachable unsafe states, and replay validity. Run them with `node --test test.mjs repair.test.mjs`.

See [ARCHITECTURE.md](ARCHITECTURE.md), [SECURITY.md](SECURITY.md), and [CONTRIBUTING.md](CONTRIBUTING.md).

## Limits and roadmap

“Safe” means no unsafe state is reachable **in the supplied finite graph**, after complete exploration. It is not a claim about source code or a deployed application. Deadlocks are diagnostic; they do not automatically make the safety result unsafe. The checker does not prove eventual progress, temporal properties, or fairness. State labels are case-sensitive.

The browser accepts up to 200000 input characters. The engine accepts up to 5000 transitions and 1000 unsafe labels. Exploration is capped at 10000 states and depth 200. Defaults are 1000 states and depth 50. Larger models need a different representation and resource strategy.

Roadmap: guarded Boolean-state models, graph visualization, and independently checked counterexample certificates. No external AI system is involved.

## License

MIT. Copyright 2026 Royalpuskar.


<!-- portfolio-rights:start -->
## Copyright

© 2026 Puskar (Royalpuskar). All rights reserved except the permissions expressly granted by this repository’s MIT License. Third-party rights and notices remain with their owners.
<!-- portfolio-rights:end -->
