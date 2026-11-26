# Technical Plan

- Work item: LIB-33 (4dae5946-e988-41db-bfa8-3eff163150a1)
- Category: technical_plan
- Version: ec9bcf2b-b4e4-478e-b6fd-252f291ef681
- Approval status: approved
- Approved at: 2026-11-25T14:46:19.071Z
- Approved by: Mateja Milosevic (a60f8343-5bb4-43b1-b676-35b91cf79f72)
- Evaluation time: 2026-11-25T14:47:27.241Z
- Source: https://staging.codemerlin.ai/work-items/4dae5946-e988-41db-bfa8-3eff163150a1?tab=technical_plan

# Technical Plan draft

## Technical approach
**Change magnitude: MEDIUM**

## Current state vs target state

- **Loan duration (`src/loans.ts`)**: Currently `LOAN_DAYS` is `21`, and `createLoan` sets `checkedOutAt: todayIsoDate()` and `dueAt: todayIsoDate(LOAN_DAYS)` using UTC ISO date strings (`YYYY-MM-DD`). In the target state, `LOAN_DAYS` is updated to `60` so all new checkouts (including standard checkouts, notified-hold pickups, and held-reservation pickups routed through `checkout` and `createLoan`) receive a `dueAt` 60 days after `checkedOutAt`. `Loan` shape in `src/types.ts` and `src/http.ts` endpoints (`POST /loans`, `GET /members/:id/loans`) are reused unchanged.
- **Active loans desk display (`src/desk.ts`)**: Currently `renderLoans(loans, books)` in `clientScript` filters `loan.returnedAt === null`, toggles `loansEmpty.hidden = active.length > 0` (preserving `No current loans.`), and renders each `<li>` with `<span class="loan-title">`, `<span class="due">Due <loan.dueAt></span>`, and a `Return` button. In the target state, `renderLoans` computes whole calendar days remaining in UTC between today's UTC date (`new Date().toISOString().slice(0, 10)`) and `loan.dueAt`. When `daysRemaining > 0`, it displays the remaining days countdown alongside the due date (preserving `Due <loan.dueAt>` text); when `daysRemaining <= 0` (due today with `0` days remaining or past due with negative days remaining), it clearly renders an overdue indicator on the loan item while keeping the existing `No current loans.` empty state untouched.
- **Unit and integration tests (`test/loans.test.ts`, `test/http.test.ts`, `test/holds.test.ts`)**: Existing tests either omit `dueAt` assertions (`test/loans.test.ts`) or hardcode `todayIsoDate(21)` (`test/http.test.ts`, `test/holds.test.ts`) and only assert `'Due '` in `#loans`. Target tests verify the 60-day loan due date across `checkout`, `POST /loans`, hold pickup, and reservation pickup, and verify `#loans` rendering in `happy-dom` for future due dates (countdown), 0 days remaining (due today -> overdue), negative days remaining (past due -> overdue), and empty loans (`No current loans.`).

## Research decisions

1. **Compute remaining days and overdue state in `src/desk.ts` `renderLoans` rather than altering the `Loan` API response**: `GET /members/:id/loans` returns `Loan[]` directly from `listLoansForMember` (`src/loans.ts`), where `dueAt` is already a `YYYY-MM-DD` UTC ISO date string. Computing `daysRemaining` from UTC midnight timestamps in `renderLoans` keeps `src/types.ts` and `src/http.ts` API contracts unchanged and prevents client-server payload drift.
2. **Keep `LOAN_DAYS = 60` in `src/loans.ts` without extracting a new shared module**: `todayIsoDate` and `LOAN_DAYS` are already encapsulated in `src/loans.ts`, and `renderLoans` runs in the browser `<script>` context embedded in `src/desk.ts` (`clientScript`), which cannot import TypeScript modules directly.

## Component / module ownership

- **`src/loans.ts`**: Owns loan duration policy (`LOAN_DAYS`), `createLoan`, `checkout`, `returnLoan`, and `listLoansForMember`.
- **`src/desk.ts`**: Owns the server-rendered HTML shell (`renderDeskHtml`) and client-side desk script (`clientScript` including `renderLoans`).
- **`test/loans.test.ts`, `test/http.test.ts`, `test/holds.test.ts`**: Own unit and HTTP/DOM integration verification for loan duration and desk active-loan rendering.
- **Must NOT be modified**: `src/types.ts`, `src/http.ts`, `src/holds.ts`, `src/reservations.ts`, `src/catalog.ts`, `src/members.ts`.

## Service interaction patterns

- **Browser desk script to HTTP handler (`src/desk.ts` -> `src/http.ts` -> `src/loans.ts`)**: After sign-in or loan actions, `refresh()` calls `GET /members/:id/loans` with `Authorization: Bearer <token>`, receives `{ loans }`, and passes `loans.loans` to `renderLoans`. Existing failure handling in `refresh()` (401 redirects via `showSignedOut()` + session-expired error; non-OK responses surface `showError(...)`) remains unchanged.

## Multi-tenancy contract

- Member data isolation is enforced in `src/http.ts` via `requireSession`, `requireActingMember`, and `readOwnActivity`, which verify `memberId === session.accountId` before calling `listLoansForMember(id)` or `checkout({ bookId, memberId: acting.accountId })`. The desk client only queries `/members/' + memberId + '/loans'` using the signed-in `activeMember.id`; no cross-member data paths are introduced.

## Affected components
- **library** — Update `LOAN_DAYS` from `21` to `60` in `src/loans.ts`; update `renderLoans` in `src/desk.ts` to compute and display remaining days and an overdue indicator when 0 or fewer days remain; update and expand unit/integration tests in `test/loans.test.ts`, `test/http.test.ts`, and `test/holds.test.ts`.

## Affected component allowlist
- `matejamilosevic/library:src/loans.ts` (modify) `LOAN_DAYS`
- `matejamilosevic/library:src/desk.ts` (modify) `renderLoans`
- `matejamilosevic/library:test/loans.test.ts` (modify)
- `matejamilosevic/library:test/http.test.ts` (modify)
- `matejamilosevic/library:test/holds.test.ts` (modify)

## Repository scope
Single repository `matejamilosevic/library` contains all loan business logic (`src/loans.ts`), desk UI rendering (`src/desk.ts`), and Vitest/happy-dom test suites (`test/loans.test.ts`, `test/http.test.ts`, `test/holds.test.ts`). No other repositories are involved.

## Risks
1. **Migration / stored state risk**: No database or schema migration exists because loans are stored in an in-memory `Map` in `src/loans.ts`. Any pre-existing loans in a running process keep their original `dueAt` while new checkouts use 60 days; mitigated by process restart or standard loan return.
2. **Multi-tenancy / member isolation risk**: A member could view another member's active loans if `readOwnActivity` checks were bypassed. No HTTP route or auth check is modified (`src/http.ts` continues enforcing `memberId === session.accountId` with `Bearer` token sessions).
3. **Performance / timezone drift risk**: Computing remaining days in `renderLoans` iterates only the signed-in member's active loans in memory (O(N) trivial cost), but comparing local-timezone `Date` against UTC `YYYY-MM-DD` `dueAt` strings could cause off-by-one day errors near midnight. Mitigated by normalizing both today's date and `loan.dueAt` to UTC midnight (`YYYY-MM-DDT00:00:00.000Z`) before computing `(dueMs - todayMs) / 86400000`.
4. **Rollback risk**: Because no schema or persisted format changes, reverting `LOAN_DAYS` to `21` and restoring `renderLoans` rolls back cleanly with zero data loss.
5. **Existing test regression risk**: `test/http.test.ts` and `test/holds.test.ts` currently assert `todayIsoDate(21)` and check `#loans` for `'Due '`. Mitigated by preserving `'Due ' + loan.dueAt` in `renderLoans` and updating all `21`-day assertions across both test files.

## Alternatives considered
1. **Compute `daysRemaining` and `overdue` server-side in `src/loans.ts` or `src/http.ts`**: Extending the `Loan` object or `/members/:id/loans` payload would couple the backend API contract to UI presentation and require updating `src/types.ts` and `src/http.ts`. Not chosen because `loan.dueAt` is already returned in `YYYY-MM-DD` UTC format and `src/desk.ts` can derive the countdown directly; residual risk is negligible provided `renderLoans` uses UTC date normalization matching `todayIsoDate`.
2. **Import a shared date helper into `src/desk.ts` and `src/loans.ts`**: Extracting a shared date diff module cannot be reused directly inside the inline `<script>` string (`clientScript`) in `src/desk.ts` without bundling or string injection. Not chosen to keep the zero-build inline script pattern in `src/desk.ts` intact; residual risk is minor duplication of UTC date parsing logic, covered by integration tests in `test/http.test.ts`.

## Requirement mapping
- **FR-001** — addressed: Planned: update `LOAN_DAYS` from `21` to `60` in `src/loans.ts` so `createLoan` assigns `dueAt` 60 days from checkout.
- **FR-002** — addressed: Planned: update `renderLoans` in `src/desk.ts` to calculate UTC days remaining until `loan.dueAt` and display the countdown for each active loan.
- **FR-003** — addressed: Planned: update `renderLoans` in `src/desk.ts` to clearly render an overdue indicator when zero or negative days remain until `loan.dueAt`.
- **FR-004** — addressed: Planned: update `test/loans.test.ts`, `test/http.test.ts`, and `test/holds.test.ts` to assert the 60-day `dueAt` period and verify the desk `#loans` remaining-days countdown and overdue display.
- **SC-001** — addressed: Planned: verify via unit and HTTP checkout tests that `src/loans.ts` produces a `dueAt` 60 days after `checkedOutAt` [FR-001].
- **SC-002** — addressed: Planned: verify via `happy-dom` desk integration tests in `test/http.test.ts` that `renderLoans` in `src/desk.ts` displays remaining days for future due dates and an overdue indicator when zero or negative days remain [FR-002, FR-003].
- **SC-003** — addressed: Planned: run `npm test` (`vitest run`) across `test/loans.test.ts`, `test/http.test.ts`, and `test/holds.test.ts` to confirm all 60-day loan limit and countdown/overdue assertions pass [FR-004].

## ADR references
