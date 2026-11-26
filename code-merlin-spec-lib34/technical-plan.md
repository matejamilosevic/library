# Technical Plan

- Work item: LIB-34 (3428abd3-4594-4354-b3b7-a69750a10bec)
- Category: technical_plan
- Version: 831c61a6-2e56-434a-8e87-2e63ebe5ed81
- Approval status: approved
- Approved at: 2026-11-26T12:39:56.849Z
- Approved by: Mateja Milosevic (a60f8343-5bb4-43b1-b676-35b91cf79f72)
- Evaluation time: 2026-11-26T12:42:41.733Z
- Source: https://staging.codemerlin.ai/work-items/3428abd3-4594-4354-b3b7-a69750a10bec?tab=technical_plan

# Technical Plan draft

## Technical approach
**Change magnitude: MEDIUM**

## Current state vs target state

**Current state (verified in `matejamilosevic/library`):**
- `src/types.ts` defines `Loan` (`id`, `bookId`, `memberId`, `checkedOutAt`, `dueAt`, `returnedAt`) and `Notification` (`id`, `memberId`, `holdId`, `bookId`, `createdAt`, `expiresAt`, `message`) exclusively for hold pickup alerts.
- `src/loans.ts` maintains an in-memory `loans` map (`LOAN_DAYS = 60`), exporting `checkout`, `returnLoan`, `getLoan`, `listLoansForMember`, `availableCopies`, `physicalAvailableCopies`, and `resetLoansForTests`, with no return-reminder evaluation or tracking.
- `src/holds.ts` stores hold `Notification` records in an in-memory `notifications` map and exposes `listNotificationsForMember(memberId)`.
- `src/http.ts` handles `GET /members/:id/loans` and `GET /members/:id/notifications` through `readOwnActivity` (enforcing `401 unauthorized`, `403 forbidden`, and `404 member_not_found`), returning `listLoansForMember(id)` and hold-only `listNotificationsForMember(id)`.
- `src/desk.ts` renders the patron desk HTML and inline `clientScript`; `refresh()` fetches `/books`, `/members/:id/loans`, `/members/:id/holds`, and `/members/:id/reservations`, then `renderLoans()` renders active loans (`returnedAt === null`) with days remaining until `dueAt` without fetching or showing `/members/:id/notifications`.

**Target state:**
- **Reused unchanged:** `src/holds.ts` hold queuing/notification logic, `src/members.ts` authentication/session/ownership checks (`readOwnActivity`), and `LOAN_DAYS = 60` checkout/return behavior.
- **Modified:**
  1. `src/types.ts`: Extend `Notification` as a discriminated/compatible union of `HoldNotification` and `LoanReminderNotification` (carrying `kind: 'loan_reminder'`, `loanId`, `bookId`, `dueAt`, `thresholdDays: 10 | 5 | 3 | 1`, `createdAt`, `message`) while keeping existing `HoldNotification` shape valid for `src/holds.ts`.
  2. `src/loans.ts`: Add in-memory `loanNotifications` storage and deduplication (`issuedReminderKeys`), implement and export `processLoanReturnReminders(currentDate?: string)` and `listLoanNotificationsForMember(memberId)`, evaluate active loans (`returnedAt === null`) against thresholds `10`, `5`, `3`, and `1` day before `dueAt`, skip loans with `returnedAt !== null`, trigger evaluation on demand in `listLoansForMember` and `listLoanNotificationsForMember`, and clear reminder state in `resetLoansForTests`.
  3. `src/http.ts`: Update `GET /members/:id/notifications` to evaluate loan reminders on demand and return both hold notifications (`listNotificationsForMember(id)`) and loan return reminders (`listLoanNotificationsForMember(id)`) for the authenticated member.
  4. `src/desk.ts`: Update `refresh()` in `clientScript` to fetch `/members/:id/notifications` with `activityHeaders`, pass notifications into `renderLoans()`, and render each loan's active return reminder notifications clearly alongside its active loan row in `#loans`.
  5. `src/index.ts`: Re-export the new loan reminder functions and notification types.
  6. `test/loans.test.ts` and `test/http.test.ts`: Add unit and integration/DOM tests covering thresholds (`10`, `5`, `3`, `1`), returned-loan suppression, deduplication, `GET /members/:id/notifications`, auth enforcement, and desk display.

## Research decisions

1. **Store loan reminder notifications in `src/loans.ts` rather than `src/holds.ts`:** `src/loans.ts` already owns the `loans` map and imports from `src/holds.ts`; adding loan-to-hold notification writes in `src/holds.ts` would deepen circular coupling. Keeping `loanNotifications` in `src/loans.ts` with a distinct `loan-notif-` ID prefix and merging with `listNotificationsForMember(id)` in `src/http.ts` keeps `src/holds.ts` untouched and prevents ID collisions.
2. **Extend `Notification` via a TypeScript union (`HoldNotification | LoanReminderNotification`) instead of mutating `HoldNotification` required fields:** Keeping `kind?: 'hold'` optional on `HoldNotification` ensures all existing hold creation sites in `src/holds.ts` and assertions in `test/holds.test.ts` remain valid without modification, while `kind: 'loan_reminder'` lets `src/desk.ts` and callers distinguish loan reminders cleanly.
3. **Match exact UTC calendar day difference (`10`, `5`, `3`, `1`) with per-loan-threshold deduplication key `${loan.id}:${thresholdDays}`:** Reuses the UTC `YYYY-MM-DD` date arithmetic already used in `src/loans.ts`, `src/holds.ts` (`todayIsoDate`), and `src/desk.ts` (`daysRemainingUntil`), guaranteeing deterministic testability when `currentDate` is passed to `processLoanReturnReminders`.

## Component / module ownership

- **`src/types.ts`**: Owns `Notification`, `HoldNotification`, `LoanReminderNotification`, and `LoanReminderThreshold` type definitions.
- **`src/loans.ts`**: Owns `Loan` lifecycle, in-memory `loanNotifications` store, reminder threshold evaluation (`10`, `5`, `3`, `1`), deduplication, and `processLoanReturnReminders` / `listLoanNotificationsForMember` exports.
- **`src/http.ts`**: Owns HTTP routing, `readOwnActivity` session/ownership enforcement, and combining hold and loan reminder notifications in `GET /members/:id/notifications`.
- **`src/desk.ts`**: Owns patron desk HTML/CSS and `clientScript` fetching `/members/:id/notifications` and rendering reminder messages alongside active loans.
- **`src/index.ts`**: Owns public barrel exports.
- **Unmodified modules**: `src/holds.ts`, `src/catalog.ts`, `src/members.ts`, `src/reservations.ts`, and `src/server.ts` must NOT be modified.

## Affected component allowlist

- `matejamilosevic/library:src/types.ts` (modify) `Notification`
- `matejamilosevic/library:src/loans.ts` (modify) `listLoansForMember`
- `matejamilosevic/library:src/http.ts` (modify) `handleRequest`
- `matejamilosevic/library:src/desk.ts` (modify) `renderDeskHtml`
- `matejamilosevic/library:src/index.ts` (modify) `listLoansForMember`
- `matejamilosevic/library:test/loans.test.ts` (modify)
- `matejamilosevic/library:test/http.test.ts` (modify)

## Repository scope

Single repository: `matejamilosevic/library`. All changes live within `src/` and `test/` in this repository; no cross-repository coordination is required.
