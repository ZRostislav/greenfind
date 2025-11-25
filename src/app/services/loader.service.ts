import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoaderService {
  private _loading = signal(true); // загрузка включена при старте

  isLoading = this._loading.asReadonly(); // только чтение

  show() {
    this._loading.set(true);
  }

  hide() {
    this._loading.set(false);
  }
}
