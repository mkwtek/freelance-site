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
Space Mono (labels).

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
- Test at 440px and 375px phone widths plus desktop, and at browser font sizes 16, 20 and 24.
- Bump the `?v=` tag in `index.html` on every CSS or JS change.
- Git: new commits only (never amend or rebase), plain commit messages with no AI or co-author lines,
  never change git config. The developer commits and pushes through GitHub Desktop.
