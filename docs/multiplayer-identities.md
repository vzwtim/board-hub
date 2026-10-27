# Invitation participants

Invitation URLs contain `join=1` and only a public room ID. Opening one shows the participant chooser over the current game, including in a second tab of the host's browser. No seat capability is included or read on that entry. Closing the chooser leaves an observer with a visible entry to reopen it.

Guests enter a display name (optional) without registration. Each join gets a fresh guest ID and a secret seat capability, stored in sessionStorage for that tab and room. Reload resumes the seat. Explicit guest choice remains guest even if the browser has an account cookie. Closing the tab can lose guest access; signing in is the durable option.

Signed-in users can join with their account name and avatar. The server binds the seat to the authenticated account, recovers it on later visits without a bearer token, and makes repeated joins idempotent. Account changes cannot reuse the previous user's capability. A requested account ID must match the session cookie. Google login is offered when the existing OAuth configuration is available and preserves the invitation destination.

The server requires both guest identity and capability for guest actions. Guest IDs alone are not authentication. Account membership uses the trusted session cookie; client headers cannot impersonate accounts. Identities and capability hashes stay out of room responses, game state, logs, invite links and replays. D1's credentials column uses a versioned envelope; legacy plain hash maps and their capabilities remain readable. Only ordinary resume URLs can migrate a legacy browser token once; invitations never migrate one.

## Verification

- `npm test`: server authority, account recovery/idempotence, guest isolation, tab storage, account switching, legacy serialization and capability migration, plus the existing game suite.
- `node scripts/smoke-accounts.mjs`: built Worker + D1 with two seeded account sessions; explicit guest while signed in; separate guest turns; restore and unauthorized actions; all invitation services and a four-player room.
- `node scripts/smoke-cloudflare.mjs`: empty database bootstrap and existing client compatibility.
- Production UI: create a room, open the share link in a second tab, choose a different guest, alternate moves, reload both tabs and verify each seat.
