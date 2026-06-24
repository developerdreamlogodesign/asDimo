import { BASE_URL } from "../api/config";
import axios from "axios";

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      flag: number;
      [key: string]: any;
    };
    token: string;
    accessToken: string;
    refreshToken: string;
  };
}

interface RefreshTokenResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      flag: number;
      [key: string]: any;
    };
    token: string;
    accessToken: string;
    refreshToken: string;
  };
}

interface LogoutResponse {
  success: boolean;
  message: string;
}

interface ProfileResponse {
  success: boolean;
  message: string;
  data: any;
}

interface UserListResponse {
  success: boolean;
  count: number;
  data: Array<{
    _id: string;
    userId: number;
    name: string;
    email: string;
    flag: number;
    status: number;
    city: string | null;
    state: string | null;
    pincode: string | null;
    address: string | null;
    phone: string | null;
    country: string | null;
    resetPasswordOTP: string | null;
    resetPasswordOTPExpiry: string | null;
    profileImg: string | null;
    createdAt: string;
    updatedAt: string;
    __v: number;
    roleData?: {
      _id: string;
      zonalAdminId?: number;
      userId: number;
      user: string;
      superAdminId?: number;
      city: string | null;
      state: string | null;
      pincode: string | null;
      address: string | null;
      createdAt: string;
      updatedAt: string;
      __v: number;
    } | null;
    relatedData?: {
      admins?: {
        count: number;
        data: any[];
      };
      organizations?: {
        count: number;
        data: any[];
      };
      teachers?: {
        count: number;
        data: any[];
      };
      parents?: {
        count: number;
        data: any[];
      };
    };
  }>;
}

interface GetUsersByFlagOptions {
  search?: string;
  sort?: string;
  sortBy?: string;
  sortOrder?: string;
}

export const authService = {
  /**
   * Login with email and password
   */
  async login(
    email: string,
    password: string
  ): Promise<LoginResponse> {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Login failed");
    }

    return data;
  },

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const response = await fetch(`${BASE_URL}/auth/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Token refresh failed");
    }

    return data;
  },

  /**
   * Logout user
   */
  async logout(accessToken: string, refreshToken: string): Promise<LogoutResponse> {
    const response = await fetch(`${BASE_URL}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Logout failed");
    }

    return data;
  },

  /**
   * Get logged-in user profile
   */
  async getProfile(accessToken: string): Promise<ProfileResponse> {
    const response = await fetch(`${BASE_URL}/auth/profile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Profile fetch failed");
    }

    return data;
  },


  getNotifications: async (token: string) => {
    const response = await axios.get(`${BASE_URL}/notifications`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  },

  async markNotificationRead(id: string, token: string) {
    const response = await axios.put(
      `${BASE_URL}/notifications/read/${id}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  },

  async updateProfile(token: string,userId: string,payload: FormData) {
    const response = await axios.put(
      `${BASE_URL}/auth/updateProfile/${userId}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  },

  async getUsersByFlag(
    token: string,
    flag: number,
    options: GetUsersByFlagOptions = {}
  ): Promise<UserListResponse> {
    const payload = {
      flag,
      ...(options.search ? { search: options.search } : {}),
      ...(options.sort ? { sort: options.sort } : {}),
      ...(options.sortBy ? { sortBy: options.sortBy } : {}),
      ...(options.sortOrder ? { sortOrder: options.sortOrder } : {}),
    };
    
    const response = await axios.post(
      `${BASE_URL}/auth/getAllUsers`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  },

  deleteUsers: async (token: string, userIds: string[]) => {
    const response = await axios.post(
      `${BASE_URL}/auth/delete`,
      {
        userIds,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  },

  async getUserById(token: string, userId: number | string) {
    const response = await axios.post(
      `${BASE_URL}/auth/getAllUsersById`,
      { userId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  },

  // async register(
  //   token: string,
  //   payload: any
  // ) {
  //   const response = await axios.post(
  //     `${BASE_URL}/auth/register`,
  //     payload,
  //     {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     }
  //   );

  //   return response.data;
  // }

    register: async (token: string, payload: FormData) => {
      const response = await axios.post(
        `${BASE_URL}/auth/register`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.data;
    },

};
