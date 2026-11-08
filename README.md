# studio-kit

Reusable tools for running an email studio in Claude Code. Install it once, then use it in any business or client repo.

## What's inside

| Part | What it does |
| --- | --- |
| `hooks/send-guard.mjs` + `hooks/hooks.json` | Blocks Resend sends to anyone except `@resend.dev` test addresses and your own email (`MY_EMAIL`). Always blocks broadcasts, automations and inbox sends. |
| `skills/personalize/` | `/studio-kit:personalize campaigns/<name>` writes one version of each email per lead group. |
| `agents/email-reviewer.md` | A read-only subagent (Read, Glob, Grep) that reviews drafts against the repo's voice guide and email rules. |
| `scripts/review.mjs` + `review/findings.schema.json` | A headless review that needs no one typing, so it can run on every pull request. Saves `review/findings.json`; exit 0 clean, 1 any high-severity finding, 2 the run failed. |

## Install

From a local copy:

```
/plugin marketplace add D:\Projects\Automation Projects\studio-kit
/plugin install studio-kit@studio-kit
```

Or from GitHub once pushed: `/plugin marketplace add <owner>/studio-kit`.

## What each business supplies

The plugin carries no business content. Each repo needs its own:

- `brand/voice.md`: voice, words to use and avoid, claims never to make
- `.claude/rules/emails.md`: the email rules (length, links, sign-off, footer)
- `leads/CLAUDE.md` (with a "Groups" section) and `leads/leads.csv`
- `campaigns/<name>/emails/*.md`: the drafts
- `review/criteria.md`: what this business treats as high severity, in plain bullets
- `MY_EMAIL` set in your environment, for the send guard

### Why these stay in each business's repo

- They are different for every business. Voice, rules and legal lines belong to the business, not the kit.
- Updating the plugin must never overwrite them.
- Leads and campaigns can contain private or subscriber information, which should not sit in a shared kit.

## Limits

- The send guard covers Resend only. Other email connectors (Gmail, Bird and so on) are not guarded.
- Without `MY_EMAIL` set, only `@resend.dev` addresses are allowed.
- The folder layout above is fixed. A repo laid out differently needs those files or small edits.
- `review.mjs` runs from the business repo root. It uses `ANTHROPIC_API_KEY` if set, otherwise your Claude login, and needs Node and the `claude` CLI on your PATH. In CI it needs a key with credit.
- If a repo already has its own copy of the send guard, enabling the plugin runs both. Remove one.
