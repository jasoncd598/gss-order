---
version: 1
slug: "app-dashboard-layout-tsx"
primary_target: "app/(dashboard)/layout.tsx"
related_targets: ["app/invoice/[id]/page.tsx","app/(auth)/login/page.tsx"]
---

# Surface brief: logged-in portal and staff admin (app/(dashboard), app/invoice, auth pages)

Mode: Operate. Users: trade customers (Admin, Procurement Manager, Finance, Viewer) and GSS staff — see PRODUCT.md. Tasks: find a past job and reorder; approve proofs; pay; staff approve, price, upload and progress orders. Every existing route, control and behaviour stays; only the visual system changes.

## Direction contract

THESIS: A working ordering portal first; the collection world lends only type, palette, density and one signature move — every record carries its catalogue label, and every status is a registration stamp tied to the event that set it. Refuses the category default of a grey dashboard with one accent colour.

OWN-WORLD: Enamel-blue navigation rail (#1c2b5a) with brass (#d4b06a on blue) active marker; archival grey board ground (#ebe8e1); white catalogue cards with 1px board rules and 2px corners; brass (#b38b3b) primary actions with ink text; stamp red, verdigris, ochre and enamel blue as state colours only where they mean something. Bodoni Moda for page titles only, Hanken Grotesk for all UI text, Courier Prime with tabular figures for plate refs, order refs, quantities and money.

STORY: The user knows where everything is before noticing the world; plate refs read as accession numbers, statuses read as stamps, and the job is done faster than before.

FIRST VIEWPORT: Standard shell — blue rail left with grouped navigation and the company card; board top bar with search, cart and notifications; page title in Bodoni over the work area; content in white catalogue cards on the board ground.

SIGNATURE MOVE: Status as registration stamps — uppercase, letterspaced, inked border in the state colour, never a soft pill — and plate refs as typed accession labels, consistently across lists, detail pages, invoices and admin.

FORM: The Collection Catalogue (operate rendition) — position 7 of 7; seed key 48688a18.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
