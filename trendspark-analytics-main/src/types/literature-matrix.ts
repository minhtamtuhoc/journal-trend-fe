export interface LiteratureMatrixRequest {
  collectionId?: number;
  paperIds?: number[];
  customColumns?: string[];
}

export interface MatrixRow {
  paperId: number;
  title: string;
  authors: string;
  year: number;
  objective: string;
  methodology: string;
  dataset: string;
  keyResults: string;
  limitations: string;
}

export interface LiteratureMatrixResponse {
  totalPapers: number;
  quotaRemainingToday: number; // -1 means unlimited (ADMIN/SUPER_ADMIN)
  matrixRows: MatrixRow[];
  executiveSynthesis?: string;
  markdownTable: string;
  generatedAt: string;
}
