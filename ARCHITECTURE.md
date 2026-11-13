# Exploration semantics

The engine builds an adjacency map, queues the initial state, and visits states breadth-first. A visited set prevents cycles from causing repeated expansion. Each queued entry includes its shortest known trace. The first unsafe state removed from the queue yields a minimum-length counterexample; transition input order breaks ties.

Unsafe membership is checked before expansion, including the initial state and nodes at the depth bound. If an unseen destination cannot be enqueued because a limit is reached, the search records incompleteness. It continues checking already-enqueued nodes and can still return a valid counterexample. Otherwise the final result is `inconclusive`, never `safe`. The incompleteness flag is conservative and may remain set even if later exploration reaches an earlier skipped state.

An exhausted queue without a violation or truncation returns `safe`. This is reachability safety only. A node with no outgoing edges is reported as a deadlock unless declared terminal. These are observed dead ends, not a proof that all possible executions terminate.

## Browser flow

Editor → schema validation → bounded search → report → optional trace replay/export.

Edits invalidate prior results and disable export until a new successful run. Output uses text nodes. Models are never executed as JavaScript, uploaded, or stored persistently. The export contains exactly the analyzed model and its limits, so reviewers can rerun `check(model, report.limits)`.
