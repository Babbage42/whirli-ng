import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./app/playground/playground.component').then(
        (m) => m.PlaygroundComponent,
      ),
  },
];
