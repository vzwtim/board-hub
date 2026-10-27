# Play, continue and play again

- `遊ぶ` opens the game's mode menu. It never implicitly starts CPU or resumes a saved match. Explicit CPU buttons still go directly to CPU mode.
- `つづきから遊ぶ` is the saved-match section on Home and My Page. `整理する` exposes per-match removal and an Undo action. Removal hides only this device's entry, never the live multiplayer room. A tombstone prevents background polling/autosave from immediately recreating removed cards; intentionally entering that game enables saving again.
- The game header returns to the page the user came from (Home, discovery, My Page, or a community detail). Same-origin return paths are allowlisted and stored per tab, so invitations and cross-game transitions also have a safe Home fallback. Returning to a mode menu preserves game variants and removes room/mode/resume flags.
- Local completion offers `もう一度遊ぶ` with the same local mode and player count. Multiplayer completion offers a rematch or another game supporting the current party size. Names, avatars, seat IDs and private membership authorities stay with the party. The first proposal creates one successor pointer; concurrent proposals converge. Other players see the prepared game and choose to follow, without another invitation link. Only participants can propose a successor and only after the current match finishes. Game rules, hands, actions and score are reset in a separate room; the previous result remains available.

## Installation

A manifest, standalone display, mask-safe 192/512px PNG icons, an Apple touch icon and Apple web-app metadata support home-screen installation. Mobile visitors see a compact banner on Home, discovery or My Page after the page settles. It never interrupts a game. Supporting browsers use their captured `beforeinstallprompt` event on a user tap; other browsers show menu/share instructions. Dismissal waits seven days before another automatic banner. My Page has a manual entry; standalone mode hides the promotion. This does not request push-notification permission and does not promise offline matches.

References: https://web.dev/learn/pwa/installation-prompt and https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable .

## Verification

Unit tests cover allowlisted return navigation, query preservation, removal/undo/background suppression, fresh successor state, private seat transfer, capacity restrictions, community rematch, authorization and concurrent successor selection. The built Worker/D1 smoke test completes real matches, changes games with two accounts, takes turns in the successor, rematches two guests, and checks the manifest and PNG assets.
