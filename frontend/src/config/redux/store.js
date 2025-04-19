import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./reducer/authReducer";
import postReducer from "./reducer/postReducer";

// Steps for State Management in Redux -
// 1.) Submit Action.
// 2.) Handle action in it's reducer.
// 3.) Register Reducer in the store. 


export const store = configureStore({
    reducer: {
        auth: authReducer,
        postReducer: postReducer
    }
});
