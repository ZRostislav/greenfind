import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoaderService } from './services/loader.service';
import { LoaderComponent } from './components/loader/loader.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoaderComponent],
  standalone: true,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  isLoading: any;

  constructor(private loader: LoaderService) {
    this.isLoading = this.loader.isLoading; // ← теперь loader уже существует
  }

  ngOnInit() {
    // Через 1.2 секунды убираем загрузку
    setTimeout(() => this.loader.hide(), 1200);
  }
}
