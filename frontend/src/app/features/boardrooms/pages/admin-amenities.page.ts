import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Amenity } from '../models/boardroom.model';
import { AmenitiesService } from '../services/amenities.service';

@Component({
  selector: 'app-admin-amenities-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-amenities.page.html',
  styleUrl: './admin-amenities.page.css'
})
export class AdminAmenitiesPage {
  private readonly fb = inject(FormBuilder);
  private readonly amenitiesService = inject(AmenitiesService);

  readonly amenities = signal<Amenity[]>([]);
  readonly loading = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    description: [''],
    icon: ['']
  });

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.error.set(null);
    this.amenitiesService.list().subscribe({
      next: (list) => {
        this.amenities.set(list);
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
    this.form.reset({ name: '', description: '', icon: '' });
  }

  startEdit(amenity: Amenity): void {
    this.editingId.set(amenity.id);
    this.form.reset({
      name: amenity.name,
      description: amenity.description ?? '',
      icon: amenity.icon ?? ''
    });
  }

  cancel(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', description: '', icon: '' });
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
      icon: raw.icon?.trim() || undefined
    };

    const id = this.editingId();
    const req = id
      ? this.amenitiesService.update(id, payload)
      : this.amenitiesService.create(payload);

    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.cancel();
        this.refresh();
      },
      error: (err) => {
        this.error.set(this.errorMessage(err));
        this.saving.set(false);
      }
    });
  }

  remove(amenity: Amenity): void {
    if (!confirm(`Delete amenity "${amenity.name}"?`)) {
      return;
    }
    this.amenitiesService.remove(amenity.id).subscribe({
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
