# BoardHub UI foundations

Sources reviewed: [Carbon modal guidelines](https://www.carbondesignsystem.com/building-blocks/core/components/modal/guidelines), [modal specifications](https://www.carbondesignsystem.com/building-blocks/core/components/modal/specifications), [header accessibility](https://www.carbondesignsystem.com/building-blocks/core/components/ui-shell-header/accessibility).

- Profile is a temporary overlay, independent from My Page. Opening, editing, saving, dismissing and logging out must keep the current URL and mounted game intact.
- Native dialog supplies modal focus containment, background inertness and Escape semantics. Close and cancel discard only after a dirty-state confirmation; never save on dismissal. Restore focus to the opener.
- Profile, edit and account details replace the contents of one dialog. Never stack profile dialogs. On mobile use a bottom sheet with a visible close button and safe area padding; on desktop use a 440px centered dialog.
- Guest sign-in opens a separate tab; returning refreshes account identity without reloading the game.
- Spacing uses a 4px base: 8px between related controls, 16/24px between groups. Icon buttons have 44px targets with 18–20px glyphs. Avatar visual diameter is 30px in a 44px hit target.
- Shared game toolbar: back affordance and game title on the left, help/history/audio and identity on the right. Desktop height 64px, mobile 56px. A divider separates game tools from identity.
- Chrome stays neutral; blue communicates an active or primary action. Titles and action groups may not wrap or change toolbar height. Long game names truncate while controls remain visible.
- Every icon button has an accessible name, hover description and visible keyboard focus. Reduced-motion preference removes dialog entrance animation.
