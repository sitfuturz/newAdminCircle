import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CustomhelperService {

  constructor() { }

  getChapterAndIsAdmin(): { chapter: string; isAdmin: boolean; role: string } {
    // Default values
    let chapter = '';
    let isAdmin = false;
    let role = '';

    // LocalStorage se 'user' key ke under stored data nikaalo
    const storedData = localStorage.getItem('user');

    if (storedData) {
      try {
        const dataObj = JSON.parse(storedData);

        // Role set karo
        role = dataObj.role || '';

        // Check if user is admin by role (admin roles: only superadmin, advisoryBoard, supportDirector, SupportAmbassador)
        const adminRoles = ['superadmin','admin'];
        isAdmin = adminRoles.includes(role);

        // Chapter set karo based on role
        chapter = isAdmin ? (dataObj.chapter || '') : (dataObj.chapter_name || '');
      } catch (e) {
        console.error('Data parse error:', e);
      }
    }

    // Return chapter, isAdmin aur role
    return { chapter, isAdmin, role };
  }
}