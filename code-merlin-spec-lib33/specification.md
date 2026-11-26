# Specification

- Work item: LIB-33 (4dae5946-e988-41db-bfa8-3eff163150a1)
- Category: specification
- Version: fdde17ef-1a82-4089-8d14-43d3fcf00052
- Approval status: approved
- Approved at: 2026-11-25T14:27:56.969Z
- Approved by: Mateja Milosevic (a60f8343-5bb4-43b1-b676-35b91cf79f72)
- Evaluation time: 2026-11-25T14:47:26.941Z
- Source: https://staging.codemerlin.ai/work-items/4dae5946-e988-41db-bfa8-3eff163150a1?tab=specification

**Change magnitude: MEDIUM**

## Outcome

Library members receive a 60-day return period on new book checkouts and see a countdown of remaining days (or an overdue indicator when zero or negative days remain) for each active loan on the desk page.

## User Stories

### User Story 1 — 60-day loan period (Priority: P1)

As a library member, I want new book checkouts to be assigned a 60-day return period starting from the checkout date, so that I have 60 days to return borrowed books.

**Why this priority**: Extending the loan duration is the core policy change for all new checkouts.

**Independent Test**: Check out an available book and verify that the created loan's due date is 60 days after the checkout date.

**Acceptance Scenarios**:

- AC-001: Given an available book and a signed-in member, When the member checks out the book, Then the new loan is assigned a due date 60 days after the checkout date.

### User Story 2 — Active loan remaining-days countdown and overdue indicator (Priority: P2)

As a library member, I want the active loans list on the desk page to display the number of days remaining until each book's due date and clearly indicate when a loan is overdue, so that I can track my borrowing period and return books on time.

**Why this priority**: Displaying the countdown and overdue status makes the 60-day loan period actionable on the desk interface.

**Independent Test**: Sign in to the desk page with active loans (both before and on/after their due date) and verify that each active loan shows the remaining days count and an overdue indicator when zero or negative days remain.

**Acceptance Scenarios**:

- AC-002: Given a signed-in member with an active loan whose due date is in the future, When the active loans list is rendered on the desk page, Then the item displays the number of days remaining until the due date.
- AC-003: Given a signed-in member with an active loan whose due date has zero or negative days remaining, When the active loans list is rendered on the desk page, Then the item clearly indicates that the loan is overdue.

## Functional Requirements

- FR-001: Changed: new book checkouts assign a 60-day return period starting from the checkout date instead of 21 days. [US1, AC-001]
- FR-002: Changed: the active loans list on the desk interface displays the number of days remaining until the book's due date. [US2, AC-002]
- FR-003: New: the active loans list on the desk interface clearly indicates when a loan is overdue (zero or negative days remaining). [US2, AC-003]
- FR-004: Changed: unit and integration tests reflect the 60-day loan limit and verify the remaining-days countdown and overdue display on the desk page. [US1, AC-001, US2, AC-002, AC-003]

## Success Criteria

- SC-001: New checkouts produce a due date 60 days after the checkout date. [FR-001]
- SC-002: The desk active loans list displays remaining days for upcoming due dates and an overdue indicator when zero or negative days remain. [FR-002, FR-003]
- SC-003: Unit and integration tests pass with the 60-day limit and remaining-days countdown assertions. [FR-004]

## Edge Cases

- Loan due today (0 days remaining) or past due (negative days remaining): the active loans list must clearly indicate the loan is overdue.
- Empty active loans list: existing empty-state notice (`No current loans.`) continues to be shown when the member has no active loans.

## Source Requirement Coverage

| Source AC | Covered by |
| --- | --- |
| TAC-1 — New book checkouts are assigned a 60-day return period starting from the checkout date. | AC-001, FR-001, SC-001 |
| TAC-2 — The active loans list on the desk interface displays the number of days remaining until the book's due date. | AC-002, FR-002, SC-002 |
| TAC-3 — The active loans list clearly indicates if a loan is overdue (i.e. zero or negative days remaining). | AC-003, FR-003, SC-002 |
| TAC-4 — Unit and integration tests are updated to reflect the 60-day limit and verify the remaining days display countdown. Affected areas: src/loans.ts · src/desk.ts · test/loans.test.ts · test/http.test.ts | FR-004, SC-003 |

## Current behavior

- `src/loans.ts` — `LOAN_DAYS` is `21`, so `createLoan` sets `dueAt` to `todayIsoDate(21)`.
- `src/desk.ts` — `renderLoans` renders each active loan with its title, `Due <dueAt>`, and a Return button, without a remaining-days countdown or overdue indicator.
- `test/loans.test.ts` — tests checkout, return, and reservation fulfillment without asserting the 60-day due date.
- `test/http.test.ts` — asserts `todayIsoDate(21)` for loan `dueAt` and checks that `#loans` contains `Due `.
