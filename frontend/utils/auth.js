// utils/auth.js
export const isAuthenticated = () => {
    // Example: Check if token exists in local storage
    return localStorage.getItem("token") !== null;
  };