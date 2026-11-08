---
name: personalize
description: Write a version of each campaign email for every lead group in leads/leads.csv. Use when a campaign's emails are final and you want one copy per group.
argument-hint: "[campaign folder]"
context: fork
allowed-tools: Read, Glob, Grep, Write
---

# Personalize a campaign for each lead group

Campaign folder given: `$ARGUMENTS`

## Step 1: check the input

If no campaign folder was given above, stop. Do not write anything. Use Glob on `campaigns/*/` and reply with the list of campaign folders that exist, plus a reminder to run `/studio-kit:personalize campaigns/<name>`.

If a folder was given but `<campaign folder>/emails/` has no `.md` files, stop and say so.

## Step 2: read what you need

1. Read `leads/CLAUDE.md` and use its "Groups" section for each group's description and angle. If the file or section is missing, stop and say so.
2. Read `leads/leads.csv` and list the distinct values in the `group` column. If a group appears that is not described in `leads/CLAUDE.md`, stop and tell the user instead of guessing.
3. Read `brand/voice.md` and `.claude/rules/emails.md`. Every version must follow both. If either is missing, stop and say so.
4. Use Glob to find every file in `<campaign folder>/emails/*.md` and read each one.

## Step 3: write one version per email per group

For every email file and every group, write a new file at
`<campaign folder>/groups/<group>/emails/<same file name>`.

Each version must stay identical to the original in:
- the `Subject:` and `Preview:` lines
- the link and its button text
- prices, discount codes, dates and promise wording
- the sign-off and the footer, including placeholders such as `{{first_name}}`

Change only two things:
1. **The opening line** (the first sentence after the greeting), so it fits the group.
2. **One example or sentence in the body**, so it fits the group. Replace an existing sentence. Don't add extra paragraphs.

Use each group's description and angle from `leads/CLAUDE.md` to decide how the wording fits that group.

## Rules for every version

- Follow the voice, wording and claims rules in `brand/voice.md` and the email rules in `.claude/rules/emails.md`, including length and link limits.
- Don't change an email's meaning, send timing or offer. If an email is a code email, it stays a code email.
- Never edit the original files in `<campaign folder>/emails/`. Never touch `leads/`.

## Step 4: reply with a short summary only

Reply with just:
- how many files you wrote
- one example opening line per group

Do not paste the emails or describe each file.
