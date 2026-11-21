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

## Independently verify a repair export

Download evidence from the repair workbench, then run:

```sh
node verify-repair-cli.mjs counterfactual-repair-evidence.json
```

The CLI prints a compact JSON verdict. Exit **0** means verified, **1** means rejected or unsupported, and **2** means a usage/read/encoding/JSON error. It accepts a regular UTF-8 JSON file of at most 8 MiB, reads with a byte limit, and never prints input values in read/parse error messages. No dependencies, network requests, or credentials are needed.

`verify-repair.mjs` does not import the planner or its checker. It computes reachability through repeated edge scans and enumerates removal masks independently. For successful `repaired` and `already-safe` exports it verifies:

- Allowed removals, unsafe-state exclusion and required-goal reachability.
- Minimum cardinality and completeness of the reported alternatives.
- Lost reachable states and terminal-aware deadlocks.
- Replayable paths to required goals and unsafe paths when removed edges are restored.

The verifier deliberately returns `unsupported-status` for negative reports such as `impossible` and `budget-exhausted`; these are not certified. It does not validate the report's descriptive reason, original baseline summary or planner candidate-count metadata. Its own candidate count is recomputed. Graphs are limited to 128 states/edges and 12 editable edges; label arrays are bounded as well.

**Trust boundary:** verification establishes internal consistency relative to the supplied model and options. It is not a signature or provenance check: an attacker who changes both the model and its evidence can produce a different valid report. Preserve a trusted copy of the intended model and compare it before relying on a verdict. No production-system or eventual-progress guarantee follows.

Ten verifier/CLI tests passed locally, including altered evidence, omitted alternatives, nonminimal but individually necessary removals, 16 small subgraphs, invalid UTF-8 and oversized input. Together with the existing checker/planner suite, **29 tests passed locally**. Remote CI execution for this change has not been confirmed. The new verifier is a command-line/module feature; it does not change the deployed browser interface.

## Problem

A workflow can look reasonable while retaining a shortcut around its review step. This tool asks a precise question: can any sequence of the transitions you declared reach a state you marked unsafe?

## Working features

- Explicit finite-state graph validation and deterministic breadth-first search.
- Shortest counterexample by transition count; input-order tie breaking.
- Cycle handling, state/depth limits, and an honest inconclusive result when exploration is incomplete.
- Dead-end detection with separate intentional terminal states.
- Editable examples for approval bypass, repaired approval, and stranded queues.
- Replay controls and JSON export containing the model, search limits, and results.
- Twenty-nine behavior tests and a GitHub Actions workflow.

## Run

Node.js 22 or newer is recommended. No package dependencies or API keys are needed.

```sh
node --test test.mjs repair.test.mjs verify-repair.test.mjs
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

Tests cover shortest paths, unsafe initial states, cycles, search bounds, exact depth boundaries, terminal states, invalid schemas, unreachable unsafe states, and replay validity. Run them with `node --test test.mjs repair.test.mjs verify-repair.test.mjs`.

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
