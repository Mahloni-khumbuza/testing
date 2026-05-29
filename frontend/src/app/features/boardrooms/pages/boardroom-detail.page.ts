import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { Boardroom } from '../models/boardroom.model';
import { BoardroomsService } from '../services/boardrooms.service';

@Component({
  selector: 'app-boardroom-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './boardroom-detail.page.html',
  styleUrl: './boardroom-detail.page.css'
})
export class BoardroomDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly boardroomsService = inject(BoardroomsService);

  readonly boardroom = signal<Boardroom | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.load(id);
    }
  }

  private load(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.boardroomsService.get(id).subscribe({
      next: (room) => {
        this.boardroom.set(room);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.errorMessage(err));
        this.loading.set(false);
      }
    });
  }

  private errorMessage(err: unknown): string {
    const e = err as { error?: { message?: string | string[] }; message?: string };
    const msg = e?.error?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    return msg || e?.message || 'Boardroom not found.';
  }
}
