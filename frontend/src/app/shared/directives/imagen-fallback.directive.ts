import { Directive, HostListener, Input } from '@angular/core';

@Directive({
  selector: 'img[appImagenFallback]',
})
export class ImagenFallbackDirective {
  @Input() appImagenFallback = 'producto-placeholder.svg';

  @HostListener('error', ['$event'])
  alFallarImagen(event: Event): void {
    const imagen = event.target as HTMLImageElement;
    imagen.src = this.appImagenFallback;
  }
}
