import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoaderService } from './services/loader.service';
import { LucideAngularModule, Leaf, Search, Menu, Heart } from 'lucide-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LucideAngularModule],
  template: `
    <div
      class="relative min-h-screen w-full flex flex-col font-sans text-ui-dark bg-ui-base overflow-x-hidden transition-opacity duration-600 ease-in-out selection:bg-ui-green selection:text-ui-base"
      [class.opacity-100]="!isLoading()"
      [class.opacity-0]="isLoading()"
    >
      <main>
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
  isLoading = this.loader.isLoading;

  ngOnInit() {
    setTimeout(() => this.loader.hide(), 1200);
  }
}
