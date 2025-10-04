import { baseUrl } from "../../constantes";
import { store } from "../../app/store";
import { AuthState, setCredentials, signOut } from "../../features/auth/auth-slice";
import { BaseQueryFn, FetchArgs, FetchBaseQueryError, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Credential } from "../../features/auth/login";
import axios from "axios";

export const baseQuery = fetchBaseQuery({
  baseUrl: baseUrl,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("token");
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
      headers.set("Accept", "application/json");
    }
    return headers;
  },
});

export const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  let result = await baseQuery(args, api, extraOptions);

  // Token expired
  if (result.error && result.error.status === 401) {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        store.dispatch(signOut());
        return result;
      }

      // Request new access token
      const response = await axios.post(`${baseUrl}auth/refresh`, { refreshToken });
      
      // DEBUG: Check what the backend actually returns
      console.log("Refresh response:", response.data);
      
      if (response.status === 200 && response.data) {
        // Handle different response structures
        const accessToken = response.data.accessToken || response.data.token;
        const newRefreshToken = response.data.refreshToken;
        const user = response.data.user || response.data; // Some APIs return user data directly

        if (!accessToken) {
          throw new Error("No access token in refresh response");
        }

        // If no user data in refresh response, fetch it from /auth/me
        let userData = user;
        if (!userData || typeof userData !== 'object') {
          try {
            const userResponse = await axios.get(`${baseUrl}auth/me`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            userData = userResponse.data;
          } catch (userError) {
            console.error("Failed to fetch user data:", userError);
          }
        }

        // Determine role - handle both backend structures
        const is_admin = userData?.is_admin || userData?.isAdmin || false;
        const is_developper = userData?.is_developper || userData?.isDeveloper || false;
        const role = is_admin ? "admin" : is_developper ? "developer" : "user";

        // Update Redux + localStorage
        store.dispatch(
          setCredentials(
            new AuthState(
              true,
              accessToken,
              newRefreshToken,
              userData?.username || userData?.name || "User",
              userData?.id || "",
              role
            )
          )
        );

        localStorage.setItem("token", accessToken);
        localStorage.setItem("refreshToken", newRefreshToken);
        localStorage.setItem("username", userData?.username || userData?.name || "User");
        localStorage.setItem("id", userData?.id || "");
        localStorage.setItem("role", role);

        // Retry original request
        result = await baseQuery(args, api, extraOptions);
      } else {
        store.dispatch(signOut());
      }
    } catch (error) {
      console.error("Unable to refresh token", error);
      store.dispatch(signOut());
    }
  }

  return result;
};