export interface HistoryEntry {
  id: string;
  timestamp: string;
  taskTitle: string;
  action: 'CREATED' | 'RESCHEDULED' | 'COMPLETED' | 'UNCOMPLETED' | 'ASSIGNED';
  details?: string;
}
