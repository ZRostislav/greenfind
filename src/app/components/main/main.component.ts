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

  toggleFilter(name: string) {
    // если нажали на тот же фильтр → выключаем
    if (this.activeFilter === name) {
      this.activeFilter = null;
      this.showRegionList = false;
      return;
    }

    // включаем новый фильтр
    this.activeFilter = name;

    // если region → сразу активировать input
    if (name === 'region') {
      setTimeout(() => {
        const input = document.querySelector('.region-search') as HTMLInputElement;
        if (input) {
          input.focus();
          this.showRegionList = true;
        }
      });
    }
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
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

    // автоматически скрываем input
    this.regionQuery = '';
  }

  editRegion() {
    this.selectedCountry = null;
    this.regionQuery = '';
    this.showRegionList = true;
  }

  search() {
    console.log('Поиск:', this.query, this.filters, this.selectedFiles);
  }
}
