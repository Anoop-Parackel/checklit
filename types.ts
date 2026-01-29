export interface ChecklistItem {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface Checklist {
  id: string;
  title: string;
  items: ChecklistItem[];
  color: string; // Hex code or tailwind class representative
  createdAt: number;
  updatedAt: number;
}

export interface GenerateChecklistResponse {
  title: string;
  items: string[];
}
