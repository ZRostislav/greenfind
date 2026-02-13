import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TestService {
  private readonly apiUrl = environment.apiUrl;

  constructor() {
    this.initializeApp();
  }

  initializeApp() {
    console.log('🚀 TestService Checking...');

    if (this.apiUrl) {
      console.log('✅ API URL:', this.apiUrl);
    } else {
      console.error('❌ API URL is missing in environment.ts!');
      console.log('Current environment:', environment);
    }
  }
}
