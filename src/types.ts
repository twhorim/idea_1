export interface AchievementAnalysis {
  knowledge: string[];
  process: string[];
  attitude: string[];
  core_idea: string;
  evaluation_plans: string[];
  rationale: string;
}

export interface LessonDesign {
  id: string;
  title: string;          // A short custom name for the plan
  creationDate: string;   // ISO timestamp
  subject: string;        // e.g. "사회", "과학", "국어"
  grade: string;          // e.g. "초등 3~4학년군"
  rawStandard: string;    // The initial input
  analysis: AchievementAnalysis;
}

export interface CurriculumTemplate {
  id: string;
  subject: string;
  grade: string;
  rawStandard: string;
  sourceCode: string;     // e.g. "9사01-01", "4사03-01"
  description: string;    // Brief explanation
  preAnalysed?: AchievementAnalysis; // Can be pre-populated for instant display!
}
