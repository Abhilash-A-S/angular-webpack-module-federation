import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HistoryEntry } from '../../../models/history.model';
import { IndexedDBService } from '../../../services/idb.service';

@Component({
  selector: 'app-history-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss',
})
export class HistoryWidgetComponent implements OnInit, OnDestroy {
  historyEntries: HistoryEntry[] = [];

  constructor(private idbService: IndexedDBService) {}

  private handleStateMutation = async (event: Event) => {
    const customEvent = event as CustomEvent;
    if (customEvent.detail) {
      const { action, taskTitle, timestamp, details } = customEvent.detail;
      const now = new Date();
      const timeStr = timestamp || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      let formattedDetails = details;
      if (!formattedDetails) {
        switch (action) {
          case 'CREATED':
            formattedDetails = 'Assigned by Alistair Smith';
            break;
          case 'RESCHEDULED':
            formattedDetails = 'Rescheduled +5m';
            break;
          case 'COMPLETED':
            formattedDetails = 'Marked Complete by Alistair Smith';
            break;
          case 'UNCOMPLETED':
            formattedDetails = 'Reopened';
            break;
          case 'ASSIGNED':
            formattedDetails = 'Assigned by Alistair Smith';
            break;
          default:
            formattedDetails = action;
        }
      }

      const newEntry: HistoryEntry = {
        id: Date.now().toString(),
        timestamp: timeStr,
        taskTitle: taskTitle || 'Task',
        action: action,
        details: formattedDetails,
      };

      this.historyEntries.unshift(newEntry);
      await this.idbService.put<HistoryEntry>('history', newEntry);
    }
  };

  async ngOnInit() {
    await this.loadHistory();
    window.addEventListener('taskflow:state-mutation', this.handleStateMutation);
  }

  ngOnDestroy() {
    window.removeEventListener('taskflow:state-mutation', this.handleStateMutation);
  }

  private async loadHistory() {
    try {
      const entries = await this.idbService.getAll<HistoryEntry>('history');
      // Sort entries descending by id/timestamp
      this.historyEntries = entries.sort((a, b) => Number(b.id) - Number(a.id));
    } catch (e) {
      console.error('Failed to load history from IndexedDB', e);
      this.historyEntries = [];
    }
  }
}
