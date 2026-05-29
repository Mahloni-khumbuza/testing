import { Routes } from '@angular/router';

import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';
import { NavItem } from './core/layouts/shell/shell.component';

const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', path: '/admin/dashboard' },
  { label: 'Boardrooms', path: '/admin/boardrooms' },
  { label: 'Amenities', path: '/admin/amenities' },
  { label: 'Boardroom Blocks', path: '/admin/boardroom-blocks' },
  { label: 'Bookings', path: '/admin/bookings' },
  { label: 'Calendar', path: '/admin/calendar' },
  { label: 'Users', path: '/admin/users' },
  { label: 'Notifications', path: '/admin/notifications' },
  { label: 'Settings', path: '/admin/settings' },
  { label: 'Audit Logs', path: '/admin/audit-logs' }
];

const EMPLOYEE_NAV: NavItem[] = [
  { label: 'Dashboard', path: '/employee/dashboard' },
  { label: 'Boardrooms', path: '/employee/boardrooms' },
  { label: 'Bookings', path: '/employee/bookings' },
  { label: 'Calendar', path: '/employee/calendar' },
  { label: 'Notifications', path: '/employee/notifications' }
];

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/landing/pages/landing.page').then((m) => m.LandingPage)
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login/login.page').then((m) => m.LoginPage)
  },
  { path: 'register', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'admin',
    canActivate: [adminGuard],
    data: { brand: 'Admin Portal', navItems: ADMIN_NAV },
    loadComponent: () =>
      import('./core/layouts/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard.page').then((m) => m.DashboardPage)
      },
      {
        path: 'boardrooms',
        loadComponent: () =>
          import('./features/boardrooms/pages/admin-boardrooms.page').then(
            (m) => m.AdminBoardroomsPage
          )
      },
      {
        path: 'amenities',
        loadComponent: () =>
          import('./features/boardrooms/pages/admin-amenities.page').then(
            (m) => m.AdminAmenitiesPage
          )
      },
      {
        path: 'boardroom-blocks',
        loadComponent: () =>
          import('./features/boardroom-blocks/pages/boardroom-blocks.page').then(
            (m) => m.BoardroomBlocksPage
          )
      },
      {
        path: 'bookings',
        loadComponent: () =>
          import('./features/bookings/pages/bookings.page').then((m) => m.BookingsPage)
      },
      {
        path: 'calendar',
        loadComponent: () =>
          import('./features/calendar/pages/calendar.page').then((m) => m.CalendarPage)
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/users/pages/users.page').then((m) => m.UsersPage)
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/notifications/pages/notifications.page').then(
            (m) => m.NotificationsPage
          )
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/pages/settings.page').then((m) => m.SettingsPage)
      },
      {
        path: 'audit-logs',
        loadComponent: () =>
          import('./features/audit-logs/pages/audit-logs.page').then((m) => m.AuditLogsPage)
      }
    ]
  },
  {
    path: 'employee',
    canActivate: [authGuard],
    data: { brand: 'Employee Portal', navItems: EMPLOYEE_NAV },
    loadComponent: () =>
      import('./core/layouts/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard.page').then((m) => m.DashboardPage)
      },
      {
        path: 'boardrooms',
        loadComponent: () =>
          import('./features/boardrooms/pages/browse-boardrooms.page').then(
            (m) => m.BrowseBoardroomsPage
          )
      },
      {
        path: 'boardrooms/:id',
        loadComponent: () =>
          import('./features/boardrooms/pages/boardroom-detail.page').then(
            (m) => m.BoardroomDetailPage
          )
      },
      {
        path: 'bookings',
        loadComponent: () =>
          import('./features/bookings/pages/bookings.page').then((m) => m.BookingsPage)
      },
      {
        path: 'calendar',
        loadComponent: () =>
          import('./features/calendar/pages/calendar.page').then((m) => m.CalendarPage)
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/notifications/pages/notifications.page').then(
            (m) => m.NotificationsPage
          )
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
