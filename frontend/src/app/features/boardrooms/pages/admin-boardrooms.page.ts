import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { Amenity, Boardroom } from '../models/boardroom.model';
import { AmenitiesService } from '../services/amenities.service';
import { BoardroomsService } from '../services/boardrooms.service';

@Component({
  selector: 'app-admin-boardrooms-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-boardrooms.page.html',
  styleUrl: './admin-boardrooms.page.css'
})
export class AdminBoardroomsPage {
  private readonly fb = inject(FormBuilder);
  private readonly boardroomsService = inject(BoardroomsService);
  private readonly amenitiesService = inject(AmenitiesService);

  readonly boardrooms = signal<Boardroom[]>([]);
  readonly amenities = signal<Amenity[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly selectedAmenityIds = signal<Set<string>>(new Set());

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    description: [''],
    capacity: new FormControl<number>(4, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(1000)]
    }),
    location: [''],
    isActive: [true]
  });

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      rooms: this.boardroomsService.list(),
      amenities: this.amenitiesService.list()
    }).subscribe({
      next: ({ rooms, amenities }) => {
        this.boardrooms.set(rooms);
        this.amenities.set(amenities);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.errorMessage(err));
        this.loading.set(false);
      }
    });
  }

  startCreate(): void {
    this.editingId.set(null);
    this.form.reset({
      name: '',
      description: '',
      capacity: 4,
      location: '',
      isActive: true
    });
    this.selectedAmenityIds.set(new Set());
  }

  startEdit(boardroom: Boardroom): void {
    this.editingId.set(boardroom.id);
    this.form.reset({
      name: boardroom.name,
      description: boardroom.description ?? '',
      capacity: boardroom.capacity,
      location: boardroom.location ?? '',
      isActive: boardroom.isActive
    });
    this.selectedAmenityIds.set(new Set(boardroom.amenities.map((a) => a.id)));
  }

  cancel(): void {
    this.startCreate();
  }

  toggleAmenity(id: string): void {
    const set = new Set(this.selectedAmenityIds());
    if (set.has(id)) {
      set.delete(id);
    } else {
      set.add(id);
    }
    this.selectedAmenityIds.set(set);
  }

  isAmenitySelected(id: string): boolean {
    return this.selectedAmenityIds().has(id);
  }

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(null);

    const raw = this.form.getRawValue();
    const payload = {
      name: raw.name.trim(),
      description: raw.description?.trim() || undefined,
      capacity: Number(raw.capacity),
      location: raw.location?.trim() || undefined,
      isActive: raw.isActive,
      amenityIds: Array.from(this.selectedAmenityIds())
    };

    const id = this.editingId();
    const req = id
      ? this.boardroomsService.update(id, payload)
      : this.boardroomsService.create(payload);

    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.startCreate();
        this.refresh();
      },
      error: (err) => {
        this.error.set(this.errorMessage(err));
        this.saving.set(false);
      }
    });
  }

  remove(boardroom: Boardroom): void {
    if (!confirm(`Delete boardroom "${boardroom.name}"?`)) {
      return;
    }
    this.boardroomsService.remove(boardroom.id).subscribe({
      next: () => this.refresh(),
      error: (err) => this.error.set(this.errorMessage(err))
    });
  }

  private errorMessage(err: unknown): string {
    const e = err as { error?: { message?: string | string[] }; message?: string };
    const msg = e?.error?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    return msg || e?.message || 'Something went wrong.';
  }
}
