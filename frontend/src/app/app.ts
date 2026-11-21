import { Component, ChangeDetectionStrategy, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, pairwise, startWith } from 'rxjs';
import { MenuComponent } from './public/menu/menu.component';
import { FooterComponent } from './public/footer/footer.component';
import { ToastComponent } from './shared/components/toast/toast.component';

function rutaSinQuery(url: string): string {
  return url.split(/[?#]/)[0] ?? url;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MenuComponent, FooterComponent, ToastComponent],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.css',
})
export class App {
  constructor() {
    const router = inject(Router);

    router.events
      .pipe(
        filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd),
        map((evento) => evento.urlAfterRedirects),
        startWith(router.url),
        pairwise(),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe(([anterior, actual]) => {
        if (rutaSinQuery(anterior) !== rutaSinQuery(actual) && !actual.includes('#')) {
          window.scrollTo({ top: 0, behavior: 'instant' });
        }
      });
  }
}
