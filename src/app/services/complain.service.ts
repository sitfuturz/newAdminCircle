import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { ApiManager } from '../core/utilities/api-manager';
import { AppStorage } from '../core/utilities/app-storage';
import { common } from '../core/constants/common';
import { apiEndpoints } from '../core/constants/api-endpoints';
import { swalHelper } from '../core/constants/swal-helper';
import { ComplaintResponse } from '../interface/complain.interface';

@Injectable({
  providedIn: 'root'
})
export class ComplaintService {
  private headers: any[] = [];

  constructor(private apiManager: ApiManager, private storage: AppStorage) {}

  private getHeaders = () => {
    this.headers = [];
    const token = this.storage.get(common.TOKEN);
    if (token) {
      this.headers.push({ Authorization: `Bearer ${token}` });
    }
  };

  async getAllComplaints(params: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    search?: string;
  }): Promise<ComplaintResponse> {
    try {
      this.getHeaders();
      
      let queryParams = new HttpParams();
      if (params.page) queryParams = queryParams.set('page', params.page.toString());
      if (params.limit) queryParams = queryParams.set('limit', params.limit.toString());
      if (params.status) queryParams = queryParams.set('status', params.status);
      if (params.category) queryParams = queryParams.set('category', params.category);
      if (params.search) queryParams = queryParams.set('search', encodeURIComponent(params.search));

      const response = await this.apiManager.request(
        {
          url: `${apiEndpoints.GET_ALL_COMPLAINTS}?${queryParams.toString()}`,
          method: 'GET',
        },
        null,
        this.headers
      );
      
      return response.data || response;
    } catch (error) {
      console.error('Get All Complaints Error:', error);
      swalHelper.showToast('Failed to fetch complaints', 'error');
      throw error;
    }
  }

  async updateComplaintStatus(id: string, status: string, adminResponse: string): Promise<any> {
    try {
      this.getHeaders();
      const body = { status, adminResponse };
      
      const response = await this.apiManager.request(
        {
          url: `${apiEndpoints.UPDATE_COMPLAINTS}/${id}`,
          method: 'PUT',
        },
        body,
        this.headers
      );
      return response;
    } catch (error) {
      console.error('Update Complaint Status Error:', error);
      swalHelper.showToast('Failed to update complaint status', 'error');
      throw error;
    }
  }
}