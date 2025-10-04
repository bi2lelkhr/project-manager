import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../constantes";

export interface Credential {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    username: string;
    job_title: string;
    is_developper: boolean;
    is_admin: boolean;
  } | null;
}

interface LogoutResponse {
  success: boolean;
}

export class loginParams {
  constructor(email: string, password: string) {
    this.email = email;
    this.password = password;
  }
  email: string;
  password: string;
}

export class User {
  constructor(
    email: string,
    password: string,
    username: string,
    departement: number
  ) {
    this.username = username;
    this.email = email;
    this.password = password;
    this.departement = departement;
  }
  username: string;
  departement: number;
  email: string;
  password: string;
}

export const loginSlice = createApi({
  reducerPath: "login",
  baseQuery: fetchBaseQuery({
    baseUrl: baseUrl,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
        headers.set("Accept", "application/json");
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    login: builder.mutation<Credential, loginParams>({
      query: (credentials) => ({
        url: "auth/login",
        method: "post",
        body: {
          email: credentials.email,       // hereee in the old code was username when you want to modify the authentification
          password: credentials.password,
        },
      }),
    }),
    register: builder.mutation<Credential, User>({
      query: (credentials) => ({
        url: "auth/register",
        method: "post",
        body: {
          username: credentials.username,
          email: credentials.email,
          password: credentials.password,
          departement: credentials.departement,
        },
      }),
    }),
    logout: builder.mutation<LogoutResponse, void>({
      query: () => ({
        url: "auth/logout",
        method: "POST",
      }),
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation, useLogoutMutation } =
  loginSlice;
