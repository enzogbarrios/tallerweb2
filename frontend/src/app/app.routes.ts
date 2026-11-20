import { Routes } from '@angular/router';
import { HomeComponent } from './public/home/home.component';
import { adminGuard } from './shared/guards/admin.guard';
import { authGuard } from './shared/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'productos',
    loadChildren: () =>
      import('./modules/productos/productos.routes').then((modulo) => modulo.productosRoutes),
  },
  {
    path: 'carrito',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./modules/carrito/carrito.routes').then((modulo) => modulo.carritoRoutes),
  },
  {
    path: 'mis-pedidos',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./modules/usuarios/pages/mis-pedidos/mis-pedidos').then(
            (modulo) => modulo.MisPedidos,
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./modules/usuarios/pages/detalle-pedido/detalle-pedido').then(
            (modulo) => modulo.DetallePedido,
          ),
      },
    ],
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadChildren: () => import('./modules/admin/admin.routes').then((modulo) => modulo.adminRoutes),
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./modules/usuarios/usuarios.routes').then((modulo) => modulo.usuariosRoutes),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
