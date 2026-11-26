import { beforeEach, describe, expect, it } from 'vitest';
import { todayIsoDate } from '../src/holds.js';
import { handleRequest } from '../src/http.js';
import {
  availableCopies,
  checkout,
  getLoan,
  listLoanNotificationsForMember,
  listLoansForMember,
  processLoanReturnReminders,
  resetLoansForTests,
  returnLoan,
} from '../src/loans.js';
import { authHeaders } from './session.js';
import { getReservation } from '../src/reservations.js';

type ReservationView = { id: string; status: string; memberId: string };

function reservationFrom(body: unknown): ReservationView {
  return (body as { reservation: ReservationView }).reservation;
}

function loanIdFrom(body: unknown): string {
  return (body as { loan: { id: string } }).loan.id;
}

function daysBefore(dueAt: string, days: number): string {
  const date = new Date(`${dueAt}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

describe('loans', () => {
  beforeEach(() => {
    resetLoansForTests();
  });

  it('looks up a stored loan and reports a missing one', () => {
    const loan = checkout({ bookId: 'b-1', memberId: 'm-1' });
    expect(getLoan(loan.id)).toEqual(loan);
    expect(getLoan('loan-missing')).toBeUndefined();
  });

  it('checks out a copy and decrements availability', () => {
    expect(availableCopies('b-2')).toBe(1);
    const loan = checkout({ bookId: 'b-2', memberId: 'm-1' });
    expect(loan.memberId).toBe('m-1');
    expect(availableCopies('b-2')).toBe(0);
    expect(listLoansForMember('m-1')).toHaveLength(1);
  });

  it('assigns a 60-day due date on direct checkout', () => {
    resetLoansForTests();
    const loan = checkout({ bookId: 'b-2', memberId: 'm-1' });
    expect(loan.checkedOutAt).toBe(todayIsoDate(0));
    expect(loan.dueAt).toBe(todayIsoDate(60));
    expect(availableCopies('b-2')).toBe(0);
  });

  it('refuses checkout when no copies remain', () => {
    checkout({ bookId: 'b-2', memberId: 'm-1' });
    expect(() => checkout({ bookId: 'b-2', memberId: 'm-2' })).toThrow(/no_copies_available/);
  });

  it('returns a loan and restores availability', () => {
    const loan = checkout({ bookId: 'b-2', memberId: 'm-1' });
    const returned = returnLoan(loan.id);
    expect(returned.returnedAt).toBeTruthy();
    expect(availableCopies('b-2')).toBe(1);
  });

  it('holds a returned copy for the front reservation without creating a loan', () => {
    const loan = handleRequest('POST', '/loans', { bookId: 'b-2', memberId: 'm-1' }, authHeaders('m-1'));
    const reserved = handleRequest('POST', '/reservations', { bookId: 'b-2', memberId: 'm-2' }, authHeaders('m-2'));
    const reservation = reservationFrom(reserved.body);

    const returned = handleRequest('POST', `/loans/${loanIdFrom(loan.body)}/return`, undefined, authHeaders('m-1'));

    expect(returned.status).toBe(200);
    expect(getReservation(reservation.id)?.status).toBe('held');
    expect(listLoansForMember('m-2')).toHaveLength(0);
    expect(availableCopies('b-2')).toBe(0);
  });

  it('rejects checkout by a member who does not hold the returned copy', () => {
    const loan = handleRequest('POST', '/loans', { bookId: 'b-2', memberId: 'm-1' }, authHeaders('m-1'));
    handleRequest('POST', '/reservations', { bookId: 'b-2', memberId: 'm-2' }, authHeaders('m-2'));
    handleRequest('POST', `/loans/${loanIdFrom(loan.body)}/return`, undefined, authHeaders('m-1'));

    const rejected = handleRequest('POST', '/loans', { bookId: 'b-2', memberId: 'm-1' }, authHeaders('m-1'));

    expect(rejected.status).toBe(409);
    expect(rejected.body).toMatchObject({ error: 'copy_held_for_other_member' });
  });

  it('lets the member with the held copy check out and fulfills the reservation', () => {
    const loan = handleRequest('POST', '/loans', { bookId: 'b-2', memberId: 'm-1' }, authHeaders('m-1'));
    const reserved = handleRequest('POST', '/reservations', { bookId: 'b-2', memberId: 'm-2' }, authHeaders('m-2'));
    const reservation = reservationFrom(reserved.body);
    handleRequest('POST', `/loans/${loanIdFrom(loan.body)}/return`, undefined, authHeaders('m-1'));

    const created = handleRequest('POST', '/loans', { bookId: 'b-2', memberId: 'm-2' }, authHeaders('m-2'));

    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ loan: { bookId: 'b-2', memberId: 'm-2', returnedAt: null } });
    expect(getReservation(reservation.id)?.status).toBe('fulfilled');
  });

  it('issues a loan return reminder at 10, 5, 3, and 1 day before the due date', () => {
    resetLoansForTests();
    const loan = checkout({ bookId: 'b-1', memberId: 'm-1' });
    const expectedCounts: Array<[number, number]> = [
      [11, 0],
      [10, 1],
      [5, 2],
      [3, 3],
      [1, 4],
      [0, 4],
    ];

    for (const [days, expected] of expectedCounts) {
      processLoanReturnReminders(daysBefore(loan.dueAt, days));
      expect(listLoanNotificationsForMember('m-1')).toHaveLength(expected);
    }

    for (const thresholdDays of [10, 5, 3, 1] as const) {
      const match = listLoanNotificationsForMember('m-1').find(
        (notification) => notification.thresholdDays === thresholdDays,
      );
      expect(match).toMatchObject({
        kind: 'loan_reminder',
        loanId: loan.id,
        bookId: 'b-1',
        dueAt: loan.dueAt,
        thresholdDays,
      });
      expect(match?.message).toContain(loan.dueAt);
      expect(match?.message.toLowerCase()).toContain('return');
    }
  });

  it('suppresses reminders for a returned loan and keeps an earlier reminder', () => {
    resetLoansForTests();
    const returned = checkout({ bookId: 'b-2', memberId: 'm-1' });
    returnLoan(returned.id);
    for (const days of [10, 5, 3, 1]) {
      processLoanReturnReminders(daysBefore(returned.dueAt, days));
    }
    expect(listLoanNotificationsForMember('m-1')).toEqual([]);

    resetLoansForTests();
    const active = checkout({ bookId: 'b-1', memberId: 'm-1' });
    processLoanReturnReminders(daysBefore(active.dueAt, 10));
    returnLoan(active.id);
    for (const days of [5, 3, 1]) {
      processLoanReturnReminders(daysBefore(active.dueAt, days));
    }
    const reminders = listLoanNotificationsForMember('m-1');
    expect(reminders).toHaveLength(1);
    expect(reminders[0]?.thresholdDays).toBe(10);
  });

  it('keeps a single reminder when the same threshold is evaluated repeatedly', () => {
    resetLoansForTests();
    const loan = checkout({ bookId: 'b-1', memberId: 'm-1' });
    const tenDaysBefore = daysBefore(loan.dueAt, 10);
    processLoanReturnReminders(tenDaysBefore);
    processLoanReturnReminders(tenDaysBefore);
    processLoanReturnReminders(tenDaysBefore);
    listLoansForMember('m-1');
    listLoanNotificationsForMember('m-1');
    const reminders = listLoanNotificationsForMember('m-1').filter(
      (notification) => notification.loanId === loan.id && notification.thresholdDays === 10,
    );
    expect(reminders).toHaveLength(1);
  });
});
