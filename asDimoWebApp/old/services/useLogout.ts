import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "./authService";
import { tokenManager } from "./tokenManager";

/**
 * Hook for handling logout
 */
export const useLogout = () => {
  const navigate = useNavigate();

  const logout = useCallback(async () => {
    try {
      const accessToken = tokenManager.getAccessToken();
      const refreshToken = tokenManager.getRefreshToken();

      // Call logout API if we have tokens
      if (accessToken && refreshToken) {
        try {
          await authService.logout(accessToken, refreshToken);
        } catch (error) {
          // Log the error but continue with clearing local storage
          console.error("Logout API error:", error);
        }
      }

      // Clear all auth data
      tokenManager.clearAll();

      // Redirect to login
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      // Force clear and redirect even if error occurs
      tokenManager.clearAll();
      navigate("/");
    }
  }, [navigate]);

  return logout;
};
