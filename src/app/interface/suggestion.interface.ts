export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  chapter_name?: string;
}

export interface Suggestion {
  _id: string;
  userId: User;
  title: string;
  details: string;
  image?: string;
  category: 'general' | 'feature' | 'improvement' | 'other';
  status: 'pending' | 'reviewed' | 'implemented' | 'rejected';
  adminResponse?: string;
  resolvedAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SuggestionData {
  docs: Suggestion[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
}

export interface SuggestionAnalytics {
  total_suggestions: number;
  pending_suggestions: number;
  reviewed_suggestions: number;
  implemented_suggestions: number;
  rejected_suggestions: number;
  general_category: number;
  feature_category: number;
  improvement_category: number;
  other_category: number;
}

export interface SuggestionResponse {
  success: boolean;
  message: string;
  suggestions: SuggestionData;
  analytics: SuggestionAnalytics;
}