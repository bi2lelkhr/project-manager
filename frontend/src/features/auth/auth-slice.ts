import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export class AuthState {
  constructor(
    isAuthenticated: boolean,
    token: string,
    refreshToken: string,
    username?: string,
    id?: string,
    role?: string
  ) {
    this.isAuthenticated = isAuthenticated;
    this.token = token;
    this.refreshToken = refreshToken;
    this.username = username;
    this.id = id;
    this.role = role;
  }

  isAuthenticated: boolean;
  token: string;
  refreshToken: string;
  username?: string;
  id?: string;
  role?: string;
}

const initialState: AuthState = {
  isAuthenticated: localStorage.getItem("token") != null,
  token: localStorage.getItem("token") ?? "",
  refreshToken: localStorage.getItem("refreshToken") ?? "",
  username: localStorage.getItem("username") ?? undefined,
  id: localStorage.getItem("id") ?? undefined,
  role: localStorage.getItem("role") ?? undefined,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<AuthState>) {
      const { token, refreshToken, username, id, role } = action.payload;

      localStorage.setItem("token", token);
      localStorage.setItem("refreshToken", refreshToken);
      if (username) localStorage.setItem("username", username);
      if (id) localStorage.setItem("id", id);
      if (role) localStorage.setItem("role", role);

      return action.payload;
    },
    signOut() {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("username");
      localStorage.removeItem("id");
      localStorage.removeItem("role");

      return new AuthState(false, "", "");
    },
  },
});

export const { setCredentials, signOut } = authSlice.actions;
export default authSlice.reducer;