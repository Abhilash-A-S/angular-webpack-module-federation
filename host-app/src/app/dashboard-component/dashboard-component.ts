import { Component } from '@angular/core';
import { RemoteLoaderComponent } from '../remote-loader-component/remote-loader-component';

@Component({
  selector: 'app-dashboard-component',
  imports: [RemoteLoaderComponent],
  templateUrl: './dashboard-component.html',
  styleUrl: './dashboard-component.scss',
})
export class DashboardComponent {

}
