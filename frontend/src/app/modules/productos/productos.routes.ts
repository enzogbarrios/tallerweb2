import { Routes } from '@angular/router';
import { adminGuard } from '../../shared/guards/admin.guard';
import { CreateProducto } from '../admin/pages/create-producto/create-producto';
import { DetailProducto } from './pages/detail-producto/detail-producto';
import { ListProductos } from './pages/list-productos/list-productos';

export const productosRoutes: Routes = [
  {
    path: '',
    component: ListProductos,
  },
  {
    path: 'nuevo',
    component: CreateProducto,
    canActivate: [adminGuard],
  },
  {
    path: ':id',
    component: DetailProducto,
  },
  {
    path: '**',
    redirectTo: '',
  },
];
