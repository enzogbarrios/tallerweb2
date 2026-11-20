import { Routes } from '@angular/router';
import { AdminCategorias } from './pages/admin-categorias/admin-categorias';
import { AdminProductos } from './pages/admin-productos/admin-productos';
import { EditProducto } from './pages/edit-producto/edit-producto';
import { Ventas } from './pages/ventas/ventas';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminProductos,
  },
  {
    path: 'ventas',
    component: Ventas,
  },
  {
    path: 'categorias',
    component: AdminCategorias,
  },
  {
    path: 'productos/:id/editar',
    component: EditProducto,
  },
  {
    path: '**',
    redirectTo: '',
  },
];
