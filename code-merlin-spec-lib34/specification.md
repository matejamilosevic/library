# Specification

- Work item: LIB-34 (3428abd3-4594-4354-b3b7-a69750a10bec)
- Category: specification
- Version: 826f522c-2b37-4824-9645-f33b87a4d5cf
- Approval status: approved
- Approved at: 2026-11-26T12:31:24.459Z
- Approved by: Mateja Milosevic (a60f8343-5bb4-43b1-b676-35b91cf79f72)
- Evaluation time: 2026-11-26T12:42:41.155Z
- Source: https://staging.codemerlin.ai/work-items/3428abd3-4594-4354-b3b7-a69750a10bec?tab=specification

**Change magnitude: MEDIUM**

## Outcome

Library members with active loans receive return reminder notifications at 10, 5, 3, and 1 day before each loan's due date, and see those reminders alongside their active loans in the signed-in desk interface.

## User Stories

### User Story 1 — Timely loan return reminders (Priority: P1)

As a library member with active book loans, I want reminder notifications to be issued at 10, 5, 3, and 1 day before a loan's due date (and suppressed once the book is returned), so that I have advance warning to return borrowed books on time.

**Why this priority**: Generating accurate, deduplicated reminders for active loans only is the core behavior that powers all member-facing reminder displays.

**Independent Test**: Create an active loan with a due date 10, 5, 3, or 1 day away, run reminder evaluation (or read member loans/notifications), and verify that one reminder notification is issued per reached threshold while returned loans produce none.

**Acceptance Scenarios**:

- AC-001: Given a member with an active loan (`returnedAt` is null), When the loan reaches 10 days before its due date, Then a reminder notification is issued informing the member of the approaching return date.
- AC-002: Given a member with an active loan, When the loan reaches 5 days before its due date, Then a reminder notification is issued informing the member of the approaching return date.
- AC-003: Given a member with an active loan, When the loan reaches 3 days before its due date, Then a reminder notification is issued informing the member of the approaching return date.
- AC-004: Given a member with an active loan, When the loan reaches 1 day before its due date, Then a reminder notification is issued informing the member of the approaching return date.
- AC-005: Given a loan that has already been returned, When any reminder threshold (10, 5, 3, or 1 day before due date) is reached, Then no reminder notification is generated for that loan.
- AC-006: Given an active loan for which reminder evaluation runs multiple times while at a threshold (10, 5, 3, or 1 day before due date), When notifications are queried, Then at most one reminder notification exists for that loan and threshold day.

### User Story 2 — Desk display of loan return reminders (Priority: P2)

As a signed-in library member viewing the desk interface, I want my loan return reminders to appear clearly alongside my active loans, so that I can immediately see which borrowed books are due soon.

**Why this priority**: Once reminders are generated, surfacing them in the member's notifications endpoint and desk view makes the warnings visible to the patron.

**Independent Test**: Sign in as a member with an active loan at a reminder threshold, open the desk interface, and verify that the reminder is returned with member notifications and displayed alongside the active loan.

**Acceptance Scenarios**:

- AC-007: Given a signed-in member viewing the desk interface, When reminder notifications exist for their account, Then the reminders are returned by `GET /members/:id/notifications` alongside hold notifications and displayed clearly alongside active loan information.

## Functional Requirements

- FR-001: New: evaluate active loans (`returnedAt === null`) against the reminder thresholds of `10`, `5`, `3`, and `1` day before `dueAt` and issue a reminder notification informing the member of the approaching return date. [US1, AC-001, AC-002, AC-003, AC-004]
- FR-002: New: skip reminder generation for any loan that has already been returned (`returnedAt !== null`). [US1, AC-005]
- FR-003: New: deduplicate reminder notifications so at most one reminder notification is issued per loan per threshold day (`10`, `5`, `3`, or `1`), even when evaluation runs multiple times. [US1, AC-006]
- FR-004: New: evaluate loan return reminders on demand when a member's loans or notifications are read, and export a processing function in `src/loans.ts` for explicit invocation in tests. [US1, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006]
- FR-005: Changed: extend `Notification` in `src/types.ts` (or support a loan-reminder notification variant) so reminder notifications can be stored and serialized with loan context alongside hold notifications. [US1, US2, AC-001, AC-007]
- FR-006: Changed: update `GET /members/:id/notifications` in `src/http.ts` to evaluate reminders on demand and return loan return reminders alongside hold notifications for the authenticated member. [US2, AC-007]
- FR-007: Changed: update `src/desk.ts` to fetch member notifications from `GET /members/:id/notifications` and display loan return reminders clearly alongside active loan information for the signed-in member. [US2, AC-007]

## Success Criteria

- SC-001: Active loans trigger a reminder notification at 10, 5, 3, and 1 day before their due date, with at most one notification per loan per threshold day. [FR-001, FR-003, FR-004]
- SC-002: Returned loans never produce reminder notifications at any threshold. [FR-002]
- SC-003: `GET /members/:id/notifications` returns both loan return reminders and existing hold notifications for the authenticated member. [FR-005, FR-006]
- SC-004: The signed-in desk interface renders active loan return reminders alongside active loan information. [FR-007]

## Edge Cases

- Loan already returned before or on a threshold day: no reminder notification is created, while any previously issued reminder for an earlier threshold remains intact or is not duplicated.
- Repeated reads of `GET /members/:id/loans` or `GET /members/:id/notifications` on the same threshold day: no duplicate reminder notifications are created.
- Member has no active loans or no reminder notifications: `GET /members/:id/notifications` returns an empty list (or only hold notifications) and the desk interface renders cleanly without errors.
- Unauthenticated or cross-member access to `GET /members/:id/notifications`: existing `401 unauthorized` and `403 forbidden` session checks in `src/http.ts` continue to apply.

## Out of Scope

- Background cron/scheduler daemons or external delivery channels (email, SMS, push notifications); reminders are evaluated on demand in the in-memory service and surfaced via the HTTP API and desk UI.
- Overdue fines, fee calculation, or reminder thresholds other than 10, 5, 3, and 1 day before the due date.

## Source Requirement Coverage

| Source AC | Covered by |
| --- | --- |
| TAC-1 — Given a member with an active loan, when the loan reaches 10 days before its due date, then a reminder notification is issued informing the member of the approaching return date. | AC-001, FR-001, FR-004, SC-001 |
| TAC-2 — Given a member with an active loan, when the loan reaches 5 days before its due date, then a reminder notification is issued informing the member of the approaching return date. | AC-002, FR-001, FR-004, SC-001 |
| TAC-3 — Given a member with an active loan, when the loan reaches 3 days before its due date, then a reminder notification is issued informing the member of the approaching return date. | AC-003, FR-001, FR-004, SC-001 |
| TAC-4 — Given a member with an active loan, when the loan reaches 1 day before its due date, then a reminder notification is issued informing the member of the approaching return date. | AC-004, FR-001, FR-004, SC-001 |
| TAC-5 — Given a loan that has already been returned, when any reminder threshold is reached, then no reminder notification is generated for that loan. | AC-005, FR-002, SC-002 |
| TAC-6 — Given a signed-in member viewing the desk interface, when reminder notifications exist for their account, then the reminders are displayed clearly alongside active loan information. Affected areas: src/loans.ts · src/types.ts · src/desk.ts · src/http.ts · test/loans.test.ts · test/http.test.ts | AC-007, FR-005, FR-006, FR-007, SC-003, SC-004 |

## Current behavior

- `src/loans.ts` — manages in-memory `Loan` records with `checkedOutAt`, `dueAt` (`LOAN_DAYS = 60`), and `returnedAt` (`null` while active) via `checkout`, `returnLoan`, `getLoan`, and `listLoansForMember`, without loan return reminder evaluation or tracking.
- `src/types.ts` — defines `Loan` and `Notification`, where `Notification` currently includes `holdId`, `bookId`, `createdAt`, `expiresAt`, and `message` for hold notifications only.
- `src/holds.ts` — stores in-memory hold `Notification` records and exposes `listNotificationsForMember(memberId)` returning hold notifications.
- `src/http.ts` — routes `GET /members/:id/loans` and `GET /members/:id/notifications` through `readOwnActivity` session and member-ownership enforcement.
- `src/desk.ts` — renders the signed-in patron desk HTML/script, fetches `/books`, `/members/:id/loans`, `/members/:id/holds`, and `/members/:id/reservations`, and displays active loans with days remaining until `dueAt` without fetching `/members/:id/notifications`.
