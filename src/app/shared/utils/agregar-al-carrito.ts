import { Router } from '@angular/router';
import { AuthService } from '../../api/services/auth/auth.service';
import { CarritoService } from '../../api/services/carrito/carrito.service';
import { NotificacionesService } from '../../api/services/notificaciones/notificaciones.service';
import { leerError } from '../../api/utils/leer-error';
import { Producto } from '../models/producto.model';

// agrega un producto solo si hay sesion
export function agregarAlCarrito(
  auth: AuthService,
  router: Router,
  carrito: CarritoService,
  notificaciones: NotificacionesService,
  producto: Producto,
  cantidad = 1,
): void {
  if (!auth.usuarioActual()) {
    notificaciones.mostrar('Iniciá sesión para agregar productos al carrito.', 'info');
    router.navigate(['/auth/signin'], { queryParams: { returnUrl: router.url } });
    return;
  }

  carrito.agregar(producto, cantidad).subscribe({
    next: () => {
      const unidades = cantidad === 1 ? 'unidad' : 'unidades';
      const verbo = cantidad === 1 ? 'se agregó' : 'se agregaron';
      notificaciones.mostrar(`${cantidad} ${unidades} de ${producto.nombre} ${verbo} al carrito.`);
    },
    error: (error) => notificaciones.mostrar(leerError(error).mensaje, 'error'),
  });
}
