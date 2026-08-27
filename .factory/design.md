# Nightjar Slicer visual thesis

## Direction: surreal editorial scenery

Nightjar turns an intimidating overnight recording into a legible sequence of
small windows. Its scene is therefore a moonlit wetland assembled like an
editorial cut-paper plate: a long silver tape of sound crosses the landscape,
passes through a brass slicing gate, and becomes neat dawn-coloured segments.
The image explains the product's place *before* identification; it does not
depict species recognition or promise an AI result.

The interface borrows the composure of a field notebook: an offset grid,
hairline rules, specimen labels, and generous dark space. It must not resemble
a generic SaaS dashboard or gradient hero.

## Palette

The site is deliberately single-mode, painted as a night field station.

- `night-950` `#101b1d` — explicit page background, the blue-black of a hide
- `night-900` `#172528` — raised work surfaces
- `lichen-100` `#f1efd8` — primary text and paper labels (13.4:1 on night-950)
- `mist-300` `#aebfba` — supporting text (7.7:1 on night-950)
- `moon-200` `#dce4b4` — rules and passive UI
- `reed-500` `#bfcd73` — primary action (9.1:1 with night ink)
- `dawn-400` `#ed8d5a` — time markers and focus (6.7:1 on night-950)
- `water-500` `#4ba5a3` — successful completion (5.6:1 on night-950)
- `warning-400` `#f0b35d`; `danger-300` `#ff9a8d`

Colour never carries status alone; labels, shapes, and live text accompany it.

## Type and spacing

Two local/system faces keep the download small and the utility honest.
Headlines use Georgia with restrained italic moments, evoking natural-history
publishing. Interface and body copy use the system sans stack. File sizes,
durations, commands, and table values use the system monospace stack with
tabular figures. No remote font requests are made.

The scale is 16, 18, 23, 34, and clamp(44–76) px. A strict 4/8 px rhythm uses
8, 12, 16, 24, 32, 48, 64, and 96 px spaces. Text measures never exceed 72ch.

## Interaction grammar

Controls feel like movable labels on a field log: flat until focused, then
outlined in dawn orange with a 3 px outer ring. The primary action uses reed
green and an arrow; secondary actions are quiet text links. Demo rows appear
as time strips rather than dashboard cards. Minimum targets are 44 px.

The mobile composition drops the decorative coordinate labels, stacks the
planner fields, and moves the artwork behind the opening copy. Tables become
scrollable while retaining their headers.

## Motion

On entry, the illustration and its caption settle upward 12 px over 280 ms.
Generated demo strips reveal once over 180 ms from their temporal origin.
Nothing loops. Under `prefers-reduced-motion: reduce`, transforms and smooth
scrolling are removed and state changes are immediate opacity changes.

## Original asset plan and provenance

`site/public/nightjar-tape.webp` is a project-original raster hero generated
for this product with `/opt/fleet/lib/gen-image.sh` using the factory
`factory-image` deployment, then converted locally to WebP. Prompt:

> Use case: stylized-concept. Asset type: wide landing-page hero for a local
> bird-audio slicing CLI. A surreal editorial cut-paper nocturnal wetland,
> viewed obliquely, where one long silver audio tape flows through dark reeds
> and a small brass slicing gate, emerging as several orderly glowing segments
> that lead toward a pale dawn horizon. Moody natural-history magazine
> illustration, tactile paper grain, restrained shapes, deep blue-black,
> lichen green, muted teal, and dawn orange palette. Wide 3:2 composition with
> the visual subject centered-right and calm negative space toward the upper
> left. No people, no text, no logos, no UI, no waveform symbols, no watermark,
> no identifiable branded equipment.

The small tape, moon, and segment marks in the interface are hand-authored CSS
geometry, not stock icons. Generated asset license: project-owned output under
the repository MIT license; generation metadata is retained beside the source.
