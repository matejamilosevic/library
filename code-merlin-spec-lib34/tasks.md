# Tasks

- Work item: LIB-34 (3428abd3-4594-4354-b3b7-a69750a10bec)
- Category: tasks
- Version: 6652dc79-6bb2-4fd3-8178-b561b762a616
- Approval status: approved
- Approved at: 2026-11-26T12:40:00.326Z
- Approved by: Mateja Milosevic (a60f8343-5bb4-43b1-b676-35b91cf79f72)
- Evaluation time: 2026-11-26T12:42:42.256Z
- Source: https://staging.codemerlin.ai/work-items/3428abd3-4594-4354-b3b7-a69750a10bec?tab=tasks

## matejamilosevic/library

### Task 1: Extend Notification union with LoanReminderNotification in src/types.ts
- Done when: `LoanReminderThreshold`, `HoldNotification`, `LoanReminderNotification`, and `Notification = HoldNotification | LoanReminderNotification` are exported, existing hold call sites stay valid, and `npm run typecheck` passes.

### Task 2: [US1] Implement loan return reminder evaluation and deduplication in src/loans.ts
- Done when: `processLoanReturnReminders(currentDate?)` issues one reminder per active loan at exact UTC day differences 10, 5, 3, and 1, skips returned loans, dedupes by `${loan.id}:${thresholdDays}`, lists reminders by member, runs on loan and notification reads, and `resetLoansForTests()` clears reminder state.

### Task 3: [US1] Re-export loan reminder functions and notification types in src/index.ts
- Done when: `processLoanReturnReminders`, `listLoanNotificationsForMember`, `HoldNotification`, `LoanReminderNotification`, and `LoanReminderThreshold` are exported and `npm run typecheck` passes.

### Task 4: [US2] Return loan return reminders alongside hold notifications in GET /members/:id/notifications
- Done when: the route returns both lists inside `readOwnActivity` and leaves holds, catalog, members, reservations, and server unmodified.

### Task 5: [US2] Fetch notifications and display loan return reminders alongside active loans in src/desk.ts
- Done when: `refresh()` fetches notifications with the bearer header and `renderLoans()` shows matching `loan_reminder` messages beside the active loan without changing existing loan DOM copy.

### Task 6–13: Repo validation in test/loans.test.ts and test/http.test.ts
- Done when: tests cover the four thresholds, non-thresholds 11 and 0, returned-loan suppression, deduplication, combined hold and loan notifications, empty notifications, 401, 403, and the signed-in desk rendering a 3-day reminder beside The Odyssey.
