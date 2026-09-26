# Agent Teams — Master Reference Guide

Source: <https://code.claude.com/docs/en/agent-teams> (captured 2026-09-26).
Agent teams are **experimental**; re-check the source page when behavior
seems to differ from what's written here, and note version-specific details
below (e.g. `v2.1.199+`).

This guide is written for Claude (the team lead) to plan, launch, and steer
effective agent teams. Part 1 is the playbook; Part 2 is the mechanics
reference; Part 3 covers failure modes.

---

## Part 1 — Playbook

### 1.1 Should this be a team at all?

Pick the lightest tool that does the job:

| Option | Use when | Cost |
| :-- | :-- | :-- |
| Single session | Sequential work, same-file edits, many dependencies, routine tasks | Lowest |
| Subagents | Focused workers where only the *result* matters; they report back to the caller | Low — results summarized back |
| Cross-session messaging | Passing findings between sessions the user runs themselves | — |
| Git worktrees | User manually runs parallel sessions, no automated coordination | — |
| **Agent team** | Workers must **share findings, challenge each other, and self-coordinate** | High — each teammate is a full Claude instance |

**Good fits for a team:**
- **Research and review** — parallel investigation of different aspects, then cross-challenge.
- **New modules/features** — each teammate owns a separate piece.
- **Debugging with competing hypotheses** — parallel theories, adversarial debate.
- **Cross-layer changes** — frontend / backend / tests each owned by one teammate.

**Bad fits:** sequential pipelines, multiple people editing the same file,
tightly coupled work, small routine tasks.

Decision checklist — use a team only if **all** are true:
1. The work splits into pieces that can proceed without waiting on each other.
2. The pieces touch **disjoint sets of files** (or are read-only).
3. Workers benefit from talking to each other (not just reporting back).
4. The value justifies roughly N× the token cost.

If the user is new to teams, prefer **read-only** work first (PR review,
library research, bug investigation) — it shows the value of parallelism
without the coordination hazards of parallel implementation.

### 1.2 Designing the team

**Size**
- Start with **3–5 teammates**. Three focused teammates often beat five scattered ones.
- Token cost scales linearly; coordination overhead and conflict risk grow faster; returns diminish.
- 15 independent tasks → start with 3 teammates.

**Task sizing**
- Too small → coordination overhead exceeds benefit.
- Too large → long stretches without check-ins, wasted effort.
- Just right → self-contained unit with a clear deliverable (a function, a test file, a review).
- Aim for **~5–6 tasks per teammate** so everyone stays busy and work can be reassigned if someone gets stuck.

**Roles**
- Give each teammate a **distinct lens or ownership area** so they don't overlap
  (e.g. security / performance / test coverage; UX / architecture / devil's advocate).
- **Assign file ownership explicitly.** Two teammates editing one file → overwrites.
- For adversarial investigations, make challenging others' theories part of each
  teammate's job — this counters anchoring bias.
- **Name teammates explicitly** (e.g. `researcher`, `security-reviewer`) so they can be
  addressed predictably later by the user, the lead, and each other.

**Models**
- Name the model per teammate in the spawn request when it matters
  (e.g. cheaper model for mechanical refactors, strongest model for architecture).
- Otherwise it falls through the precedence chain (see §2.4).

### 1.3 Writing spawn prompts

Teammates load CLAUDE.md, MCP servers, and skills automatically, but
**do not see the lead's conversation history**. The spawn prompt is their only
task context. Every spawn prompt should include:

- **Goal** — what "done" looks like and the deliverable format.
- **Scope** — exact paths/modules owned; what is explicitly out of scope.
- **Context** — facts from the conversation the teammate needs (tech choices, constraints, prior findings).
- **Focus** — the specific lens or questions to answer.
- **Coordination** — who to message, when; which files belong to others.
- **Reporting** — how to report (e.g. severity ratings, findings doc path).

Template:

```text
Spawn a teammate named <name> [using the <agent-type> agent type] [on <model>] with the prompt:
"<Goal>. You own <paths>; do not edit <other paths> (owned by <teammate>).
Context: <key facts>. Focus on <lens/questions>.
Coordinate with <teammate> by message when <condition>.
When finished, report <deliverable> with <format>."
```

Example from the docs:

```text
Spawn a security reviewer teammate with the prompt: "Review the authentication module
at src/auth/ for security vulnerabilities. Focus on token handling, session
management, and input validation. The app uses JWT tokens stored in
httpOnly cookies. Report any issues with severity ratings."
```

### 1.4 Proven prompt patterns

**Multi-angle exploration**
```text
Spawn three teammates to explore this from different angles:
one on UX, one on technical architecture, one playing devil's advocate.
```

**Parallel code review** — one lens each, lead synthesizes afterward:
```text
Spawn three teammates to review PR #142:
- One focused on security implications
- One checking performance impact
- One validating test coverage
Have them each review and report findings.
```

**Competing hypotheses (scientific debate)**:
```text
Spawn 5 agent teammates to investigate different hypotheses. Have them talk to
each other to try to disprove each other's theories, like a scientific
debate. Update the findings doc with whatever consensus emerges.
```

**Parallel implementation with a fixed model**:
```text
Spawn 4 teammates to refactor these modules in parallel. Use Sonnet for each teammate.
```

**Plan-first for risky work** — put the lead in plan mode first, then:
```text
Spawn an architect teammate to refactor the authentication module.
```

**Reusable role**:
```text
Spawn a teammate using the security-reviewer agent type to audit the auth module.
```

### 1.5 Running the team (lead discipline)

- **Delegate, then wait.** Don't start implementing teammates' tasks yourself.
  (User's corrective prompt: *"Wait for your teammates to complete their tasks before proceeding."*)
- **Don't declare victory early.** Verify every task is actually complete before wrapping up.
- **Monitor and steer.** Check progress, redirect failing approaches, synthesize findings as they arrive.
  Unattended teams waste effort.
- **Unstick tasks.** If a dependent task is blocked, check whether its prerequisite is really
  done and update status / nudge the owner.
- **Recover from stops.** If a teammate stops after an error, message it with instructions
  or spawn a replacement.
- **Synthesize.** The lead's final job is merging results into one coherent answer.
- **Shut down by name** when done: *"Ask the researcher teammate to shut down."*

### 1.6 Pre-flight checklist

- [ ] `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` is set (this project: `.claude/settings.local.json`).
- [ ] Session is interactive (teams never spawn under `-p` / Agent SDK).
- [ ] A team is justified (§1.1 checklist).
- [ ] 3–5 named teammates, distinct roles, disjoint file ownership.
- [ ] Each spawn prompt is self-contained (§1.3).
- [ ] Common operations pre-approved in permissions to limit prompt spam.
- [ ] Quality-gate hooks configured if needed (§2.8).
- [ ] Plan mode on the lead first if teammates should plan before editing.

---

## Part 2 — Mechanics reference

### 2.1 Enabling

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

- Set in shell env or any settings.json. Without it: no team set up, no team dirs written,
  Claude doesn't spawn or propose teammates.
- **Side effect:** while enabled, any subagent Claude **names** launches as a teammate —
  teams can form even without being asked.
- Disable with `"0"`. Settings-file `env` changes apply live on save; the variable is reread
  at every spawn. Precedence: user < project < local < `--settings` < managed; a `1` in a
  higher source wins over a `0` in a lower one.
- **Non-interactive (`-p`) and Agent SDK sessions never spawn teammates**; named subagents
  run as ordinary subagents there.

### 2.2 How a teammate is launched

Claude calls the Agent tool **with a `name`** while teams are enabled →
teammate. Exceptions (these stay subagents): **fork** calls, and calls passing
**`isolation`**. No user confirmation is requested. If subagents appear instead
of a team, ask explicitly for "an agent team" (both show in the same agent panel,
so the panel alone doesn't prove a team formed).

### 2.3 Architecture

| Component | Role |
| :-- | :-- |
| Team lead | Main session; spawns teammates, coordinates — fixed for session lifetime |
| Teammates | Separate Claude Code instances working assigned tasks |
| Task list | Shared work items teammates claim and complete |
| Mailbox | Messaging between agents |

Storage (team name = `session-` + first 8 chars of session ID):
- Team config: `~/.claude/teams/{team-name}/config.json` — runtime state (session IDs, tmux pane IDs),
  `members` array (name, agent ID, agent type; lead is `team-lead`). Teammates can read it to
  discover each other. **Never hand-edit or pre-author** — overwritten. Removed at session end.
- Mailboxes: `~/.claude/teams/{team-name}/inboxes/{agent-name}.json`. Malformed entries are
  reported and dropped; valid ones still deliver (v2.1.207+). Send reports success only if the
  write succeeds.
- Task list: `~/.claude/tasks/{team-name}/` — persists for resumed sessions; retention follows `cleanupPeriodDays`.
- There is **no project-level team config**; a `.claude/teams/teams.json` in a repo is just a file.
  For reusable roles, use subagent definitions (§2.5).

### 2.4 Model selection precedence

1. Model named in the spawn prompt for that teammate.
2. Subagent definition's `model` (`inherit` = lead's model).
3. `CLAUDE_CODE_SUBAGENT_MODEL` (if not `inherit`).
4. Lead's current model.

- `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` (v2.1.257+) skips 1–2.
- `teammateDefaultModel` was removed (v2.1.234) — name the model in the prompt.
- Org `availableModels` allowlist: blocked family alias → newest permitted version of that family
  (Anthropic API / Claude Platform on AWS); any other blocked value → lead's model.
- Teammates inherit the lead's **effort level**. Model and fast mode are **fixed at spawn**;
  `/model` and `/fast` only change the lead; `/effort` affects viewed teammate's later turns.

### 2.5 Subagent definitions as teammate roles

Define a role once (e.g. `.claude/agents/security-reviewer.md`) and reuse it as
both a subagent and a teammate. What carries over:

| Field | In-process teammate | Split-pane teammate |
| :-- | :-- | :-- |
| `tools` | Limited to list, **plus** `SendMessage` (and `TaskCreate/Get/List/Update` when Task tools available) | Limited to list |
| `model` | Used if spawn prompt names none | Same |
| Body | **Appended** to default system prompt | **Replaces** default system prompt |
| `skills` | Ignored — loads project/user skills | Ignored |
| `mcpServers` | Ignored — loads project/user MCP | Applied per subagent rules |

- A stopped in-process teammate that gets messaged is revived in the same session with its saved conversation.
- On revival, definitions from project `.claude/agents/` or `--add-dir` are re-applied only if
  **that exact folder is trusted** (parent trust doesn't count); otherwise the teammate returns
  without the definition's tools/instructions.

### 2.6 Tasks and communication

- Task states: **pending → in progress → completed**. Tasks can depend on others; blocked tasks
  can't be claimed. Completing a task auto-unblocks dependents.
- Assignment: **lead assigns** explicitly, or teammates **self-claim** the next unassigned,
  unblocked task. Claiming uses file locks (no races).
- Agents without Task tools coordinate by messages only.
- Messaging is **by name, one recipient per message** — no broadcast; message each teammate to reach everyone.
- Delivery is automatic (no polling). When a teammate stops, the lead gets an **idle
  notification including its final answer**; API-error stops notify with the error text.
- Teammates get: CLAUDE.md, MCP servers, skills, and the spawn prompt. **Not** the lead's history.
  `--setting-sources` restrictions propagate to teammates (split-pane too, v2.1.281+).

### 2.7 Permissions and trust

- Teammates start with the lead's permission mode — **except `dontAsk`**, which isn't inherited.
  `--dangerously-skip-permissions` on the lead propagates to all.
- Per-teammate modes can be changed after spawn, not set at spawn.
- Teammate permission prompts surface **in the lead session** for the user to approve.
- **Plan approval is automatic:** a teammate's plan-approval request is granted by the lead
  session immediately without review. Edits/commands afterward still hit normal permission prompts.
- Inter-agent messages are marked as coming from another Claude session, **not the user**.
  A teammate cannot grant consent on the user's behalf or relay a denied action to another
  teammate. In auto mode, the classifier treats relayed approvals as untrusted and can block messages.

### 2.8 Quality-gate hooks

| Hook | Fires when | Exit code 2 does |
| :-- | :-- | :-- |
| `TeammateIdle` | Teammate is about to go idle | Sends feedback, keeps it working |
| `TaskCreated` | Task is being created | Blocks creation, sends feedback |
| `TaskCompleted` | Task is being marked complete | Blocks completion, sends feedback |

Use `TaskCompleted` to enforce "tests pass before done", `TeammateIdle` to catch premature stopping.

### 2.9 Display modes and UI

- **In-process** (default): all teammates in the main terminal. Agent panel below the prompt:
  ↑/↓ select, **Enter** open transcript + message, **Esc** clear selection (interrupts turn while
  viewing), **x** stop teammate, **Ctrl+T** toggle task list. While viewing a teammate, plain text
  and skills go to it; built-in commands run in the lead.
- **Split panes**: one pane per teammate; needs tmux or iTerm2 + `it2` CLI (Python API enabled).
  Not supported in VS Code terminal, Windows Terminal, or Ghostty.
- Setting: `"teammateMode"` in `~/.claude/settings.json` — `"in-process"` (default), `"auto"`,
  `"tmux"`, `"iterm2"`. Per session: `claude --teammate-mode auto` (hidden flag).
- Idle rows (v2.1.199+) stay while anything is working; hide 30s after the whole panel is idle,
  reappear on the next turn (teammate still running). >3 idle rows collapse into `N idle agents`.

### 2.10 Token cost notes

- Usage scales with active teammates; worthwhile for research, review, new features; wasteful for routine work.
- In-process teammate prompt cache defaults to **5 min** TTL; set `subagentPromptCacheTtl: "1h"`
  to extend (1-hour cache writes bill higher).

---

## Part 3 — Failure modes and fixes

| Symptom | Cause / fix |
| :-- | :-- |
| Teammates don't appear | Check agent panel; idle rows may be hidden (message by name to revive). Task may be too simple. For split panes: `which tmux`, or verify `it2` + Python API. |
| Subagents spawned instead of team | Ask explicitly for an agent team. |
| Teammates spawned when a subagent was wanted | Named subagents become teammates while enabled; set the env var to `0`. |
| Permission prompt flood | Pre-approve common operations before spawning. |
| Teammate stops after error | Message it with instructions, or spawn a replacement. Messaging also skips a pending API retry delay. |
| Lead stops early / does the work itself | Tell it to keep going / wait for teammates. |
| Dependent task stuck | Owner forgot to mark complete — verify and update status or nudge. |
| Teammates gone after `/resume` or `/rewind` | In-process teammates aren't restored; spawn new ones. |
| Slow shutdown | Teammates finish current request/tool call first. |
| Orphaned tmux session | `tmux ls` then `tmux kill-session -t <name>`. |
| Mailbox write error | Disk full / dir not writable; nothing was sent. |

### Hard limits

- One team per session; can't share across sessions or create more named teams.
- **No nested teams** — only the lead spawns teammates.
- In-process teammates can't run background subagents (`background: true` errors;
  `run_in_background` fails or runs foreground).
- Lead is fixed — no promotion or transfer.
- Permission modes can't be set per-teammate at spawn.
- Split panes limited to tmux / iTerm2.
