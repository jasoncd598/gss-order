---
name: GSS Order Portal
description: Trade ordering portal where every job a customer ordered hangs in their own collection catalogue, ready to reorder.
colors:
  enamel-wall: "#1c2b5a"
  enamel-wall-deep: "#131e40"
  enamel-wall-soft: "#2a3b6e"
  enamel-blue-mid: "#2a4079"
  enamel-blue-pale: "#dbe1f0"
  cast-brass: "#b38b3b"
  brass-light: "#d4b06a"
  brass-deep: "#7c5f24"
  archival-board: "#e4e2dc"
  board-rule: "#d4d1c9"
  board-rule-strong: "#bcb8ae"
  label-stock: "#f4f2ec"
  card-white: "#ffffff"
  ink: "#12110f"
  ink-body: "#35332e"
  ink-muted: "#56534c"
  stamp-red: "#a5352a"
  verdigris: "#355e47"
  ochre: "#8c6015"
  plum: "#5a3d5d"
typography:
  display:
    fontFamily: "Bodoni Moda, Bodoni 72, Didot, serif"
    fontSize: "clamp(2.75rem, 5vw, 3.75rem)"
    fontWeight: 400
    lineHeight: 1.02
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Bodoni Moda, Bodoni 72, Didot, serif"
    fontSize: "2.5rem"
    fontWeight: 400
    lineHeight: 1.06
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Bodoni Moda, Bodoni 72, Didot, serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.625
  ui:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
  label:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "0.1em"
  stamp:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "0.09em"
  accession:
    fontFamily: "Courier Prime, Courier New, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    letterSpacing: "0.02em"
    fontFeature: "tnum"
rounded:
  sm: "2px"
  md: "2px"
  lg: "3px"
  xl: "4px"
  2xl: "6px"
spacing:
  gutter: "16px"
  gutter-wide: "32px"
  card-pad: "20px"
  label-pad: "24px"
  section: "80px"
  section-wide: "112px"
components:
  button-primary:
    backgroundColor: "{colors.cast-brass}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
    typography: "{typography.ui}"
  button-primary-hover:
    backgroundColor: "{colors.brass-light}"
  button-primary-hero:
    backgroundColor: "{colors.cast-brass}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "14px 24px"
  button-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.label-stock}"
    rounded: "{rounded.sm}"
    padding: "12px 24px"
  button-wall-outline:
    backgroundColor: "{colors.enamel-wall}"
    textColor: "{colors.label-stock}"
    rounded: "{rounded.sm}"
    padding: "14px 24px"
  input-field:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "10px 14px"
  card-catalogue:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.ink-body}"
    rounded: "{rounded.lg}"
    padding: "{spacing.card-pad}"
  catalogue-label:
    backgroundColor: "{colors.label-stock}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "{spacing.label-pad}"
  nav-rail:
    backgroundColor: "{colors.enamel-wall}"
    textColor: "{colors.enamel-blue-pale}"
    width: "256px"
  nav-item-active:
    backgroundColor: "{colors.label-stock}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
  top-bar:
    backgroundColor: "{colors.label-stock}"
    textColor: "{colors.ink}"
    height: "64px"
  stamp-ochre:
    backgroundColor: "#f8f1e1"
    textColor: "{colors.ochre}"
    typography: "{typography.stamp}"
    rounded: "{rounded.sm}"
    padding: "2px 7px"
  stamp-green:
    backgroundColor: "#edf3ef"
    textColor: "{colors.verdigris}"
    typography: "{typography.stamp}"
    rounded: "{rounded.sm}"
    padding: "2px 7px"
  stamp-red:
    backgroundColor: "#f8ecea"
    textColor: "#8c2c23"
    typography: "{typography.stamp}"
    rounded: "{rounded.sm}"
    padding: "2px 7px"
---

# Design System: GSS Order Portal

## Overview

**Creative North Star: "The Collection Catalogue"**

A trade customer's order history is treated as a museum collection. Every job GSS made hangs on an enamel-blue gallery wall or sits in a warm archival reading room, carrying its catalogue label: an accession number (the plate ref), provenance (the approved proof), last run and price. Status is never a soft pill; it is a registration stamp, inked in its state colour, set by the event that happened.

The world has two renditions. The public landing (Persuade) lets the wall own whole rooms: the first viewport and the pricing room are full-bleed enamel blue, with label-stock cards hung on one sightline and lit by soft gallery shadows. The portal, staff admin, auth and invoice screens (Operate) borrow only type, palette, density and the signature move: an enamel-blue rail, a label-stock top bar, white catalogue cards on archival board, accession-typed refs and stamped statuses. The user should know where everything is before noticing the world.

Density is that of a working register: 12-13px UI text, hairline rules, figures set in a ledger strip rather than big-number tiles. Corners are crisp (2-3px). Ornament is limited to what a real catalogue has: brass hairline frames, Bodoni titles, typed numbers, stamps.

**Key Characteristics:**
- Enamel-blue wall (nav rail, hero, pricing, auth backdrop) against warm archival board reading rooms.
- Cast brass is the single action colour; ink text sits on it.
- Bodoni Moda for titles only; Hanken Grotesk for every UI word; Courier Prime with tabular figures for refs, quantities and money.
- Every status is a registration stamp; every plate or order ref is an accession label.
- Near-square corners (2px), 1px board rules, soft diffuse shadows only where a card hangs on the wall or floats as a menu.

## Colors

A museum palette: enamel blue and cast brass carry the world, a warm archival board holds the reading rooms, and four inked state colours appear only where a status means something. The legacy Tailwind scales are re-pointed at this palette in `app/globals.css` (zinc to board/ink, amber to brass, blue/indigo/sky to enamel, emerald to verdigris, red to stamp red, yellow to ochre, purple to plum), so utility classes inherit the world.

### Primary
- **Enamel Wall** (enamel-wall): the gallery wall. Nav rail, landing hero and pricing room, closing band, auth backdrop, avatar discs. Hovered rail items lift to Enamel Wall Soft; overlays and the rail's company card use Enamel Wall Deep. Pale enamel (enamel-blue-pale) is the rail's resting text; mid enamel (enamel-blue-mid) inks the "in production" stamp.
- **Cast Brass** (cast-brass): primary actions with ink text, focus ring outline (2px, 2px offset), hairline frames around catalogue labels, the how-it-works sightline rule. Hover lightens to Brass Light, which also marks rail icons, the wordmark subline and the text selection. Brass Deep and darker brass are for brass text on light grounds (links, step numerals, list ticks) where the mid brass would fail contrast.

### Secondary
- **Stamp Red** (stamp-red): registration stamps only, tied to a real event: the hero's REORDER REQUESTED stamp, cancelled orders, revision-required artwork, and destructive actions (sign out, errors). Never decorative.

### Tertiary (state inks)
- **Verdigris** (verdigris): dispatched, paid, approved.
- **Ochre** (ochre): pending approval, processing; ledger figures that need attention.
- **Plum** (plum): quality check.

### Neutral
- **Archival Board** (archival-board): the page ground everywhere (`body`, landing reading rooms). Deliberately warm; see The Warm Board Rule.
- **Label Stock** (label-stock): catalogue labels, top bar, active rail item, auth card, pricing cards.
- **Card White** (card-white): portal work cards, ledger cells, inputs, menus.
- **Board Rule / Board Rule Strong** (board-rule, board-rule-strong): 1px card borders, row dividers, ledger gaps, section rules.
- **Ink** (ink), **Ink Body** (ink-body), **Ink Muted** (ink-muted): headings and figures; body copy; secondary text. The re-pointed zinc-400 (#5f5c55) and up pass WCAG AA on white, label stock and board; placeholders use it.

### Named Rules
**The Warm Board Rule.** The page ground is warm archival board (#e4e2dc, also `zinc-100`). Impeccable's detector flags it as `cream-palette` on every route; that flag is a known, accepted exception. The direction contract specifies a warm archival museum board, the finish review ruled that the contract outranks the detector here, and a cooler grey tried mid-build was reverted as a contract violation. Do not "fix" the board to a neutral or cool grey.

**The Inked State Rule.** Red, verdigris, ochre and plum appear only as state: in stamps, error text, warn figures. A colour with no status behind it stays brass, enamel or ink.

**The One Action Colour Rule.** Brass is the action. Secondary actions are ink-filled (on light grounds) or outlined in pale enamel (on the wall), never a second hue.

## Typography

**Display Font:** Bodoni Moda (with Bodoni 72, Didot, serif)
**Body Font:** Hanken Grotesk (with ui-sans-serif, system-ui)
**Label/Mono Font:** Courier Prime (with Courier New, ui-monospace), tabular figures

**Character:** A high-contrast Didone gives every title the voice of a catalogue heading; a plain grotesk does all the work; a typewriter face makes refs and money read as typed accession numbers that line up in columns.

### Hierarchy
- **Display** (Bodoni 400, 44px mobile / 60px desktop, 1.02, -0.02em, balanced wrap): landing hero headline only, set in label stock on the wall.
- **Headline** (Bodoni 400, 32-34px mobile / 40-48px desktop, 1.04-1.06, -0.015 to -0.02em): landing section titles; plan names at 28px.
- **Title** (Bodoni 700, 20px): portal page titles. Every `h1` is set in Bodoni by the base layer, so in-app titles stay `text-xl font-bold` and inherit the display face. Auth card titles run 26px semibold.
- **Body** (Hanken 400, 15-17px, leading-relaxed, max 34-42rem): landing prose and definitions.
- **UI** (Hanken 13px; 12px secondary): portal text, nav items, table cells, form controls.
- **Label** (Hanken 600, 11-12px, uppercase, 0.1-0.18em): table headers, rail group names, ledger captions, the wordmark subline.
- **Accession** (Courier Prime 400/700, 11-13px; 22px in the ledger, 34px for plan prices; 0.02em; tabular): plate refs, order refs, quantities, dates on labels, every money figure.

### Named Rules
**The Titles-Only Didone Rule.** Bodoni sets titles, label headings and the GSS wordmark. It never sets buttons, tables, form text or body copy.

**The Typed Figures Rule.** Any ref, quantity or amount is set in the accession face with tabular figures, in lists, detail pages, invoices and admin alike.

## Layout

Landing: full-bleed bands alternate between wall (hero, pricing, close) and board (reading rooms), with one tinted board band (`zinc-200` at 60%) for the mounted product print. Content sits in a 1280px container with 16px gutters (32px from `sm`). Sections breathe at 80px vertical (112px from `sm`). Compositions use a 12-column grid split 5/7 or 4/8, with items aligned to the bottom edge so labels share one sightline. Lists are hairline-ruled definition rows, not card grids.

Portal: a 256px enamel rail (collapsible to 80px; an off-canvas 288px drawer below `lg`, opened by a fixed wall-blue menu button), a 64px label-stock top bar, and a 1280px work column with 24px vertical rhythm between blocks. Each screen opens with a page title over a 1px rule, then a Ledger strip, then white catalogue cards. Tables collapse to stacked records below `sm`.

## Elevation & Depth

Depth is mostly flat and tonal: white cards on board, separated by 1px rules. Shadows exist in two roles. On the wall, catalogue labels and plan cards hang with long, soft, negatively spread shadows tinted toward enamel night, so they read as objects lit on a wall; the forward label or featured plan hangs deeper and lifts 20px. In the portal, shadows mark floating layers (menus, the auth card) and the active rail item; resting cards use only a faint 1px lift.

### Shadow Vocabulary
- **Wall hang** (`box-shadow: 0 18px 40px -18px rgba(5,10,28,0.85)`): side labels and standard plan cards on the wall.
- **Wall hang, forward** (`box-shadow: 0 28px 60px -22px rgba(5,10,28,0.95)`): the centre hero label and featured plan.
- **Board print** (`box-shadow: 0 24px 50px -24px rgba(19,18,15,0.5)`): mounted print and specimen label on board.
- **Floating menu** (`box-shadow: 0 12px 32px -8px rgba(19,18,15,0.28)`): notification and profile dropdowns.
- **Auth card** (`box-shadow: 0 24px 60px -24px rgba(8,14,32,0.75)`): the sign-in card on the wall.
- **Active rail item** (`box-shadow: 0 1px 2px rgba(8,14,32,0.35)`).

### Named Rules
**The Gallery Light Rule.** Shadows are soft, long and offset downward with negative spread, like light on a hung object. No hard offset shadows, no glows.

## Shapes

Crisp, near-square corners throughout: 2px for buttons, inputs, labels, stamps, nav items and the ledger; 3px for portal cards (`rounded-lg`); round only for avatars, count badges, numbered step discs and the lettered specimen marks. Labels are framed by a brass hairline ring (1px at 50-70% opacity; 2px solid for the forward label and featured plan). Borders are 1px board rules; the ledger uses a 1px gap over a board-rule ground to draw its cell lines.

## Components

### Buttons
- **Shape:** crisp corners (2px).
- **Primary:** cast brass fill, ink text, semibold to bold; 10px x 16px in the portal, 14px x 24px on the landing hero and close. Hover lightens to brass light (some portal screens step darker instead; both stay brass).
- **Hover / Focus:** colour transition only; a 2px brass outline with 2px offset on keyboard focus.
- **Ink:** ink fill, label-stock text, hover to `zinc-800`; secondary plan buttons.
- **Wall outline:** transparent on enamel, 1px pale-enamel border at 60%, label-stock text, border brightens to label stock on hover.
- **Disabled:** brass at 50% or 60% opacity, not-allowed cursor.

### Registration Stamps (signature)
Every order, payment and artwork status renders as a stamp: uppercase Hanken 11px bold, 0.09em tracking, a 1.5px border in `currentColor` plus an 18% inset ring, 2px corners, a tinted ground in the state's palest step. Mapping lives in `app/lib/utils.ts`: pending/processing to ochre, in production to enamel, quality check to plum, dispatched/paid/approved to verdigris, delivered/unpaid/superseded to grey, cancelled/revision required to red; "Recommended" uses brass. The stamp classes are unlayered so they win over any leftover badge utilities at call sites.

### Accession Labels
Plate refs and catalogue numbers are typed in Courier Prime with tabular figures and 0.02em tracking, usually in deep brass (`amber-700`) beside a product name, or prefixed "Acc." on catalogue labels.

### Catalogue Labels (landing)
Label stock, 2px corners, brass hairline frame, wall-hang shadow; accession line, Bodoni title, spec line, then a ruled footer of last run and price. The centre hero label is live: quantity stepper, brass Reorder, and on press a double-ruled stamp-red registration stamp ("REORDER REQUESTED · qty · date") presses on with `stamp-press` (420ms, cubic-bezier(0.16, 1, 0.3, 1), from -11deg/1.55x/blurred to -6deg/1x). Reduced motion shows it without movement.

### Ledger (register line)
The figures a screen opens with: a single hairline-ruled strip of white cells (16px x 14px padding), label caption in uppercase 12px tracked, value in 22px bold accession, optional note; ochre value when it needs attention. Linked cells tint to `zinc-50` on hover. Replaces big-number stat tiles.

### Cards / Containers
- **Corner Style:** 3px (`rounded-lg`).
- **Background:** card white on archival board; header strip in `zinc-50` with a 1px rule.
- **Shadow Strategy:** faint resting lift only (see Elevation).
- **Border:** 1px board rule.
- **Internal Padding:** 20px horizontal, 12px header rows, 14px table rows.

### Inputs / Fields
- **Style:** white, 1px board-rule-strong border, 2px corners, 13-14px text, `zinc-400` placeholder.
- **Focus:** border and 1px ring turn brass (2px brass ring on auth forms).
- **Error:** stamp-red pale panel with red-700 text and alert icon.

### Navigation
- **Rail:** enamel wall; Bodoni "GSS" wordmark with a brass-light uppercase tracked subline; company card in deep enamel at 60% with accession-set terms and limit; group labels uppercase 12px tracked in `blue-300`; items 13px pale enamel with brass-light 16px icons (1.75 stroke). Hover lifts to Enamel Wall Soft. Active item becomes a label-stock tab with ink text, semibold, deep brass icon and a slight shadow. Counts are accession-set brass-light chips.
- **Top bar:** label stock, 1px bottom rule, 64px; search field, bordered square icon buttons with brass count badges, initials avatar in an enamel disc.
- **Landing header:** on the wall, brass hairline underline, pale enamel links that whiten on hover, brass Start free trial.

## Do's and Don'ts

### Do:
- **Do** keep the page ground warm archival board (#e4e2dc) and treat the detector's `cream-palette` flag as an accepted exception (The Warm Board Rule).
- **Do** render every status through `orderStatusStyles` / `paymentStatusStyles` / `artworkStatusStyles` as a registration stamp.
- **Do** set every ref, quantity and amount in the accession face with tabular figures.
- **Do** use cast brass with ink text for the primary action, and only one brass action per decision.
- **Do** open data screens with a Ledger strip instead of stat tiles.
- **Do** keep corners at 2px (3px for portal cards) and divide with 1px board rules.
- **Do** hang landing objects on one sightline (bottom-aligned) with the wall-hang shadows.

### Don't:
- **Don't** replace the warm board with a cool or neutral grey; it was tried and reverted as a contract violation.
- **Don't** show status as a soft rounded pill or an unbordered tint.
- **Don't** use stamp red, verdigris, ochre or plum decoratively; they mean a state.
- **Don't** set buttons, tables or body copy in Bodoni.
- **Don't** use hard offset shadows or glows.
- **Don't** introduce a second accent hue for secondary actions; use ink fill or the pale-enamel outline.
