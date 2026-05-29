import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../auth/services/auth.service';
import { SystemSetting } from '../models/system-setting.model';
import { SystemSettingsService } from '../services/system-settings.service';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.css'
})
export class SettingsPage {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(SystemSettingsService);
  private readonly auth = inject(AuthService);

  readonly settings = signal<SystemSetting[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly showCreate = signal(false);

  readonly canEdit = this.auth.isSuperAdmin;

  readonly editForm = this.fb.nonNullable.group({
    value: [''],
    description: ['']
  });

  readonly createForm = this.fb.nonNullable.group({
    key: ['', [Validators.required, Validators.pattern(/^[a-z][a-z0-9._-]*$/)]],
    value: [''],
    description: ['']
  });

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service.list().subscribe({
      next: (list) => {
        this.settings.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.errorMessage(err));
        this.loading.set(false);
      }
    });
  }

  startEdit(setting: SystemSetting): void {
    this.editingId.set(setting.id);
    this.editForm.reset({
      value: setting.value ?? '',
      description: setting.description ?? ''
    });
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  submitEdit(setting: SystemSetting): void {
    if (this.editForm.invalid || this.saving()) return;
    this.saving.set(true);
    this.error.set(null);
    const raw = this.editForm.getRawValue();
    this.service
      .update(setting.id, {
        value: raw.value,
        description: raw.description || undefined
      })
      .subscribe({
        next: (updated) => {
          this.settings.update((list) => list.map((s) => (s.id === updated.id ? updated : s)));
          this.editingId.set(null);
          this.saving.set(false);
        },
        error: (err) => {
          this.error.set(this.errorMessage(err));
          this.saving.set(false);
        }
      });
  }

  toggleCreate(): void {
    if (this.showCreate()) {
      this.showCreate.set(false);
    } else {
      this.createForm.reset({ key: '', value: '', description: '' });
      this.showCreate.set(true);
    }
  }

  submitCreate(): void {
    if (this.createForm.invalid || this.saving()) {
      this.createForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    const raw = this.createForm.getRawValue();
    this.service
      .create({
        key: raw.key.trim(),
        value: raw.value || undefined,
        description: raw.description || undefined
      })
      .subscribe({
        next: () => {
          this.showCreate.set(false);
          this.saving.set(false);
          this.refresh();
        },
        error: (err) => {
          this.error.set(this.errorMessage(err));
          this.saving.set(false);
        }
      });
  }

  remove(setting: SystemSetting): void {
    if (!confirm(`Delete setting "${setting.key}"?`)) return;
    this.service.remove(setting.id).subscribe({
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
