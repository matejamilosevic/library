import { getBook } from './catalog.js';
import {
  countActiveNotifiedHolds,
  fulfillHold,
  getNotifiedHoldsForBook,
  processHoldExpiration,
  processReturnForHolds,
  resetHoldsForTests,
} from './holds.js';
import { getMember } from './members.js';
import {
  countHeldReservations,
  fulfillHeldReservation,
  getHeldReservationForMember,
  promoteNextPending,
  resetReservationsForTests,
} from './reservations.js';
import type {
  BookId,
  Loan,
  LoanId,
  LoanReminderNotification,
  LoanReminderThreshold,
  MemberId,
  NotificationId,
} from './types.js';

const LOAN_DAYS = 60;
const REMINDER_THRESHOLDS: readonly LoanReminderThreshold[] = [10, 5, 3, 1];
const loans = new Map<LoanId, Loan>();
const loanNotifications = new Map<NotificationId, LoanReminderNotification>();
const issuedReminderKeys = new Set<string>();
let sequence = 0;
let reminderSequence = 0;

function todayIsoDate(offsetDays = 0): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function activeLoansForBook(bookId: BookId): Loan[] {
  return [...loans.values()].filter((loan) => loan.bookId === bookId && loan.returnedAt === null);
}

function createLoan(bookId: BookId, memberId: MemberId): Loan {
  sequence += 1;
  const loan: Loan = {
    id: `loan-${sequence}`,
    bookId,
    memberId,
    checkedOutAt: todayIsoDate(),
    dueAt: todayIsoDate(LOAN_DAYS),
    returnedAt: null,
  };
  loans.set(loan.id, loan);
  return loan;
}

export function physicalAvailableCopies(bookId: BookId): number {
  const book = getBook(bookId);
  if (!book) return 0;
  return Math.max(0, book.copies - activeLoansForBook(bookId).length);
}

export function availableCopies(bookId: BookId): number {
  const book = getBook(bookId);
  if (!book) return 0;
  processHoldExpiration(bookId);
  return Math.max(
    0,
    physicalAvailableCopies(bookId) - countActiveNotifiedHolds(bookId) - countHeldReservations(bookId),
  );
}

export function checkout(input: { bookId: BookId; memberId: MemberId }): Loan {
  const book = getBook(input.bookId);
  if (!book) {
    throw new Error(`unknown_book:${input.bookId}`);
  }
  const member = getMember(input.memberId);
  if (!member) {
    throw new Error(`unknown_member:${input.memberId}`);
  }

  processHoldExpiration(input.bookId);

  if (getHeldReservationForMember(input.bookId, input.memberId)) {
    fulfillHeldReservation(input.bookId, input.memberId);
    return createLoan(input.bookId, input.memberId);
  }

  const physicalCopies = physicalAvailableCopies(input.bookId);
  if (physicalCopies < 1) {
    throw new Error(`no_copies_available:${input.bookId}`);
  }

  const notifiedHolds = getNotifiedHoldsForBook(input.bookId);
  const memberHold = notifiedHolds.find((hold) => hold.memberId === input.memberId);
  const unreservedCopies = physicalCopies - notifiedHolds.length - countHeldReservations(input.bookId);

  if (!memberHold && unreservedCopies < 1) {
    if (notifiedHolds.length > 0) {
      throw new Error(`queue_priority_conflict:${input.bookId}`);
    }
    throw new Error(`copy_held_for_other_member:${input.bookId}`);
  }

  const loan = createLoan(input.bookId, input.memberId);
  if (memberHold) {
    fulfillHold(memberHold.id);
  }
  return loan;
}

export function getLoan(loanId: LoanId): Loan | undefined {
  return loans.get(loanId);
}

export function returnLoan(loanId: LoanId): Loan {
  const loan = loans.get(loanId);
  if (!loan) {
    throw new Error(`unknown_loan:${loanId}`);
  }
  if (loan.returnedAt) {
    throw new Error(`already_returned:${loanId}`);
  }
  const returned: Loan = { ...loan, returnedAt: todayIsoDate() };
  loans.set(loanId, returned);
  const claimedByHold = processReturnForHolds(loan.bookId);
  if (!claimedByHold) {
    promoteNextPending(loan.bookId);
  }
  return returned;
}

function calendarDaysUntil(dueAt: string, currentDate: string): number {
  const dueMs = Date.parse(`${dueAt}T00:00:00.000Z`);
  const currentMs = Date.parse(`${currentDate}T00:00:00.000Z`);
  return Math.round((dueMs - currentMs) / 86400000);
}

function isReminderThreshold(days: number): days is LoanReminderThreshold {
  return REMINDER_THRESHOLDS.includes(days as LoanReminderThreshold);
}

function reminderMessage(dueAt: string, thresholdDays: LoanReminderThreshold): string {
  const dayLabel = thresholdDays === 1 ? 'day' : 'days';
  return `Return reminder: this loan is approaching its return date of ${dueAt} (${thresholdDays} ${dayLabel} remaining).`;
}

export function processLoanReturnReminders(currentDate?: string): LoanReminderNotification[] {
  const today = currentDate ?? todayIsoDate();
  const issued: LoanReminderNotification[] = [];
  for (const loan of loans.values()) {
    if (loan.returnedAt !== null) continue;
    const daysUntilDue = calendarDaysUntil(loan.dueAt, today);
    if (!isReminderThreshold(daysUntilDue)) continue;
    const key = `${loan.id}:${daysUntilDue}`;
    if (issuedReminderKeys.has(key)) continue;
    reminderSequence += 1;
    const notification: LoanReminderNotification = {
      id: `loan-notif-${reminderSequence}`,
      memberId: loan.memberId,
      loanId: loan.id,
      bookId: loan.bookId,
      dueAt: loan.dueAt,
      thresholdDays: daysUntilDue,
      createdAt: today,
      message: reminderMessage(loan.dueAt, daysUntilDue),
      kind: 'loan_reminder',
    };
    issuedReminderKeys.add(key);
    loanNotifications.set(notification.id, notification);
    issued.push(notification);
  }
  return issued;
}

export function listLoanNotificationsForMember(memberId: MemberId): LoanReminderNotification[] {
  processLoanReturnReminders();
  return [...loanNotifications.values()].filter((notification) => notification.memberId === memberId);
}

export function listLoansForMember(memberId: MemberId): Loan[] {
  processLoanReturnReminders();
  return [...loans.values()].filter((loan) => loan.memberId === memberId);
}

export function resetLoansForTests(): void {
  loans.clear();
  sequence = 0;
  loanNotifications.clear();
  issuedReminderKeys.clear();
  reminderSequence = 0;
  resetHoldsForTests();
  resetReservationsForTests();
}
