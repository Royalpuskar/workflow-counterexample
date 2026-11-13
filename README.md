# Workflow Counterexample

Find the shortest path to a forbidden state in an explicit workflow model. An interactive browser workbench combines bounded breadth-first search, dead-end reporting, and step-by-step counterexample replay.

## Problem

A workflow can look reasonable while retaining a shortcut around its review step. This tool asks a precise question: can any sequence of the transitions you declared reach a state you marked unsafe?

## Working features

- Explicit finite-state graph validation and deterministic breadth-first search.
- Shortest counterexample by transition count; input-order tie breaking.
- Cycle handling, state/depth limits, and an honest inconclusive result when exploration is incomplete.
- Dead-end detection with separate intentional terminal states.
- Editable examples for approval bypass, repaired approval, and stranded queues.
- Replay controls and JSON export containing the model, search limits, and results.
- Nine behavior tests and a GitHub Actions workflow.

## Run

Node.js 22 or newer is recommended. No package dependencies or API keys are needed.

```sh
node --test test.mjs
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

Tests cover shortest paths, unsafe initial states, cycles, search bounds, exact depth boundaries, terminal states, invalid schemas, unreachable unsafe states, and replay validity. Run them with `node --test test.mjs`.

See [ARCHITECTURE.md](ARCHITECTURE.md), [SECURITY.md](SECURITY.md), and [CONTRIBUTING.md](CONTRIBUTING.md).

## Limits and roadmap

“Safe” means no unsafe state is reachable **in the supplied finite graph**, after complete exploration. It is not a claim about source code or a deployed application. Deadlocks are diagnostic; they do not automatically make the safety result unsafe. The checker does not prove eventual progress, temporal properties, or fairness. State labels are case-sensitive.

The browser accepts up to 200000 input characters. The engine accepts up to 5000 transitions and 1000 unsafe labels. Exploration is capped at 10000 states and depth 200. Defaults are 1000 states and depth 50. Larger models need a different representation and resource strategy.

Roadmap: guarded Boolean-state models, graph visualization, and independently checked counterexample certificates. No external AI system is involved.

## License

MIT. Copyright 2026 Royalpuskar.
