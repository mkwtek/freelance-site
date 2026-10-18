# Freelance web dev business site: project notes for Claude Code

Read this first in every session.

## What this is

The website for a freelance web development and consulting business (a DBA under the owner's LLC).
Static HTML/CSS/JS in this folder, planned for GitHub Pages, possibly with a Namecheap domain later.

- `index.html`: the whole one-page site
- `styles.css`: all styles and color tokens
- `script.js`: progressive enhancements only (menu, meter needles, reveal); the page works without it
- `images/`: case-study screenshots, portrait, favicon

## The name is a placeholder

The business name isn't chosen yet. Every spot uses the literal text **Business Name**, and contact
details use **yourdomain**. When the name is chosen, search the project for both and replace them.
The Formspree form ID is also a placeholder: `YOUR_FORM_ID` in `index.html`.

Naming history and rejected names live in Claude's memory, not here.

## Look and feel

Vintage cartoon meets analog tech: a 1950s TV with color bars and rabbit ears, dials and knobs,
gauge meters, a tattoo-flash quarter spiderweb in the hero corner, a cartoon ghost peeking out.
Related to Atomic Afterlife's retro feel but not a copy. Fonts: Shrikhand (display), DM Sans (body),
Space Mono (labels), Pirata One (blackletter "Old-school" and "Analog soul"), VT323 (footer "digital solutions").

## Color palette (each color has one job)

- Base: warm white #fff7f0, oatmeal #efe6d3, ink #221f1b
- Primary, teal: bright teal #6cc4bf (hero), dark teal #14595a (links, card labels), faded mint
  #dcebe6 (alt section)
- Hero shape teal #4eaea8: the swoop fin and lounge panel behind the hero text only (ink text on it 6.2:1)
- Checkerboard: ink and warm white, the band along the bottom of the hero only
- Dark sections and footer: ink #221f1b (gauge panel #2c2823)
- Accent fills, harvest gold #ebbd4e, ALWAYS with a black outline (tags, primary buttons, step numbers,
  "Built and tuned" header, legal box top bar). Ink text on gold 9.3:1. Never gold text on light backgrounds.
- Accent text, brick red #a63a24: card headings, "Why it matters", quote marks, list markers.
- Color-bar stripe: the TV's exact bar colors and order, 0.5rem tall, under the header and atop dark sections.
- Hero pink #f27aa6: headline highlight stripe only
- Highlight, yellow: #fbe39b / #f4cf5c, small callouts only (site check box, scores, pull quote)
- Color-bar rainbow: only inside the TV illustration, never in the interface
- Rejected (don't bring back): bright/hot pink, purple-leaning magenta, wine, portfolio magenta
  #a10171 (too bright), light pink backgrounds, heavy yellow section backgrounds.
- Don't add a new color without giving it a role here.

## Privacy rules

- Atomic Afterlife is described only as "a small-business client". Never describe its owner.
- No home address, account details, costs or business-structure details in tracked files.
- Private files live in `../Freelance Web Dev PRIVATE (not on GitHub)/`.

## Working rules

- Ask before changing copy or wording that wasn't requested. Offer options with examples first.
- No em dashes in writing.
- Text, containers and grids in `rem`; breakpoints in `em`; px only for borders, shadows, small details.
  Never set `html { font-size: ... px }`.
- No background-color or color fades on buttons. Swap colors instantly; transform and shadow can animate.
- Respect `prefers-reduced-motion`.
- Target WCAG 2.1 AA at minimum, AAA contrast where practical. Process language only, never claim certification.
- Test at 440px and 375px phone widths plus desktop, and at browser font sizes 16, 20 and 24
  (Chrome's real font-size setting, not just zoom). Big display type gets a px cap inside clamp();
  grid columns use minmax(0, 1fr) so content can't push them wider than the screen. Background:
  /Users/Shared/Atomic-Afterlife-FONT-SIZE-RENDERING-SUMMARY.txt
- Main menu: full labels on one line, Menu button below 66em. Adding a menu item means re-measuring that width.
- Bump the `?v=` tag in `index.html` on every CSS or JS change.
- Git: new commits only (never amend or rebase), plain commit messages with no AI or co-author lines,
  never change git config. The developer commits and pushes through GitHub Desktop.
