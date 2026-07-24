import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RemoteLoaderComponent } from '../remote-loader-component/remote-loader-component';

@Component({
  selector: 'app-dashboard-component',
  standalone: true,
  imports: [CommonModule, RemoteLoaderComponent],
  templateUrl: './dashboard-component.html',
  styleUrl: './dashboard-component.scss',
})
export class DashboardComponent {
  activeTab: 'dashboard' | 'tasks' | 'calendar' | 'reports' | 'history' = 'dashboard';

  setActiveTab(tab: 'dashboard' | 'tasks' | 'calendar' | 'reports' | 'history', event: Event) {
    event.preventDefault();
    this.activeTab = tab;
  }
}
