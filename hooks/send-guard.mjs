// PreToolUse guard for Resend MCP tools.
// Blocks any send that could reach someone other than Resend test addresses
// (@resend.dev) or the owner's own email, read from the MY_EMAIL environment variable.
// Exit 2 = block, exit 0 = allow.
// Covers Resend tools only. Other email connectors (Gmail, Bird, etc.) are not guarded.

const ALWAYS_BLOCK = new Set([
  "send-broadcast",
  "create-automation",
  "send-inbox-draft",
  "send-new-inbox-email",
]);
const CHECK_ADDRESSES = new Set(["send-email", "send-batch-emails"]);

function block(reason) {
  console.error(`Blocked by send-guard: ${reason}`);
  process.exit(2);
}

let raw = "";
for await (const chunk of process.stdin) raw += chunk;

let call;
try {
  call = JSON.parse(raw);
} catch {
  block("could not read the tool call, so it was blocked to be safe.");
}

const toolName = String(call?.tool_name ?? "");
const shortName = toolName.replace(/^mcp__resend__/, "");
const input = call?.tool_input ?? {};

if (ALWAYS_BLOCK.has(shortName)) {
  block(`${shortName} can reach whole lists of people, so it is never allowed.`);
}

if (CHECK_ADDRESSES.has(shortName)) {
  const myEmail = (process.env.MY_EMAIL ?? "").trim().toLowerCase();

  // Pull every address out of a to/cc/bcc value: string, array, or "Name <a@b.com>".
  const addressesOf = (value) => {
    if (value == null) return [];
    const items = Array.isArray(value) ? value : [value];
    return items.flatMap((v) => {
      if (typeof v !== "string") return [String(v)];
      return v.split(",").map((s) => {
        const m = s.match(/<([^>]+)>/);
        return (m ? m[1] : s).trim();
      });
    }).filter(Boolean);
  };

  // send-batch-emails takes an array of emails (or { emails: [...] }); send-email is one email.
  let emails = [input];
  const batch = Array.isArray(input) ? input : (input.emails ?? input.batch ?? input.messages);
  if (shortName === "send-batch-emails") {
    if (!Array.isArray(batch)) block("could not find the emails in this batch, so it was blocked to be safe.");
    emails = batch;
  }

  for (const email of emails) {
    const addrs = ["to", "cc", "bcc"].flatMap((f) => addressesOf(email?.[f]));
    if (shortName === "send-email" && addrs.length === 0) {
      block("no recipient address found, so it was blocked to be safe.");
    }
    for (const addr of addrs) {
      const a = addr.toLowerCase();
      const ok = a.endsWith("@resend.dev") || (myEmail !== "" && a === myEmail);
      if (!ok) {
        block(`${addr} is not a @resend.dev address or your own email (MY_EMAIL).`);
      }
    }
  }
}

process.exit(0);
