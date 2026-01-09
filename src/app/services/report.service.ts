import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { ApiManager } from '../core/utilities/api-manager';
import { AppStorage } from '../core/utilities/app-storage';
import { common } from '../core/constants/common';
import { apiEndpoints } from '../core/constants/api-endpoints';
import { swalHelper } from '../core/constants/swal-helper';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private headers: any[] = [];

  constructor(private apiManager: ApiManager, private storage: AppStorage) {}

  private getHeaders = () => {
    this.headers = [];
    const token = this.storage.get(common.TOKEN);
    if (token) {
      this.headers.push({ Authorization: `Bearer ${token}` });
    }
  };

  async getAllReports(params: {
    page?: number;
    limit?: number;
    status?: string;
    reportedItemType?: string;
  }): Promise<any> {
    try {
      this.getHeaders();
      
      const body = {
        page: params.page || 1,
        limit: params.limit || 20,
        status: params.status || 'all',
        reportedItemType: params.reportedItemType || 'all'
      };

      const response = await this.apiManager.request(
        {
          url: apiEndpoints.GET_ALL_REPORTS,
          method: 'POST',
        },
        body,
        this.headers
      );
      
      return response;
    } catch (error) {
      console.error('Get All Reports Error:', error);
      swalHelper.showToast('Failed to fetch reports', 'error');
      throw error;
    }
  }

  async updateReportStatus(reportId: string, status: string, adminComment?: string): Promise<any> {
    try {
      this.getHeaders();
      const body = { reportId, status, adminComment: adminComment || '' };
      
      const response = await this.apiManager.request(
        {
          url: apiEndpoints.UPDATE_REPORT_STATUS,
          method: 'POST',
        },
        body,
        this.headers
      );
      return response;
    } catch (error) {
      console.error('Update Report Status Error:', error);
      swalHelper.showToast('Failed to update report status', 'error');
      throw error;
    }
  }
}