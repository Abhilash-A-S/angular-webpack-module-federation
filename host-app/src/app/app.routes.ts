import { loadRemoteModule } from '@angular-architects/module-federation';
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../app/dashboard-component/dashboard-component').then(
        (component) => {
          return component.DashboardComponent;
        },
      ),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('../app/dashboard-component/dashboard-component').then(
        (component) => {
          return component.DashboardComponent;
        },
      ),
  },
];
