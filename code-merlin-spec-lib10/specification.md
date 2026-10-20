# Specification

- Work item: LIB-10 (e11ec8a2-32dd-411f-a3a9-626f382eaaa1)
- Category: specification
- Version: 25117769-5b3c-490f-a2fd-2d1585e7b7ec
- Approval status: approved
- Approved at: 2026-10-05T13:14:25.481Z
- Approved by: Mateja Milosevic (a60f8343-5bb4-43b1-b676-35b91cf79f72)
- Evaluation time: 2026-10-06T11:09:10.461Z
- Source: https://staging.codemerlin.ai/work-items/e11ec8a2-32dd-411f-a3a9-626f382eaaa1?tab=specification

**Change magnitude: TINY**

## Outcome

The library desk displays an updated welcome sentence explaining that signing in allows patrons to borrow a book, return it, or join the waitlist.

## User Stories

### User Story 1 — Clarify desk welcome sentence (Priority: P1)

As a patron opening the library desk, I want the welcome line to name borrowing, returning, and joining the waitlist, so I know what signing in is for.

**Why this priority**: It is the only user-visible change requested.

**Independent Test**: Request `GET /` and verify that the paragraph below the `Library desk` heading contains `Sign in to borrow a book, return it, or join the waitlist.`

**Acceptance Scenarios**:

- AC-001: Given a visitor opens the library desk on any screen size, When viewing the header area directly under the "Library desk" heading, Then the welcome sentence displays "Sign in to borrow a book, return it, or join the waitlist."

## Functional Requirements

- FR-001: Changed: the welcome line directly under the "Library desk" heading displays "Sign in to borrow a book, return it, or join the waitlist." on both desktop and narrow screens. [US1, AC-001]

## Success Criteria

- SC-001: AC-001 holds.

## Source Requirement Coverage

| Source AC | Covered by |
|---|---|
| A signed-out visitor sees the new sentence directly under the “Library desk” heading. | AC-001, FR-001, SC-001 |
| The heading itself stays “Library desk.” | Preserved — heading remains "Library desk" |
| No other page copy, buttons, or flows change. | Preserved — existing page copy, buttons, and flows remain unchanged |
| The sentence is the same on desktop and narrow screens. | AC-001, FR-001, SC-001 |

## Current behavior

- `src/desk.ts` — renders the desk header lede paragraph reading "Sign in to borrow, return, and wait for a copy." directly under the "Library desk" heading.
