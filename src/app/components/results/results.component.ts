import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import {
  KnowledgeGraph,
  KnowledgeGraphFact,
  KnowledgeGraphRelation,
  SearchFilters,
  SearchService,
} from '../../services/search.service';
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
} from 'lucide-angular';
@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  templateUrl: './results.component.html',
})
export class ResultsComponent implements OnInit {
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

  results$: Observable<any[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  relatedSearches$: Observable<any[]>;
  pagination$: Observable<any>;
  knowledgeGraph$: Observable<KnowledgeGraph | null>;

  query = '';
  country = '';
  city = '';

  siteInput = '';
  similarInput = '';
  activeSite: string | null = null;
  activeSimilar: string | null = null;

  excludeInput = '';
  excludeWords: string[] = [];
  exactInput = '';
  exactWords: string[] = [];

  readonly fileTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
  fileTypesSelected: string[] = [];

  siteError: string | null = null;
  similarError: string | null = null;
  showFilters = false;

  constructor(
    private searchService: SearchService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.results$ = this.searchService.results$;
    this.loading$ = this.searchService.loading$;
    this.error$ = this.searchService.error$;
    this.relatedSearches$ = this.searchService.relatedSearches$;
    this.pagination$ = this.searchService.pagination$;
    this.knowledgeGraph$ = this.searchService.knowledgeGraph$;
  }

  ngOnInit() {
    const savedFilters = this.searchService.getCurrentFilters();
    this.patchFromFilters(savedFilters);

    const queryFromRoute = this.route.snapshot.queryParamMap.get('q')?.trim() ?? '';
    if (queryFromRoute) {
      this.query = queryFromRoute;
    }

    const shouldRunInitialSearch =
      !!this.query &&
      !this.searchService.isLoading() &&
      (!this.searchService.hasResults() || this.query !== savedFilters.query);

    if (shouldRunInitialSearch) {
      this.doSearch();
    }
  }

  doSearch() {
    const payload = this.buildPayload();
    if (!payload) return;

    this.searchService.search(payload);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: payload.query },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  addWord(type: 'exact' | 'exclude') {
    const input = type === 'exact' ? this.exactInput : this.excludeInput;
    const word = input.trim();
    if (!word) return;

    const target = type === 'exact' ? this.exactWords : this.excludeWords;
    if (!target.includes(word)) {
      target.push(word);
    }

    if (type === 'exact') {
      this.exactInput = '';
    } else {
      this.excludeInput = '';
    }
  }

  removeWord(type: 'exact' | 'exclude', word: string) {
    if (type === 'exact') {
      this.exactWords = this.exactWords.filter((item) => item !== word);
      return;
    }

    this.excludeWords = this.excludeWords.filter((item) => item !== word);
  }

  applySiteFilter() {
    if (!this.siteInput.trim()) {
      this.removeSiteFilter();
      return;
    }

    if (!this.isValidDomain(this.siteInput)) {
      this.siteError = 'Enter a valid domain';
      return;
    }

    this.siteError = null;
    this.activeSite = this.normalizeDomain(this.siteInput);
    this.siteInput = this.activeSite;
  }

  applySimilarFilter() {
    if (!this.similarInput.trim()) {
      this.removeSimilarFilter();
      return;
    }

    if (!this.isValidDomain(this.similarInput)) {
      this.similarError = 'Enter a valid domain';
      return;
    }

    this.similarError = null;
    this.activeSimilar = this.normalizeDomain(this.similarInput);
    this.similarInput = this.activeSimilar;
  }

  removeSiteFilter() {
    this.activeSite = null;
    this.siteInput = '';
    this.siteError = null;
  }

  removeSimilarFilter() {
    this.activeSimilar = null;
    this.similarInput = '';
    this.similarError = null;
  }

  toggleFileType(type: string) {
    if (this.fileTypesSelected.includes(type)) {
      this.fileTypesSelected = this.fileTypesSelected.filter((item) => item !== type);
      return;
    }

    this.fileTypesSelected.push(type);
  }

  hasActiveFilters(): boolean {
    return !!(
      this.country.trim() ||
      this.city.trim() ||
      this.activeSite ||
      this.activeSimilar ||
      this.excludeWords.length ||
      this.exactWords.length ||
      this.fileTypesSelected.length
    );
  }

  trackByLink(index: number, item: any): string {
    return item.link ?? `${index}`;
  }

  trackByValue(index: number, value: string): string {
    return value || `${index}`;
  }

  trackByFact(index: number, fact: KnowledgeGraphFact): string {
    return `${fact.label}-${fact.value}-${index}`;
  }

  trackByRelation(index: number, relation: KnowledgeGraphRelation): string {
    return relation.link ?? `${relation.name}-${index}`;
  }

  trackBySource(index: number, source: string): string {
    return source || `${index}`;
  }

  private patchFromFilters(filters: SearchFilters) {
    this.query = filters.query ?? '';
    this.country = filters.country ?? '';
    this.city = filters.city ?? '';

    this.activeSite = filters.site ?? null;
    this.activeSimilar = filters.similar ?? null;
    this.siteInput = this.activeSite ?? '';
    this.similarInput = this.activeSimilar ?? '';

    this.excludeWords = [...(filters.exclude ?? [])];
    this.exactWords = [...(filters.exact ?? [])];
    this.fileTypesSelected = [...(filters.fileTypes ?? [])];
  }

  private buildPayload(): SearchFilters | null {
    const query = this.query.trim();
    if (!query) return null;

    return {
      query,
      country: this.country.trim().toLowerCase() || undefined,
      city: this.city.trim() || undefined,
      site: this.activeSite || undefined,
      similar: this.activeSimilar || undefined,
      exclude: this.excludeWords,
      exact: this.exactWords,
      fileTypes: this.fileTypesSelected,
    };
  }

  private normalizeDomain(domain: string): string {
    return domain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .trim()
      .toLowerCase();
  }

  private isValidDomain(domain: string): boolean {
    const regex = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
    return regex.test(domain.trim());
  }

  goToPage(page: number) {
    const currentFilters = this.searchService.getCurrentFilters();
    const newFilters = { ...currentFilters, page };
    this.searchService.search(newFilters);
  }

  searchRelated(query: string) {
    this.query = query;
    this.doSearch();
  }
}
