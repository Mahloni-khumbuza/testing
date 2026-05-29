import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from '../../../features/auth/services/auth.service';

export interface NavItem {
  label: string;
  path: string;
}

export interface ShellRouteData {
  brand?: string;
  navItems?: NavItem[];
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css'
})
export class ShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly routeData = toSignal(
    this.route.data.pipe(map((data) => data as ShellRouteData)),
    { initialValue: {} as ShellRouteData }
  );

  readonly brand = computed(() => this.routeData().brand ?? 'Boardroom Booking');
  readonly navItems = computed<NavItem[]>(() => this.routeData().navItems ?? []);
  readonly userLabel = computed(() => {
    const u = this.auth.currentUser();
    if (!u) return '';
    const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
    return name || u.email;
  });
  readonly roleLabel = computed(() => this.auth.role() ?? '');

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/');
  }
}
