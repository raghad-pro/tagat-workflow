import Cookies from "js-cookie";
import { ENV } from "@/config/env";

const TOKEN_KEY = ENV.ACCESS_TOKEN_KEY || "access_token";
export const tokenService = {
    // حفظ التوكن
  setToken: (token: string, expiresDays = 1) => {
    Cookies.set(TOKEN_KEY, token, {
      expires: expiresDays,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
  },

  // قراءة التوكن
  getToken: () => {
    return Cookies.get(TOKEN_KEY);
  },

  // مسح التوكن
  removeToken: () => {
    Cookies.remove(TOKEN_KEY);
  },

  // تحقق إذا في توكن
  hasToken: () => {
    return !!Cookies.get(TOKEN_KEY);
  },
};