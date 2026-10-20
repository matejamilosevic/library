# Tasks

- Work item: LIB-10 (e11ec8a2-32dd-411f-a3a9-626f382eaaa1)
- Category: tasks
- Version: 1c6343b4-5eaa-4f7a-b0eb-2243489eb364
- Approval status: approved
- Approved at: 2026-10-05T13:32:59.645Z
- Approved by: Mateja Milosevic (a60f8343-5bb4-43b1-b676-35b91cf79f72)
- Evaluation time: 2026-10-06T11:09:11.198Z
- Source: https://staging.codemerlin.ai/work-items/e11ec8a2-32dd-411f-a3a9-626f382eaaa1?tab=tasks

# Tasks

## matejamilosevic/library

### Task 1: [US1] Update library desk welcome sentence in desk HTML renderer
- Done when:
  - In `src/desk.ts` within `renderDeskHtml()`, replace the text `Sign in to borrow, return, and wait for a copy.` directly under the `<h1>Library desk</h1>` heading with `Sign in to borrow a book, return it, or join the waitlist.` (FR-001, AC-001)
  - The heading itself remains `Library desk` and the `<p class="lede">` container and responsive styling remain intact (FR-001, SC-001)
  - No other page copy, buttons, or form controls on the desk page are modified
  - Independent Test: Request `GET /` and verify that the paragraph below the `Library desk` heading contains `Sign in to borrow a book, return it, or join the waitlist.` with HTTP status code 200 and header `'content-type': 'text/html; charset=utf-8'`

### Task 2: Verify desk welcome line displays updated text directly under the Library desk heading
- Kind: Repo Validation
- Done when:
  - In `src/desk.ts`, verify that `renderDeskHtml()` renders the desk welcome line directly under `<h1>Library desk</h1>`
  - Assert that `GET /` returns HTTP status 200 with header `'content-type'` equal to `'text/html; charset=utf-8'`
  - Assert that the response body contains an `<h1>` element with text `Library desk`
  - Assert that immediately following the heading, the `<p class="lede">` paragraph displays `Sign in to borrow a book, return it, or join the waitlist.` (FR-001, SC-001, AC-001)
  - Assert that the previous text `Sign in to borrow, return, and wait for a copy.` is not present anywhere in the document
  - Vitest test suite execution passes via `npm test`

### Task 3: Verify desk layout preserves heading and responsive presentation without altering other copy
- Kind: Repo Validation
- Done when:
  - In `src/desk.ts`, inspect `renderDeskHtml()` to verify that the heading text remains strictly `Library desk`
  - Verify that the welcome sentence `Sign in to borrow a book, return it, or join the waitlist.` is contained within the standard `<p class="lede">` tag without viewport-conditional text substitution
  - Verify that existing sign-in and account creation forms remain intact with headers `Sign in` and `Create an account`
  - Verify that no other page copy, buttons, or form controls on the desk page are modified (FR-001, SC-001, AC-001)
  - Vitest test suite execution passes via `npm test`
