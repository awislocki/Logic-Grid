
export interface Category {
  id: string;
  name: string;
  items: string[];
}

export interface VisualTheme {
  colors: {
    background: string; // CSS color or gradient for the main page
    surface: string;    // Color for cards/board
    border: string;     // Color for lines/borders
    text: string;       // Main text color
    accent: string;     // Color for buttons/highlights
    primary: string;    // Stronger branding color
  };
  font: 'serif' | 'sans' | 'mono';
  emoji: string;        // A single emoji to use for background patterns
}

export interface PuzzleData {
  title: string;
  story: string;
  categories: Category[]; 
  clues: string[];
  solution: Record<string, string[]>;
  theme: VisualTheme;
}

export enum CellState {
  EMPTY = 0,
  FALSE = 1,      
  TRUE = 2,       
  FALSE_AUTO = 3, 
  
  TRUE_CORRECT = 4,   
  TRUE_INCORRECT = 5, 
  MISSED = 6          
}

export type GridState = Record<string, CellState>;

export interface PuzzleConfig {
  theme?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}