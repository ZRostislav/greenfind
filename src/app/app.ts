import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { LoaderService } from './services/loader.service';
import { LucideAngularModule, Leaf, Search, Menu, Heart } from 'lucide-angular';
import { AuthService } from './services/auth.service';
import { AuthStateService } from './services/auth-state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, LucideAngularModule],
  template: `
    <div
      class="relative min-h-screen w-full flex flex-col font-sans text-ui-dark bg-ui-base overflow-x-hidden transition-opacity duration-600 ease-in-out selection:bg-ui-green selection:text-ui-base"
      [class.opacity-100]="!isLoading()"
      [class.opacity-0]="isLoading()"
    >
      <header
        class="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/20 backdrop-blur-md"
      >
        <div class="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <a routerLink="/" class="text-white font-extrabold tracking-tight">GreenFind</a>

          <ng-container *ngIf="user$ | async as user; else guestTpl">
            <div class="flex items-center gap-3 text-sm">
              <a routerLink="/history" class="text-white/70 hover:text-white font-bold"
                >History</a
              >
              <a routerLink="/me" class="text-white/70 hover:text-white font-bold"
                >{{ user.username }}</a
              >
              <button
                (click)="logout()"
                class="h-9 px-3 rounded-xl bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 text-red-100 font-extrabold"
              >
                Logout
              </button>
            </div>
          </ng-container>

          <ng-template #guestTpl>
            <div class="flex items-center gap-3 text-sm">
              <a routerLink="/login" class="text-white/70 hover:text-white font-bold">Login</a>
              <a
                routerLink="/register"
                class="h-9 px-3 rounded-xl bg-ui-green text-ui-base font-extrabold"
                >Register</a
              >
            </div>
          </ng-template>
        </div>
      </header>

      <main class="pt-14">
        <router-outlet></router-outlet>
      </main>

      <footer class="w-full py-8 mt-auto z-10 border-t border-white/5 bg-black/10 backdrop-blur-sm">
        <div
          class="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center gap-4 text-ui-dark/50 text-sm font-josefin text-center"
        >
          <p class="flex items-center gap-2">&copy; 2026 GreenFind</p>
        </div>
      </footer>
    </div>
  `,
})
export class App implements OnInit {
  readonly LeafIcon = Leaf;
  readonly SearchIcon = Search;
  readonly MenuIcon = Menu;
  readonly HeartIcon = Heart;
  private loader = inject(LoaderService);
  private auth = inject(AuthService);
  private authState = inject(AuthStateService);
  isLoading = this.loader.isLoading;
  user$ = this.authState.user$;

  ngOnInit() {
    setTimeout(() => this.loader.hide(), 1200);
  }

  logout() {
    this.auth.logout().subscribe();
  }
}
