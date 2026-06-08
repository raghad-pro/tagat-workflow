import axiosInstance from "./axiosConfig";

class apiClient {
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
  async delete<T>(url: string): Promise<T> {
    const res = await axiosInstance.delete<T>(url);
    return res.data;
  }
}
export default new apiClient();
