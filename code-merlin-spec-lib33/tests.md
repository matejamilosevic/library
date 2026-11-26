# Tests

- Work item: LIB-33 (4dae5946-e988-41db-bfa8-3eff163150a1)
- Category: tests
- Version: a8f64989-6b2c-4030-b8ef-1c159f5f5f6b
- Approval status: approved
- Approved at: 2026-11-25T14:46:20.979Z
- Approved by: Mateja Milosevic (a60f8343-5bb4-43b1-b676-35b91cf79f72)
- Evaluation time: 2026-11-25T14:47:27.762Z
- Source: https://staging.codemerlin.ai/work-items/4dae5946-e988-41db-bfa8-3eff163150a1?tab=tests

```json
[
  {
    "order": 1,
    "steps": [
      "Given loan state is reset via resetLoansForTests() and book b-2 has 1 available copy",
      "When member m-1 checks out book b-2 via checkout({ bookId: 'b-2', memberId: 'm-1' })",
      "Then the returned loan has checkedOutAt equal to todayIsoDate(0) and dueAt equal to todayIsoDate(60)",
      "And availableCopies('b-2') equals 0"
    ],
    "title": "Assign 60-day due date on direct checkout",
    "repo_keys": [
      "matejamilosevic/library"
    ],
    "ac_anchors": [
      "AC-001"
    ],
    "fr_anchors": [
      "FR-001",
      "FR-004",
      "SC-001",
      "SC-003"
    ],
    "harness_class": "in_repo",
    "home_repo_key": "matejamilosevic/library",
    "test_data_ref": "Seeded book b-2 and member m-1 with resetLoansForTests() in test/loans.test.ts",
    "validation_type": "unit",
    "scenario_category": "happy"
  },
  {
    "order": 2,
    "steps": [
      "Given loan, hold, and reservation state is reset via resetLoansForTests()",
      "When member m-1 sends POST /loans with { bookId: 'b-1', memberId: 'm-1' } and authHeaders('m-1')",
      "Then the HTTP 201 response loan and GET /members/m-1/loans record have dueAt equal to todayIsoDate(60)",
      "When b-2 is checked out by m-1, a waiting hold or pending reservation by m-2 is made ready on return, and m-2 completes pickup via POST /loans",
      "Then the HTTP 201 pickup loan has dueAt equal to todayIsoDate(60) and returnedAt equal to null"
    ],
    "title": "Assign 60-day due date across HTTP checkout, hold pickup, and reservation pickup",
    "repo_keys": [
      "matejamilosevic/library"
    ],
    "ac_anchors": [
      "AC-001"
    ],
    "fr_anchors": [
      "FR-001",
      "FR-004",
      "SC-001",
      "SC-003"
    ],
    "harness_class": "in_repo",
    "home_repo_key": "matejamilosevic/library",
    "test_data_ref": "Seeded books b-1, b-2 and members m-1, m-2 with authHeaders() in test/http.test.ts and test/holds.test.ts",
    "validation_type": "integration",
    "scenario_category": "happy"
  },
  {
    "order": 3,
    "steps": [
      "Given member m-2 (alan) has an active loan for b-1 (The Odyssey) with dueAt equal to todayIsoDate(60)",
      "When the desk page is opened via openDesk() in happy-dom and alan signs in via #signin-form",
      "Then #loans-empty has hidden equal to true",
      "And #loans displays an item containing The Odyssey, Due <todayIsoDate(60)>, the remaining-days countdown showing 60 days remaining, and a Return button"
    ],
    "title": "Display remaining days countdown on desk active loans with future due dates",
    "repo_keys": [
      "matejamilosevic/library"
    ],
    "ac_anchors": [
      "AC-002"
    ],
    "fr_anchors": [
      "FR-002",
      "FR-004",
      "SC-002",
      "SC-003"
    ],
    "harness_class": "in_repo",
    "home_repo_key": "matejamilosevic/library",
    "test_data_ref": "Desk happy-dom window via openDesk() with member m-2 (alan) and active loan on b-1 in test/http.test.ts",
    "validation_type": "integration",
    "scenario_category": "happy"
  },
  {
    "order": 4,
    "steps": [
      "Given signed-in member m-2 (alan) receives active loans from GET /members/m-2/loans with returnedAt: null where one loan has dueAt equal to todayIsoDate(0) (0 days remaining) and one has dueAt equal to todayIsoDate(-3) (-3 days remaining)",
      "When the active loans list is rendered in happy-dom on the desk page",
      "Then both rendered items in #loans retain Due <dueAt> and clearly indicate overdue status rather than a positive remaining-days countdown"
    ],
    "title": "Indicate overdue status on desk active loans due today or past due",
    "repo_keys": [
      "matejamilosevic/library"
    ],
    "ac_anchors": [
      "AC-003"
    ],
    "fr_anchors": [
      "FR-003",
      "FR-004",
      "SC-002",
      "SC-003"
    ],
    "harness_class": "in_repo",
    "home_repo_key": "matejamilosevic/library",
    "test_data_ref": "Desk happy-dom window via openDesk() with mocked GET /members/m-2/loans dueAt values todayIsoDate(0) and todayIsoDate(-3) in test/http.test.ts",
    "validation_type": "integration",
    "scenario_category": "edge"
  },
  {
    "order": 5,
    "steps": [
      "Given member m-3 (grace) has no active loans so GET /members/m-3/loans returns { loans: [] }",
      "When grace signs in on the desk page via openDesk() in happy-dom",
      "Then #loans contains no <li> elements",
      "And #loans-empty has hidden equal to false and textContent equal to 'No current loans.'"
    ],
    "title": "Preserve empty active loans notice when member has no active loans",
    "repo_keys": [
      "matejamilosevic/library"
    ],
    "ac_anchors": [
      "AC-002",
      "AC-003"
    ],
    "fr_anchors": [
      "FR-002",
      "FR-003",
      "FR-004",
      "SC-002",
      "SC-003"
    ],
    "harness_class": "in_repo",
    "home_repo_key": "matejamilosevic/library",
    "test_data_ref": "Desk happy-dom window via openDesk() with member m-3 (grace) having zero active loans in test/http.test.ts",
    "validation_type": "integration",
    "scenario_category": "alt"
  },
  {
    "order": 6,
    "steps": [
      "Given a fresh desk window opened via openDesk() in happy-dom",
      "When a new patron submits #signup-form and clicks the Check out button for book b-1 (The Odyssey)",
      "Then POST /loans returns HTTP 201 with dueAt equal to todayIsoDate(60), and #loans displays The Odyssey, Due <todayIsoDate(60)>, and 60 days remaining",
      "When the patron clicks the Return button on that loan item",
      "Then POST /loans/:id/return returns HTTP 200, #loans is empty, and #loans-empty becomes visible with 'No current loans.'"
    ],
    "title": "Sign up, check out a book from the desk, observe 60-day countdown, and return to empty state",
    "repo_keys": [
      "matejamilosevic/library"
    ],
    "ac_anchors": [
      "AC-001",
      "AC-002"
    ],
    "fr_anchors": [
      "FR-001",
      "FR-002",
      "FR-004",
      "SC-001",
      "SC-002",
      "SC-003"
    ],
    "harness_class": "in_repo",
    "home_repo_key": "matejamilosevic/library",
    "test_data_ref": "Desk happy-dom full lifecycle via openDesk() checking out and returning b-1 in test/http.test.ts",
    "validation_type": "e2e",
    "scenario_category": "e2e_chain"
  }
]
```
