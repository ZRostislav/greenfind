import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import emojiFlags from 'emoji-flags';

interface Country {
  code: string;
  name: string;
  svg: string;
}

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class MainComponent implements OnInit {
  query = '';
  filters = {
    site: '',
    region: '',
    exclude: '',
    exact: '',
    similar: '',
  };
  selectedCountry: Country | null = null;
  showFilters = false;
  activeFilter: string | null = null;
  siteError = false;
  siteErrorText = '';
  activeSite: {
    domain: string;
    favicon: string;
  } | null = null;

  toggleFilter(name: string) {
    // если уже открыт — закрываем
    if (this.activeFilter === name) {
      this.activeFilter = null;
      return;
    }

    // включаем новый фильтр
    this.activeFilter = name;

    // region → фокус на input
    if (name === 'region') {
      setTimeout(() => {
        const input = document.querySelector('.region-search') as HTMLInputElement;
        if (input) input.focus();
      });
    }

    // site → фокус на сайт input
    if (name === 'site') {
      setTimeout(() => {
        const input = document.querySelector('.site-input') as HTMLInputElement;
        if (input) input.focus();
      });
    }
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
    this.activeFilter = null;
  }

  fileTypes = ['PDF', 'DOCX', 'TXT', 'XLSX', 'PPTX'];
  selectedFiles: string[] = [];
  fileListOpen = false;

  toggleFileList() {
    this.fileListOpen = !this.fileListOpen;
  }

  toggleFileType(event: any) {
    const value = event.target.value;
    if (event.target.checked) {
      if (!this.selectedFiles.includes(value)) this.selectedFiles.push(value);
    } else {
      this.selectedFiles = this.selectedFiles.filter((f) => f !== value);
    }
  }

  regionQuery = '';
  showRegionList = false;
  regions: Country[] = []; // страны с SVG

  ngOnInit() {
    this.loadCountriesWithSVG();
    this.detectCountry();
  }

  loadCountriesWithSVG() {
    // emojiFlags.data содержит все страны, берем код ISO и название
    this.regions = emojiFlags.data.map((c) => ({
      code: c.code, // US, RU, FR...
      name: c.name, // United States, Russia...
      svg: `3x2/${c.code}.svg`, // путь к SVG флагу в assets
    }));
  }

  async detectCountry() {
    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      const code = data.country_code;

      const country = this.regions.find((r) => r.code === code);
      if (country) {
        this.filters.region = country.name;

        this.regionQuery = ''; // input остается пустым
        this.selectedCountry = country; // показываем SVG вместо input
      }
    } catch (e) {
      console.warn('Не удалось определить страну');
    }
  }

  filteredRegions() {
    const q = this.regionQuery.toLowerCase();
    return this.regions.filter((r) => r.name.toLowerCase().includes(q));
  }

  selectRegion(country: Country) {
    this.selectedCountry = country;
    this.showRegionList = false;
    this.activeFilter = '';
  }

  editRegion() {
    this.selectedCountry = null;
    this.regionQuery = '';
    this.showRegionList = true;
  }

  validateSite() {
    if (!this.filters.site) {
      this.siteError = false;
      this.siteErrorText = '';
      return true;
    }

    const siteRegex = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

    const isValid = siteRegex.test(this.filters.site.trim());

    this.siteError = !isValid;
    this.siteErrorText = isValid ? '' : 'Enter a valid domain (example.com)';

    return isValid;
  }

  applySiteFilter() {
    if (!this.validateSite()) {
      return;
    }

    // нормализация домена
    const domain = this.filters.site
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .trim();

    this.filters.site = domain;

    this.activeSite = {
      domain,
      favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
    };

    this.activeFilter = null;
  }

  search() {
    console.log('Поиск:', this.query, this.filters, this.selectedFiles);
  }

  removeSiteFilter() {
    this.activeSite = null;
    this.filters.site = '';
  }
}
