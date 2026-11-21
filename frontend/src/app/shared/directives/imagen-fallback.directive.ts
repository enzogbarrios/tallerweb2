import { Directive, HostListener, Input } from '@angular/core';

@Directive({
  selector: 'img[appImagenFallback]',
})
export class ImagenFallbackDirective {
  @Input() appImagenFallback = 'producto-placeholder.svg';

  @HostListener('error', ['$event'])
  alFallarImagen(event: Event): void {
    const imagen = event.target as HTMLImageElement;
    // Si el placeholder tambien falla, cortamos para no quedar en un loop de error.
    if (imagen.src.endsWith(this.appImagenFallback)) {
      return;
    }
    imagen.src = this.appImagenFallback;
  }
}
