# Tasks

- Work item: LIB-33 (4dae5946-e988-41db-bfa8-3eff163150a1)
- Category: tasks
- Version: 6ce9e925-483a-4a67-945c-5ae8626b7ab6
- Approval status: approved
- Approved at: 2026-11-25T14:46:22.344Z
- Approved by: Mateja Milosevic (a60f8343-5bb4-43b1-b676-35b91cf79f72)
- Evaluation time: 2026-11-25T14:47:28.314Z
- Source: https://staging.codemerlin.ai/work-items/4dae5946-e988-41db-bfa8-3eff163150a1?tab=tasks

# Tasks

## matejamilosevic/library

### Task 1: [US1] Update LOAN_DAYS from 21 to 60 in src/loans.ts
- Done when:
  - `LOAN_DAYS` in `src/loans.ts` is changed from `21` to `60` so `createLoan` sets `checkedOutAt: todayIsoDate()` and `dueAt: todayIsoDate(LOAN_DAYS)` to 60 days after the checkout date (FR-001, SC-001)
  - All checkouts routed through `checkout` and `createLoan` (direct checkout, notified-hold pickup, and held-reservation pickup) assign `dueAt` 60 days after `checkedOutAt`
  - Independent Test: checking out an available book produces a loan whose `dueAt` is 60 days after the checkout date (`todayIsoDate(60)`)
  - `src/types.ts`, `src/http.ts`, `src/holds.ts`, `src/reservations.ts`, `src/catalog.ts`, and `src/members.ts` remain unmodified

### Task 2: [US2] Display UTC remaining-days countdown and overdue indicator in renderLoans in src/desk.ts
- Done when:
  - `renderLoans(loans, books)` in `clientScript` in `src/desk.ts` continues filtering `loan.returnedAt === null` and setting `loansEmpty.hidden = active.length > 0` so `#loans-empty` displays `'No current loans.'` when the member has no active loans
  - `renderLoans` normalizes both today's UTC date (`new Date().toISOString().slice(0, 10)`) and `loan.dueAt` to UTC midnight (`YYYY-MM-DDT00:00:00.000Z`) before computing whole calendar days remaining (`(dueMs - todayMs) / 86400000`)
  - Each rendered `<li>` preserves `<span class="loan-title">`, `<span class="due">Due <loan.dueAt></span>`, and the `Return` button
  - When `daysRemaining > 0`, the loan item displays the remaining-days countdown (e.g. `60 days remaining` for `todayIsoDate(60)`) (FR-002, AC-002)
  - When `daysRemaining <= 0` (`0` days remaining / due today or negative days remaining / past due), the loan item clearly indicates overdue status rather than a positive remaining-days countdown (FR-003, AC-003, SC-002)
  - Independent Test: signing in to the desk page with active loans before and on/after their due date shows the remaining days count for future due dates and an overdue indicator when zero or negative days remain

### Task 3: [P] Verify 60-day due date on direct checkout in test/loans.test.ts
- Kind: Repo Validation
- Done when:
  - `test/loans.test.ts` resets state via `resetLoansForTests()`, checks out book `b-2` for member `m-1` via `checkout({ bookId: 'b-2', memberId: 'm-1' })`, and asserts `checkedOutAt` equals `todayIsoDate(0)` (UTC today), `dueAt` equals `todayIsoDate(60)`, and `availableCopies('b-2')` equals `0`
  - `npx vitest run test/loans.test.ts` passes

### Task 4: [P] Update HTTP checkout, hold pickup, and reservation pickup assertions to 60 days in test/http.test.ts and test/holds.test.ts
- Kind: Repo Validation
- Done when:
  - `test/http.test.ts` updates `todayIsoDate(21)` assertions to `todayIsoDate(60)` for `POST /loans` (`{ bookId: 'b-1', memberId: 'm-1' }` with `authHeaders('m-1')`), `GET /members/m-1/loans`, notified hold pickup (`POST /loans` by `m-2` on `b-2`), held reservation pickup, and desk route walkthrough tests, asserting HTTP `201`, `dueAt === todayIsoDate(60)`, and `returnedAt === null`
  - `test/holds.test.ts` updates `loan.dueAt` assertion from `todayIsoDate(21)` to `todayIsoDate(60)` in the checkout/return test
  - `npx vitest run test/http.test.ts test/holds.test.ts` passes

### Task 5: Verify remaining-days countdown on desk active loans with future due dates in test/http.test.ts
- Kind: Repo Validation
- Done when:
  - `test/http.test.ts` opens the desk in `happy-dom` via `openDesk()` for member `m-2` (`alan`) with an active loan for `b-1` (`The Odyssey`) having `dueAt` equal to `todayIsoDate(60)` and signs in via `#signin-form`
  - Asserts `#loans-empty` has `hidden === true` and `#loans` displays an item containing `The Odyssey`, `Due <todayIsoDate(60)>`, `60 days remaining`, and a `Return` button
  - `npx vitest run test/http.test.ts` passes

### Task 6: Verify overdue status on desk active loans due today or past due in test/http.test.ts
- Kind: Repo Validation
- Done when:
  - `test/http.test.ts` tests signed-in member `m-2` (`alan`) in `openDesk()` (`happy-dom`) receiving active loans from `GET /members/m-2/loans` with `returnedAt: null` where one loan has `dueAt` equal to `todayIsoDate(0)` (`0` days remaining) and one has `dueAt` equal to `todayIsoDate(-3)` (`-3` days remaining)
  - Asserts both rendered items in `#loans` retain `Due <dueAt>` and clearly indicate overdue status rather than a positive remaining-days countdown
  - `npx vitest run test/http.test.ts` passes

### Task 7: Verify preserved empty active loans notice for member with no loans in test/http.test.ts
- Kind: Repo Validation
- Done when:
  - `test/http.test.ts` verifies member `m-3` (`grace`) signing in on the desk page via `openDesk()` (`happy-dom`) when `GET /members/m-3/loans` returns `{ loans: [] }`
  - Asserts `#loans` contains no `<li>` elements and `#loans-empty` has `hidden === false` and `textContent === 'No current loans.'`
  - `npx vitest run test/http.test.ts` passes

### Task 8: Verify desk signup, 60-day checkout countdown, and return to empty state e2e flow in test/http.test.ts
- Kind: Repo Validation
- Done when:
  - `test/http.test.ts` opens a fresh desk window via `openDesk()` in `happy-dom`, submits `#signup-form`, and clicks the `Check out` button for `b-1` (`The Odyssey`)
  - Asserts `POST /loans` returns HTTP `201` with `dueAt` equal to `todayIsoDate(60)` and `#loans` displays `The Odyssey`, `Due <todayIsoDate(60)>`, and `60 days remaining`
  - Clicks the `Return` button on that loan item and asserts `POST /loans/:id/return` returns HTTP `200`, `#loans` is empty, and `#loans-empty` becomes visible (`hidden === false`) with `'No current loans.'`
  - `npm test` (`vitest run`) passes across `test/loans.test.ts`, `test/http.test.ts`, and `test/holds.test.ts`
