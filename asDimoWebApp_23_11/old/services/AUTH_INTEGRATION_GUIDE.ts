/**
 * AUTHENTICATION INTEGRATION GUIDE
 * 
 * This file demonstrates how to use the authentication services throughout your app.
 */

// ============================================
// 1. LOGIN USAGE (Already implemented in Login.tsx)
// ============================================
/*
import { authService } from "../../services/authService";
import { tokenManager } from "../../services/tokenManager";

async function handleLogin(email: string, password: string) {
  try {
    const response = await authService.login(email, password);
    
    // Store tokens and user
    tokenManager.setTokens({
      token: response.data.token,
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
    });
    tokenManager.setUser(response.data.user);
    
    // Redirect to dashboard
    navigate(getRouteByFlag(response.data.user.flag));
  } catch (error) {
    console.error("Login failed:", error);
  }
}
*/

// ============================================
// 2. LOGOUT USAGE (Use in Navbar, Settings, etc.)
// ============================================
/*
import { useLogout } from "../../services/useLogout";

function Navbar() {
  const logout = useLogout();
  
  const handleLogout = async () => {
    await logout();
    // User will be redirected to /login automatically
  };
  
  return (
    <div className="navbar">
      <h3>Super Admin</h3>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
*/

// ============================================
// 3. TOKEN MANAGEMENT USAGE
// ============================================
/*
import { tokenManager } from "../../services/tokenManager";

// Get tokens
const accessToken = tokenManager.getAccessToken();
const refreshToken = tokenManager.getRefreshToken();
const allTokens = tokenManager.getTokens();

// Get user info
const user = tokenManager.getUser();

// Check if authenticated
const isAuth = tokenManager.isAuthenticated();

// Update tokens (after refresh)
tokenManager.updateTokens({
  accessToken: "new_access_token",
  refreshToken: "new_refresh_token",
});

// Clear auth data
tokenManager.clearAll();
*/

// ============================================
// 4. AUTOMATIC TOKEN REFRESH (For API calls)
// ============================================
/*
import { fetchWithTokenRefresh } from "../../services/tokenRefreshInterceptor";

// Use instead of regular fetch for authenticated requests
async function fetchUserData() {
  try {
    const response = await fetchWithTokenRefresh(
      `${BASE_URL}/api/user-data`,
      { method: "GET" }
    );
    
    if (!response.ok) {
      throw new Error("Failed to fetch user data");
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error:", error);
  }
}
*/

// ============================================
// 5. ACCESS CONTROL CHECK
// ============================================
/*
import { getCurrentUserRole } from "../../middleware/AuthMiddleware";

function Dashboard() {
  const userRole = getCurrentUserRole();
  
  if (userRole === "SuperAdmin") {
    return <SuperAdminDashboard />;
  } else if (userRole === "zonalAdmin") {
    return <ZonalAdminDashboard />;
  }
  
  return <UnauthorizedPage />;
}
*/

// ============================================
// KEY FEATURES
// ============================================
/*
✅ Login Flow:
   - User logs in with email/password
   - API returns: user, token, accessToken, refreshToken
   - Both tokens are securely stored in localStorage
   - User is redirected based on their role

✅ Token Refresh Flow:
   - When access token expires, refresh token is used automatically
   - New tokens are fetched and stored
   - Ongoing requests are queued and retried with new token
   - If refresh fails, user is redirected to login

✅ Logout Flow:
   - useLogout hook calls logout API with both tokens
   - All tokens and user data are cleared from localStorage
   - User is redirected to /login page
   - All subsequent requests will require re-authentication

✅ Protected Routes:
   - AuthMiddleware checks if user is authenticated
   - Only allows access to authorized roles
   - Automatically redirects unauthorized users

✅ Backward Compatibility:
   - Legacy "token" key in localStorage is maintained
   - Existing code using localStorage.getItem("token") still works
   - New code should use tokenManager.getAccessToken()
*/

export {};
