import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService, SearchHistoryItem } from '../../../services/auth.service';
import { SearchFilters, SearchService } from '../../../services/search.service';
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
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly items = signal<HistoryViewItem[]>([]);
  returnUrl = '/';

  ngOnInit() {
    const rawReturnUrl = (this.route.snapshot.queryParamMap.get('returnUrl') || '').trim();
    this.returnUrl = rawReturnUrl.startsWith('/') ? rawReturnUrl : '/';
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.auth
      .fetchSearchHistory({ limit: 100 })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => this.items.set(items.map((item) => this.toViewItem(item))),
        error: () => this.error.set('Failed to load history'),
      });
  }

  open(item: HistoryViewItem) {
    const filters = this.buildFiltersFromHistory(item);
    if (!filters.query) return;

    this.searchService.search(filters);
    this.router.navigate(['/results'], { queryParams: { q: filters.query } });
  }

  goBack() {
    this.router.navigateByUrl(this.returnUrl || '/');
  }

  private toViewItem(item: SearchHistoryItem): HistoryViewItem {
    const parsed = this.parseHistoryQuery(item.query || '');
    return {
      ...item,
      parsed,
      displayQuery: parsed.query || (item.query || '').trim(),
    };
  }

  private buildFiltersFromHistory(item: HistoryViewItem): SearchFilters {
    const country = (item.region || '').trim().toLowerCase();
    const parsed = item.parsed;

    return {
      query: parsed.query,
      country: country || undefined,
      site: parsed.site || undefined,
      similar: parsed.similar || undefined,
      exclude: parsed.exclude?.length ? parsed.exclude : undefined,
      exact: parsed.exact?.length ? parsed.exact : undefined,
      fileTypes: parsed.fileTypes?.length ? parsed.fileTypes : undefined,
      page: 1,
    };
  }

  private parseHistoryQuery(input: string): SearchFilters {
    const raw = (input || '').trim();
    if (!raw) return { query: '' };

    const baseWords: string[] = [];
    const exact: string[] = [];
    const exclude: string[] = [];
    const fileTypes: string[] = [];
    let site: string | undefined;
    let similar: string | undefined;

    const tokens = raw.match(/"[^"]+"|\S+/g) || [];

    for (const token of tokens) {
      const lower = token.toLowerCase();

      if (token.startsWith('"') && token.endsWith('"') && token.length > 1) {
        const phrase = token.slice(1, -1).trim();
        if (phrase) exact.push(phrase);
        continue;
      }

      if (lower.startsWith('site:')) {
        const value = token.slice(5).trim().replace(/^https?:\/\//, '').replace(/^www\./, '');
        if (value) site = value.toLowerCase();
        continue;
      }

      if (lower.startsWith('related:')) {
        const value = token.slice(8).trim().replace(/^https?:\/\//, '').replace(/^www\./, '');
        if (value) similar = value.toLowerCase();
        continue;
      }

      if (lower.startsWith('filetype:')) {
        const type = token.slice(9).trim().toLowerCase();
        if (type) fileTypes.push(type);
        continue;
      }

      if (token.startsWith('-') && token.length > 1) {
        const word = token.slice(1).trim();
        if (word) exclude.push(word);
        continue;
      }

      baseWords.push(token);
    }

    return {
      query: baseWords.join(' ').trim(),
      site,
      similar,
      exclude: Array.from(new Set(exclude)),
      exact: Array.from(new Set(exact)),
      fileTypes: Array.from(new Set(fileTypes)),
    };
  }
}

interface HistoryViewItem extends SearchHistoryItem {
  parsed: SearchFilters;
  displayQuery: string;
}
