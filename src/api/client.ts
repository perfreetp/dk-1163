const API_BASE = '/api';

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  
  return response.json();
}

export const api = {
  versions: {
    list: () => fetchAPI<{ versions: any[]; total: number }>('/versions'),
    get: (id: string) => fetchAPI<any>(`/versions/${id}`),
    create: (data: any) => fetchAPI<any>('/versions', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchAPI<any>(`/versions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchAPI<{ success: boolean }>(`/versions/${id}`, { method: 'DELETE' }),
    compare: (baseId: string, targetId: string) => fetchAPI<any>(`/versions/compare?baseId=${baseId}&targetId=${targetId}`),
  },
  requirements: {
    list: (versionId: string) => fetchAPI<any[]>(`/versions/${versionId}/requirements`),
    create: (versionId: string, data: any) => fetchAPI<any>(`/versions/${versionId}/requirements`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchAPI<any>(`/requirements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchAPI<{ success: boolean }>(`/requirements/${id}`, { method: 'DELETE' }),
  },
  screenshots: {
    list: (versionId: string) => fetchAPI<any[]>(`/versions/${versionId}/screenshots`),
    create: (versionId: string, data: any) => fetchAPI<any>(`/versions/${versionId}/screenshots`, { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => fetchAPI<{ success: boolean }>(`/screenshots/${id}`, { method: 'DELETE' }),
  },
  trackingPoints: {
    list: (versionId: string) => fetchAPI<any[]>(`/versions/${versionId}/tracking-points`),
    create: (versionId: string, data: any) => fetchAPI<any>(`/versions/${versionId}/tracking-points`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchAPI<any>(`/tracking-points/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchAPI<{ success: boolean }>(`/tracking-points/${id}`, { method: 'DELETE' }),
  },
  acceptanceCriteria: {
    list: (versionId: string) => fetchAPI<any[]>(`/versions/${versionId}/acceptance-criteria`),
    create: (versionId: string, data: any) => fetchAPI<any>(`/versions/${versionId}/acceptance-criteria`, { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id: string, status: string) => fetchAPI<any>(`/acceptance-criteria/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
    delete: (id: string) => fetchAPI<{ success: boolean }>(`/acceptance-criteria/${id}`, { method: 'DELETE' }),
  },
  reviews: {
    create: (versionId: string) => fetchAPI<{ reviewId: string; status: string }>(`/versions/${versionId}/reviews`, { method: 'POST' }),
    get: (reviewId: string) => fetchAPI<any>(`/reviews/${reviewId}`),
    moduleScores: (reviewId: string) => fetchAPI<any[]>(`/reviews/${reviewId}/module-scores`),
    testFocuses: (reviewId: string) => fetchAPI<any[]>(`/reviews/${reviewId}/test-focuses`),
  },
  issues: {
    list: (reviewId: string, filters?: { status?: string; severity?: string; type?: string }) => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.severity) params.append('severity', filters.severity);
      if (filters?.type) params.append('type', filters.type);
      const query = params.toString() ? `?${params.toString()}` : '';
      return fetchAPI<any[]>(`/reviews/${reviewId}/issues${query}`);
    },
    updateStatus: (id: string, data: { status: string; assignee?: string }) => fetchAPI<any>(`/issues/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
    createTodo: (id: string, data: { title: string; assignee?: string; dueDate?: string }) => fetchAPI<any>(`/issues/${id}/todos`, { method: 'POST', body: JSON.stringify(data) }),
    recordAdoption: (id: string, data: { isAdopted: boolean; feedback?: string }) => fetchAPI<any>(`/issues/${id}/adoption`, { method: 'POST', body: JSON.stringify(data) }),
  },
  reports: {
    get: (versionId: string) => fetchAPI<any>(`/versions/${versionId}/report`),
  },
};