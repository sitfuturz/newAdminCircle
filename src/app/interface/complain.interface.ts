export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  chapter_name?: string;
}

export interface Complaint {
  _id: string;
  userId: User;
  title: string;
  details: string;
  image?: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  category: 'general' | 'technical' | 'account' | 'other';
  adminResponse?: string;
  resolvedAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ComplaintData {
  docs: Complaint[];
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

export interface ComplaintAnalytics {
  total_complaints: number;
  pending_complaints: number;
  in_progress_complaints: number;
  resolved_complaints: number;
  rejected_complaints: number;
  general_category: number;
  technical_category: number;
  account_category: number;
  other_category: number;
}

export interface ComplaintResponse {
  success: boolean;
  message: string;
  complaints: ComplaintData;
  analytics: ComplaintAnalytics;
}