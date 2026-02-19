// components/results/results.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { SearchService } from '../../services/search.service';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen w-full flex flex-col font-sans text-white">
      <header
        class="sticky top-0 z-50 w-full bg-[#318429]/80 backdrop-blur-xl border-b border-white/10 px-4 md:px-8 py-4"
      >
        <div class="flex flex-wrap items-center gap-6 max-w-[1600px]">
          <h2
            class="font-josefin text-2xl font-bold tracking-tighter text-white cursor-pointer hover:opacity-80 transition-opacity shrink-0"
          >
            Green<span class="text-ui-green">Find</span>
          </h2>

          <div class="flex-grow max-w-3xl relative group">
            <div
              class="absolute -inset-0.5 bg-ui-green/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-300"
            ></div>
            <div
              class="relative flex items-center bg-white/10 border border-white/10 rounded-xl overflow-hidden focus-within:border-ui-green/50 transition-all"
            >
              <input
                type="text"
                placeholder="Search the green web..."
                [(ngModel)]="query"
                (keydown.enter)="doSearch()"
                class="w-full bg-transparent px-5 py-2.5 text-white placeholder:text-white/30 outline-none text-lg"
              />
              <button
                (click)="doSearch()"
                class="px-5 text-ui-green hover:bg-white/5 transition-colors"
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

      <div class="flex flex-col md:flex-row w-full max-w-[1600px] mx-auto">
        <main class="w-full md:w-[65%] lg:w-[60%] px-4 md:pl-24 md:pr-12 py-8">
          <div
            class="mb-8 p-6 bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl shadow-xl"
          >
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div class="space-y-1">
                <label class="text-[10px] uppercase tracking-widest text-white/40 ml-2"
                  >Site Scope</label
                >
                <input
                  type="text"
                  placeholder="site:example.com"
                  [(ngModel)]="filters.site"
                  class="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-ui-green/50 transition-all"
                />
              </div>
              <div class="space-y-1">
                <label class="text-[10px] uppercase tracking-widest text-white/40 ml-2"
                  >Exclude Words</label
                >
                <div class="flex gap-2">
                  <input
                    type="text"
                    placeholder="Word..."
                    [(ngModel)]="excludeInput"
                    (keydown.enter)="addExcludeWord()"
                    class="flex-grow bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-ui-green/50"
                  />
                  <button
                    (click)="addExcludeWord()"
                    class="bg-white/10 hover:bg-white/20 px-3 rounded-xl transition-colors text-xs"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            <div class="flex flex-wrap gap-2 mb-4" *ngIf="hasActiveFilters()">
              <span
                *ngIf="activeSite"
                class="flex items-center gap-2 bg-ui-green/20 text-ui-green border border-ui-green/30 px-3 py-1 rounded-full text-xs animate-in zoom-in"
              >
                site:{{ activeSite.domain }}
                <button (click)="removeSiteFilter()" class="hover:text-white">✕</button>
              </span>
              <span
                *ngFor="let w of excludeWords"
                class="flex items-center gap-2 bg-red-500/20 text-red-300 border border-red-500/30 px-3 py-1 rounded-full text-xs animate-in zoom-in"
              >
                -{{ w }}
                <button (click)="removeExcludeWord(w)" class="hover:text-white">✕</button>
              </span>
            </div>

            <div class="flex flex-wrap gap-2 pt-4 border-t border-white/5">
              <button
                *ngFor="let t of fileTypes"
                (click)="toggleFileType(t)"
                [class]="
                  fileTypesSelected.includes(t)
                    ? 'bg-ui-green text-ui-dark shadow-[0_0_15px_rgba(74,222,128,0.4)]'
                    : 'bg-white/5 text-white/40 hover:bg-white/10'
                "
                class="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tighter transition-all"
              >
                {{ t }}
              </button>
            </div>
          </div>

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
              class="text-white/20 py-20 font-light"
            >
              No green trails found. Try different keywords.
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
                    (error)="item.favicon = 'assets/default-favicon.png'"
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
export class ResultsComponent {
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

  constructor(private searchService: SearchService) {
    this.results$ = this.searchService.results$;
    this.loading$ = this.searchService.loading$;
    this.error$ = this.searchService.error$;
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
