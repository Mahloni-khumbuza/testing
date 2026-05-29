import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';

import { AuthService } from '../../auth/services/auth.service';
import { Boardroom } from '../../boardrooms/models/boardroom.model';
import { BoardroomsService } from '../../boardrooms/services/boardrooms.service';
import { Booking, BookingStatus } from '../../bookings/models/booking.model';
import { BookingsService } from '../../bookings/services/bookings.service';

interface CalendarEntry {
  kind: 'booking' | 'block';
  id: string;
  title: string;
  subtitle: string;
  startTime: Date;
  endTime: Date;
  status?: BookingStatus;
  boardroomName: string;
}

interface DayGroup {
  date: Date;
  label: string;
  entries: CalendarEntry[];
}

@Component({
  selector: 'app-calendar-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar.page.html',
  styleUrl: './calendar.page.css'
})
export class CalendarPage {
  private readonly bookingsService = inject(BookingsService);
  private readonly boardroomsService = inject(BoardroomsService);
  private readonly auth = inject(AuthService);

  readonly bookings = signal<Booking[]>([]);
  readonly boardrooms = signal<Boardroom[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly boardroomFilter = signal<string>('');
  readonly daysAhead = signal(14);

  readonly isAdmin = this.auth.isAdmin;

  readonly groups = computed<DayGroup[]>(() => {
    const now = new Date();
    const endRange = new Date(now);
    endRange.setDate(endRange.getDate() + this.daysAhead());

    const entries: CalendarEntry[] = this.bookings()
      .filter((b) => b.status === 'confirmed' || b.status === 'pending')
      .filter((b) => !this.boardroomFilter() || b.boardroom.id === this.boardroomFilter())
      .map((b) => ({
        kind: 'booking' as const,
        id: b.id,
        title: b.title,
        subtitle: b.bookedBy ? `${b.bookedBy.firstName} ${b.bookedBy.lastName}`.trim() || b.bookedBy.email : '',
        startTime: new Date(b.startTime),
        endTime: new Date(b.endTime),
        status: b.status,
        boardroomName: b.boardroom.name
      }))
      .filter((e) => e.endTime >= now && e.startTime <= endRange);

    const byDay = new Map<string, CalendarEntry[]>();
    for (const e of entries) {
      const key = dayKey(e.startTime);
      const arr = byDay.get(key) ?? [];
      arr.push(e);
      byDay.set(key, arr);
    }

    const sortedKeys = Array.from(byDay.keys()).sort();
    return sortedKeys.map((key) => {
      const arr = byDay.get(key)!.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
      const date = arr[0]!.startTime;
      return {
        date,
        label: formatDayLabel(date),
        entries: arr
      };
    });
  });

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.error.set(null);
    const mineQuery = this.isAdmin() ? undefined : true;
    forkJoin({
      bookings: this.bookingsService.list({ mine: mineQuery }),
      boardrooms: this.boardroomsService.list(true)
    }).subscribe({
      next: ({ bookings, boardrooms }) => {
        this.bookings.set(bookings);
        this.boardrooms.set(boardrooms);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.errorMessage(err));
        this.loading.set(false);
      }
    });
  }

  setBoardroomFilter(value: string): void {
    this.boardroomFilter.set(value);
  }

  private errorMessage(err: unknown): string {
    const e = err as { error?: { message?: string | string[] }; message?: string };
    const msg = e?.error?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    return msg || e?.message || 'Something went wrong.';
  }
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDayLabel(d: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  const dateStr = d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
  if (sameDay(d, today)) return `Today — ${dateStr}`;
  if (sameDay(d, tomorrow)) return `Tomorrow — ${dateStr}`;
  return dateStr;
}
