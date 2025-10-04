import { configureStore } from "@reduxjs/toolkit";

import { loginSlice } from "../features/auth/login";
import authReducer from "./../features/auth/auth-slice";
import { usersSlice } from "../features/users/userSlice";
import { projectSlice } from "../features/projects/projectsSlice";

export const store = configureStore({
    reducer:{
    [loginSlice.reducerPath]:loginSlice.reducer,
    [usersSlice.reducerPath]:usersSlice.reducer,
    [projectSlice.reducerPath]:projectSlice.reducer,


    auth:authReducer
    },
    
    middleware:(getDefaultMiddleware)=>{
        return getDefaultMiddleware({serializableCheck:false}).concat(
            loginSlice.middleware,
            usersSlice.middleware,
            projectSlice.middleware
        );

    }
});
export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;