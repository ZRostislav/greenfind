// components/results/results.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { SearchService } from '../../services/search.service';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen w-full flex flex-col font-sans text-white">
      <header
        class="sticky top-0 z-50 w-full bg-[#318429]/80 backdrop-blur-xl border-b border-white/10 px-4 md:px-8 py-4"
      >
        <div class="flex flex-wrap items-end gap-6 max-w-[1600px]">
          <h2
            routerLink="/"
            class="font-josefin text-2xl font-bold tracking-tighter text-white cursor-pointer hover:opacity-80 transition-opacity shrink-0 mb-1.5"
          >
            Green<span class="text-ui-green">Find</span>
          </h2>

          <div class="flex-grow max-w-3xl relative group">
            <div
              class="relative flex items-center bg-white/10 border border-white/10 rounded-xl overflow-hidden focus-within:border-white/40  transition-all duration-300"
            >
              <input
                type="text"
                placeholder="Search the web..."
                [(ngModel)]="query"
                (keydown.enter)="doSearch()"
                class="w-full bg-transparent px-5 py-2.5 text-white placeholder:text-white/30 outline-none text-lg"
              />
              <button
                (click)="doSearch()"
                class="cursor-pointer px-5 text-ui-green hover:bg-white/10 transition-colors self-stretch flex items-center justify-center border-l border-white/10"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div class="flex flex-col md:flex-row w-full max-w-[1600px] ml-37">
        <main class="w-full md:w-[65%] lg:w-[60%] px-4 md:pr-12 py-8">
          <div class="py-12 flex flex-col items-center justify-center" *ngIf="loading$ | async">
            <div
              class="w-10 h-10 border-2 border-ui-green/20 border-t-ui-green rounded-full animate-spin"
            ></div>
            <p class="mt-4 text-white/30 text-xs font-josefin uppercase tracking-[0.2em]">
              Analyzing Ecosystem
            </p>
          </div>

          <div class="space-y-10">
            <div
              *ngIf="!(results$ | async)?.length && !(loading$ | async)"
              class="text-white/60 py-20 font-light"
            >
              No trails found.
            </div>

            <div
              *ngFor="let item of results$ | async; trackBy: trackByLink"
              class="group relative animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              <div class="flex items-start gap-4">
                <div
                  class="mt-1.5 p-2 bg-white/5 rounded-xl border border-white/10 group-hover:border-ui-green/30 transition-all duration-300"
                >
                  <img
                    *ngIf="item.favicon"
                    [src]="item.favicon"
                    class="w-5 h-5 grayscale group-hover:grayscale-0 transition-all"
                    (error)="item.favicon = './default-favicon.png'"
                    alt="Favicon"
                  />
                </div>

                <div class="flex-grow">
                  <cite
                    class="not-italic text-ui-green/60 text-[11px] font-mono tracking-tight block mb-1"
                  >
                    {{ item.link }}
                  </cite>
                  <h3 class="text-xl font-josefin font-semibold mb-2">
                    <a
                      [href]="item.link"
                      target="_blank"
                      class="text-white group-hover:text-ui-green transition-colors underline-offset-4 decoration-ui-green/0 group-hover:decoration-ui-green/30 underline"
                    >
                      {{ item.title }}
                    </a>
                  </h3>
                  <p class="text-white/60 leading-relaxed text-sm max-w-2xl font-light">
                    {{ item.snippet }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>

        <aside class="hidden lg:block w-[35%] pt-8 pr-8">
          <div class="sticky top-32 space-y-6">
            <div class="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm">
              <h4
                class="text-ui-green font-josefin font-bold mb-4 uppercase text-xs tracking-widest"
              >
                Search Insights
              </h4>
              <p class="text-white/50 text-xs leading-loose">
                You are using <strong>GreenFind</strong>, an eco-conscious search layer. All results
                are filtered to prioritize sustainability and open-source intelligence.
              </p>
              <div
                class="mt-6 pt-6 border-t border-white/5 flex items-center justify-between text-[10px] text-white/30 font-mono"
              >
                <span>Nodes: 128</span>
                <span>Status: Optimized</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  `,
})
export class ResultsComponent implements OnInit {
  results$: Observable<any[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;

  // Search / filters state (simplified copy from Main)
  query = '';
  filters: any = { site: '', similar: '' };
  excludeInput = '';
  excludeWords: string[] = [];
  exactInput = '';
  exactWords: string[] = [];
  activeSite: { domain: string; favicon: string } | null = null;
  activeSimilar: { domain: string; favicon: string } | null = null;
  fileTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
  fileTypesSelected: string[] = [];

  constructor(
    private searchService: SearchService,
    private route: ActivatedRoute,
  ) {
    this.results$ = this.searchService.results$;
    this.loading$ = this.searchService.loading$;
    this.error$ = this.searchService.error$;
  }

  ngOnInit() {
    this.query = this.route.snapshot.queryParamMap.get('q')?.trim() || '';
  }

  doSearch() {
    if (!this.query?.trim()) return;

    // normalize site/similar
    if (this.filters.site) {
      const domain = this.filters.site
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .trim();
      this.filters.site = domain;
      this.activeSite = {
        domain,
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      };
    }

    if (this.filters.similar) {
      const domain = this.filters.similar
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .trim();
      this.filters.similar = domain;
      this.activeSimilar = {
        domain,
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      };
    }

    this.searchService.search({
      query: this.query.trim(),
      site: this.activeSite?.domain,
      similar: this.activeSimilar?.domain,
      exclude: this.excludeWords,
      exact: this.exactWords,
      fileTypes: this.fileTypesSelected,
    });
  }

  addExactWord() {
    const word = this.exactInput.trim();
    if (!word) return;
    if (this.exactWords.includes(word)) return;
    this.exactWords.push(word);
    this.exactInput = '';
  }

  removeExactWord(word: string) {
    this.exactWords = this.exactWords.filter((w) => w !== word);
  }

  addExcludeWord() {
    const word = this.excludeInput.trim();
    if (!word) return;
    if (this.excludeWords.includes(word)) return;
    this.excludeWords.push(word);
    this.excludeInput = '';
  }

  removeExcludeWord(word: string) {
    this.excludeWords = this.excludeWords.filter((w) => w !== word);
  }

  validateSite() {
    return true;
  }

  validateSimilar() {
    return true;
  }

  applySiteFilter() {
    // not used in simplified UI
  }

  applySimilarFilter() {
    // not used in simplified UI
  }

  toggleFileType(type: string) {
    if (this.fileTypesSelected.includes(type)) {
      this.fileTypesSelected = this.fileTypesSelected.filter((t) => t !== type);
    } else {
      this.fileTypesSelected.push(type);
    }
  }

  removeFileType(type: string) {
    this.fileTypesSelected = this.fileTypesSelected.filter((t) => t !== type);
  }

  removeSiteFilter() {
    this.activeSite = null;
    this.filters.site = '';
  }

  removeSimilarFilter() {
    this.activeSimilar = null;
    this.filters.similar = '';
  }

  hasActiveFilters(): boolean {
    return !!(
      this.activeSite ||
      this.activeSimilar ||
      this.excludeWords.length ||
      this.exactWords.length ||
      this.fileTypesSelected.length
    );
  }

  trackByLink(index: number, item: any) {
    return item.link;
  }
}
