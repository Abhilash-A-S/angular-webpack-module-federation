export interface Task {
  id: string;
  title: string;
  dueDate: string; // YYYY-MM-DD
  dueTime: string; // HH:mm
  completed: boolean;
  critical: boolean;
  isDue?: boolean;
}
