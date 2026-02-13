import { Routes } from '@angular/router';
import { MainComponent } from './components/main/main.component';
import { ResultsComponent } from './components/results/results.component';

export const routes: Routes = [
  { path: '', component: MainComponent },
  { path: 'results', component: ResultsComponent },
];
