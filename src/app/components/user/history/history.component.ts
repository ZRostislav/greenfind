import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService, SearchHistoryItem } from '../../../services/auth.service';
import { SearchService } from '../../../services/search.service';
import {
  LucideAngularModule,
  Search,
  Mic,
  Sliders,
  Globe,
  Link,
  Check,
  X,
  Plus,
  Minus,
  Type,
  FileText,
  Leaf,
  ArrowRight,
  LogOutIcon,
  ArrowLeftIcon,
  UserIcon,
  MailIcon,
  ShieldIcon,
  CheckCircleIcon,
  HistoryIcon,
  AlertCircleIcon,
  LanguagesIcon,
  ChevronRightIcon,
  LockIcon,
} from 'lucide-angular';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  templateUrl: './history.component.html',
})
export class HistoryComponent implements OnInit {
  readonly SearchIcon = Search;
  readonly MicIcon = Mic;
  readonly SlidersIcon = Sliders;
  readonly GlobeIcon = Globe;
  readonly LinkIcon = Link;
  readonly CheckIcon = Check;
  readonly XIcon = X;
  readonly PlusIcon = Plus;
  readonly MinusIcon = Minus;
  readonly TypeIcon = Type;
  readonly FileTextIcon = FileText;
  readonly LeafIcon = Leaf;
  readonly ArrowRightIcon = ArrowRight;
  readonly LogOutIcon = LogOutIcon;
  readonly ArrowLeftIcon = ArrowLeftIcon;
  readonly UserIcon = UserIcon;
  readonly MailIcon = MailIcon;
  readonly ShieldIcon = ShieldIcon;
  readonly CheckCircleIcon = CheckCircleIcon;
  readonly HistoryIcon = HistoryIcon;
  readonly AlertCircleIcon = AlertCircleIcon;
  readonly LanguagesIcon = LanguagesIcon;
  readonly ChevronRightIcon = ChevronRightIcon;
  readonly LockIcon = LockIcon;

  private readonly auth = inject(AuthService);
  private readonly searchService = inject(SearchService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly items = signal<SearchHistoryItem[]>([]);

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.auth
      .fetchSearchHistory({ limit: 100 })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => this.items.set(items),
        error: () => this.error.set('Failed to load history'),
      });
  }

  open(item: SearchHistoryItem) {
    const query = (item.query || '').trim();
    if (!query) return;
    this.searchService.search({ query });
    this.router.navigate(['/results'], { queryParams: { q: query } });
  }
}
