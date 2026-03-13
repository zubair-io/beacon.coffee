import { inject } from '@angular/core';
import { type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);

  if (auth.isInitializing()) {
    await auth.init();
  }

  // Always allow — unauthenticated users can browse, writes prompt login
  return true;
};
