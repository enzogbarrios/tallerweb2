import { Routes } from '@angular/router';
import { CreateProducto } from './pages/create-producto/create-producto';
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
