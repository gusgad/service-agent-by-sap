import { Routes } from '@angular/router';
import { RequestComponent } from './request/request.component';
import { StatusComponent } from './status/status.component';

export const routes: Routes = [
  { path: '', redirectTo: '/request', pathMatch: 'full' },
  { path: 'request', component: RequestComponent },
  { path: 'status', component: StatusComponent }
];