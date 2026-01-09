export interface ReportUser {
  _id: string;
  name: string;
  email: string;
  profilePic?: string;
  mobile_number?: string;
  chapter_name?: string;
}

export interface ReportedFeed {
  _id: string;
  title: string;
  description: string;
  images: string[];
  createdAt: string;
}

export interface Report {
  _id: string;
  reportedItemType: 'profile' | 'feed';
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'rejected';
  adminComment?: string;
  createdAt: string;
  updatedAt: string;
  reporter: ReportUser;
  reportedUser: ReportUser;
  reportedItem?: ReportedFeed;
}

export interface ReportData {
  docs: Report[];
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

export interface ReportAnalytics {
  total_reports: number;
  pending_reports: number;
  reviewed_reports: number;
  resolved_reports: number;
  rejected_reports: number;
  profile_reports: number;
  feed_reports: number;
}

export interface ReportResponse {
  success: boolean;
  message: string;
  data: {
    reports: Report[];
    totalReports: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}