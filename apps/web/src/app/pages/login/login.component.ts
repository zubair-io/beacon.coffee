import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'beacon-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  handle = signal('');
  loading = signal(false);
  error = signal('');

  async onLogin(): Promise<void> {
    const h = this.handle().trim().replace(/^@/, '');
    if (!h) {
      this.error.set('Please enter your Bluesky handle');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    try {
      await this.auth.login(h);
    } catch (err) {
      console.error('Login failed:', err);
      const message = err instanceof Error ? err.message : String(err);
      this.error.set(`Login failed: ${message}`);
      this.loading.set(false);
    }
  }

  browsWithoutLogin(): void {
    this.router.navigate(['/home']);
  }
}
