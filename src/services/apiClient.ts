import axiosInstance from "./axiosConfig";

class ApiClient {
  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const res = await axiosInstance.get<T>(url, { params });
    return res.data;
  }

  async post<T>(url: string, data?: unknown): Promise<T> {
    const res = await axiosInstance.post<T>(url, data);
    return res.data;
  }

  async put<T>(url: string, data?: unknown): Promise<T> {
    const res = await axiosInstance.put<T>(url, data);
    return res.data;
  }

  async patch<T>(url: string, data?: unknown): Promise<T> {
    const res = await axiosInstance.patch<T>(url, data);
    return res.data;
  }

  async delete<T>(url: string, body?: unknown): Promise<T> {
    const res = await axiosInstance.delete<T>(
      url,
      body ? { data: body } : undefined
    );
    return res.data;
  }
}

const apiClient = new ApiClient();
export default apiClient;