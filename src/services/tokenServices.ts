import Cookies from "js-cookie";
import { ENV } from "@/config/env";

const TOKEN_KEY = ENV.ACCESS_TOKEN_KEY || "access_token";

/** How long a "remember me" session outlives the browser window. */
const REMEMBER_DAYS = 30;

export const tokenService = {
  /**
   * With `remember` the cookie persists for `REMEMBER_DAYS`; without it the
   * cookie is a session cookie, gone when the browser closes — which is what
   * an unticked "Remember me" means.
   */
  setToken: (token: string, { remember = false }: { remember?: boolean } = {}) => {
    Cookies.set(TOKEN_KEY, token, {
      expires: remember ? REMEMBER_DAYS : undefined,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  },

  getToken: () => {
    return Cookies.get(TOKEN_KEY);
  },

  removeToken: () => {
    Cookies.remove(TOKEN_KEY);
  },

  hasToken: () => {
    return !!Cookies.get(TOKEN_KEY);
  },
};
