import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../services/baseQuery";
import { User } from "../../models/UserSliceModels";

export interface Credential {
  token: string;
  role: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    username: string;
    job_title: string;
    is_developper: boolean;
    is_admin: boolean;
  };
}
interface LogoutResponse {
  success: boolean;
}

export const usersSlice = createApi({
  reducerPath: "users",
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    // GET /auth/users → returns array of users
    users: builder.query<User[], void>({
      query: () => ({
        url: "auth/users",
        method: "GET",
      }),
    }),

    // GET /auth/me → returns a single user
    account: builder.query<User, void>({
      query: () => ({
        url: "auth/me",
        method: "GET",
      }),
    }),
  }),
});

export const { useUsersQuery, useAccountQuery } = usersSlice;
