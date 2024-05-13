import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AboutComponent } from './about/about.component';
import { ClipComponent } from './clip/clip.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { ClipService } from './services/clip.service';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'about', // example.com/about
    component: AboutComponent,
  },
  {
    path: 'clip/:id', // example.com/clips
    component: ClipComponent,
    resolve:{
      clip: ClipService
    }
  },
  {
    path: 'dashboard', // dashboard/manage, dashboard/upload
    loadChildren: async () => (await import('./video/video.module')).VideoModule
  },
  {
    path: '**', // example.com/notfound
    component: NotFoundComponent
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
