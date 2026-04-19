import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { PlaygroundComponent } from './components/playground/playground.component';
import { HistoryComponent } from './components/history/history.component';
import { AboutComponent } from './components/about/about.component';
import { ContactComponent } from './components/contact/contact.component';
import { DocsComponent } from './components/docs/docs.component';
import { SentinelComponent } from './components/sentinel/sentinel.component';
import { SettingsComponent } from './components/settings/settings.component';
import { VisionSostenidaComponent } from './components/vision-sostenida/vision-sostenida.component';
import { VsReservaComponent } from './components/sva/vision-sostenida.component';
import { UserGuideComponent } from './components/userguide/user-guide.component';
import { NotFoundComponent } from './components/page-not-found/not-found.component';



export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'playground', component: PlaygroundComponent },
  { path: 'vision', component: VisionSostenidaComponent },
  { path: 'reserva', component: VsReservaComponent },
  { path: 'history', component: HistoryComponent },
  { path: 'user-guide', component: UserGuideComponent },
  { path: 'docs', component: DocsComponent },
  { path: 'about', component: AboutComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'sentinel', component: SentinelComponent },
  { path: 'settings', component: SettingsComponent },
  { path: '404', component: NotFoundComponent },
  { path: '**', redirectTo: '404' }
];