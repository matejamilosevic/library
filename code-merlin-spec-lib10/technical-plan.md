# Technical Plan

- Work item: LIB-10 (e11ec8a2-32dd-411f-a3a9-626f382eaaa1)
- Category: technical_plan
- Version: fcf258a9-5df9-415f-8f68-f72aebab121d
- Approval status: approved
- Approved at: 2026-10-05T13:32:55.380Z
- Approved by: Mateja Milosevic (a60f8343-5bb4-43b1-b676-35b91cf79f72)
- Evaluation time: 2026-10-06T11:09:10.813Z
- Source: https://staging.codemerlin.ai/work-items/e11ec8a2-32dd-411f-a3a9-626f382eaaa1?tab=technical_plan

# Technical Plan draft

## Technical approach
**Change magnitude: TINY**

## Current state vs target state
Currently, `src/desk.ts` in function `renderDeskHtml()` renders the desk header area directly beneath the `<h1>Library desk</h1>` heading with a lede paragraph (`<p class="lede">`) reading:
`Sign in to borrow, return, and wait for a copy.`

In the target state, `src/desk.ts` in function `renderDeskHtml()` replaces that text with the new sentence directly under the `<h1>Library desk</h1>` heading:
`Sign in to borrow a book, return it, or join the waitlist.`

The heading itself remains `Library desk`. No other page copy, buttons, forms, CSS styling, or authentication flows are modified. The welcome line is identical on desktop and narrow screens.

## Approach
1. **Direct copy replacement**: In `src/desk.ts`, update the string literal inside `renderDeskHtml()` from `"Sign in to borrow, return, and wait for a copy."` to `"Sign in to borrow a book, return it, or join the waitlist."`. Reusing the established HTML template pattern keeps the change module-local.
2. **Preserve responsive presentation**: Retain the existing `<p class="lede">` container without altering markup hierarchy or media query rules in `<style>`, ensuring uniform rendering across desktop and narrow viewport widths.

## Affected surfaces and verification
- **Affected surface**: `src/desk.ts` (`renderDeskHtml`).
- **Verification**: Verify that `GET /` (handled via `handleRequest` in `src/http.ts`) returns status 200 with header `'content-type': 'text/html; charset=utf-8'`, preserves `<h1>Library desk</h1>`, and contains `<p class="lede">Sign in to borrow a book, return it, or join the waitlist.</p>`. Run the test suite via `vitest run` to ensure no regressions.

## Affected components
- **library** — Updates the desk header welcome sentence in `src/desk.ts` under `renderDeskHtml()`.

## Affected component allowlist
- `matejamilosevic/library:src/desk.ts` (modify) `renderDeskHtml`

## Repository Matrix
| Repository Name | Needs Change | Role | Suggested Ship Order |
| --- | --- | --- | --- |
| matejamilosevic/library | Yes | Single in-memory library desk service containing web UI and API routes. | 1 |

## Repository scope
The change is strictly confined to `matejamilosevic/library`, modifying a single string in `src/desk.ts`.

## Risks
1. **Accidental markup truncation or malformed HTML template**: An unintentional syntax typo while editing the template literal in `renderDeskHtml()` could produce malformed HTML when serving `GET /`. Blast radius is limited to the desk landing page rendering. Mitigation: verify HTML structure with tests asserting the rendered body of `handleRequest('GET', '/')` and execute `npm test` (`vitest run`).

## Alternatives considered
1. **Externalize desk header text to a localization or configuration dictionary**: Consider moving the welcome line into a shared configuration or localization map instead of inline HTML templating. This was rejected because `matejamilosevic/library` maintains all UI string constants directly in `src/desk.ts`, and introducing an external string map for a single copy change adds unnecessary indirection and complexity contrary to existing repository conventions. Residual risk: none.

## Requirement mapping
- **FR-001** — addressed: Planned: Modify src/desk.ts in renderDeskHtml to display 'Sign in to borrow a book, return it, or join the waitlist.' directly under the 'Library desk' heading on both desktop and narrow screens.
- **SC-001** — addressed: Planned: Verify AC-001 holds by asserting that GET / renders 'Sign in to borrow a book, return it, or join the waitlist.' directly under the 'Library desk' heading.

## ADR references
