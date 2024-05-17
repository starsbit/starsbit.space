import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'blog',
    loadChildren: () =>
      import('./pages/blog/blog.routes').then((m) => m.BLOG_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
