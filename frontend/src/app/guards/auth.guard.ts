import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { FleetApiService } from '../services/fleet-api.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const api = inject(FleetApiService);
  const router = inject(Router);

  if (!api.isAuthenticated()) {
    return router.createUrlTree(['/login'], {
      queryParams: { redirect: state.url }
    });
  }

  return api.me().pipe(
    map(() => true),
    catchError(() =>
      of(
        router.createUrlTree(['/login'], {
          queryParams: { redirect: state.url }
        }),
      ),
    ),
  );
};
