import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alert-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert-banner.component.html',
  styleUrl: './alert-banner.component.scss',
})
export class AlertBannerComponent implements OnInit, OnDestroy {
  activeAlertTask: string | null = null;
  dueTime: string | null = null;

  private handleTaskAlert = (event: Event) => {
    const customEvent = event as CustomEvent;
    if (customEvent.detail && customEvent.detail.title) {
      this.activeAlertTask = customEvent.detail.title;
      this.dueTime = customEvent.detail.dueTime || null;
    }
  };

  private handleStateMutation = (event: Event) => {
    const customEvent = event as CustomEvent;
    if (customEvent.detail) {
      const { action, taskTitle } = customEvent.detail;
      if ((action === 'RESCHEDULED' || action === 'COMPLETED') && this.activeAlertTask === taskTitle) {
        this.activeAlertTask = null;
        this.dueTime = null;
      }
    }
  };

  ngOnInit() {
    window.addEventListener('taskflow:task-alert', this.handleTaskAlert);
    window.addEventListener('taskflow:state-mutation', this.handleStateMutation);
  }

  ngOnDestroy() {
    window.removeEventListener('taskflow:task-alert', this.handleTaskAlert);
    window.removeEventListener('taskflow:state-mutation', this.handleStateMutation);
  }
}
