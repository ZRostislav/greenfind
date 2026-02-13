import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoaderService } from './services/loader.service';
import { LoaderComponent } from './components/loader/loader.component';
import { TestService } from './services/test.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoaderComponent],
  standalone: true,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  isLoading: any;

  constructor(
    private loader: LoaderService,
    private testService: TestService, // 👈 внедряем сервис
  ) {
    this.isLoading = this.loader.isLoading;
  }

  ngOnInit() {
    setTimeout(() => this.loader.hide(), 1200);
  }

  test() {
    console.log('Тестовая функция вызвана');
    this.testService.initializeApp(); // 👈 вызываем метод для проверки API URL
  }
}
