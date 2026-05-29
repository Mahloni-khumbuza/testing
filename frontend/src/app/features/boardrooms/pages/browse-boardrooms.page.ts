import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Boardroom } from '../models/boardroom.model';
import { BoardroomsService } from '../services/boardrooms.service';

@Component({
  selector: 'app-browse-boardrooms-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './browse-boardrooms.page.html',
  styleUrl: './browse-boardrooms.page.css'
})
export class BrowseBoardroomsPage {
  private readonly boardroomsService = inject(BoardroomsService);

  readonly boardrooms = signal<Boardroom[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly search = signal('');
  readonly minCapacity = signal<number | null>(null);

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const min = this.minCapacity();
    return this.boardrooms().filter((r) => {
      if (min !== null && r.capacity < min) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        (r.location ?? '').toLowerCase().includes(q) ||
        (r.description ?? '').toLowerCase().includes(q) ||
        r.amenities.some((a) => a.name.toLowerCase().includes(q))
      );
    });
  });

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.error.set(null);
    this.boardroomsService.list(true).subscribe({
      next: (list) => {
        this.boardrooms.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.errorMessage(err));
        this.loading.set(false);
      }
    });
  }

  setSearch(value: string): void {
    this.search.set(value);
  }

  setMinCapacity(value: string): void {
    const n = value === '' ? null : Number(value);
    this.minCapacity.set(Number.isFinite(n) ? n : null);
  }

  private errorMessage(err: unknown): string {
    const e = err as { error?: { message?: string | string[] }; message?: string };
    const msg = e?.error?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    return msg || e?.message || 'Something went wrong.';
  }
}
