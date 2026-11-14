import { Routes } from '@angular/router';
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
    path: 'productos/:id/editar',
    component: EditProducto,
  },
  {
    path: '**',
    redirectTo: '',
  },
];
