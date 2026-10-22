import axios, {
  type InternalAxiosRequestConfig,
} from "axios";

type AuthStorageType = "local" | "session";

declare module "axios" {
  interface InternalAxiosRequestConfig<D = any> {
    _retry?: boolean;
    _authStorage?: AuthStorageType;
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

const AUTH_KEYS = [
  "accessToken",
  "refreshToken",
  "admin",
] as const;

const getStorage = (type: AuthStorageType): Storage =>
  type === "session" ? sessionStorage : localStorage;

const getAuthTokens = () => {
  // Prefer a complete session-based token pair.
  const sessionAccess = sessionStorage.getItem("accessToken");
  const sessionRefresh = sessionStorage.getItem("refreshToken");

  if (sessionAccess && sessionRefresh) {
    return {
      type: "session" as const,
      accessToken: sessionAccess,
      refreshToken: sessionRefresh,
    };
  }

  // Otherwise, use the persistent token pair.
  const localAccess = localStorage.getItem("accessToken");
  const localRefresh = localStorage.getItem("refreshToken");

  if (localAccess && localRefresh) {
    return {
      type: "local" as const,
      accessToken: localAccess,
      refreshToken: localRefresh,
    };
  }

  // Handle incomplete legacy authentication data.
  if (sessionAccess || sessionRefresh) {
    return {
      type: "session" as const,
      accessToken: sessionAccess,
      refreshToken: sessionRefresh,
    };
  }

  if (localAccess || localRefresh) {
    return {
      type: "local" as const,
      accessToken: localAccess,
      refreshToken: localRefresh,
    };
  }

  return null;
};

const clearAuthData = () => {
  for (const key of AUTH_KEYS) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
};

const redirectToLogin = () => {
  clearAuthData();

  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
};

// Support both possible API base URL configurations:
// http://localhost:5000/api/v1
// http://localhost:5000
const refreshEndpoint = /\/api\/v1\/?$/.test(
  new URL(API_BASE_URL, window.location.origin).pathname,
)
  ? "/auth/refresh-token"
  : "/api/v1/auth/refresh-token";

// Attach the correct access token to every request.
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const auth = getAuthTokens();

    config._authStorage = auth?.type;

    if (auth?.accessToken) {
      config.headers.Authorization =
        `Bearer ${auth.accessToken}`;
    } else {
      delete config.headers.Authorization;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

type RefreshedTokens = {
  accessToken: string;
  refreshToken: string;
};

// Share one refresh request between concurrent failed requests.
let refreshPromise: Promise<RefreshedTokens> | null = null;

const refreshAccessToken = (
  storageType: AuthStorageType,
): Promise<RefreshedTokens> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  const storage = getStorage(storageType);
  const currentRefreshToken =
    storage.getItem("refreshToken");

  if (!currentRefreshToken) {
    return Promise.reject(
      new Error("Refresh token is missing."),
    );
  }

  refreshPromise = axios
    .post(
      refreshEndpoint,
      {
        refreshToken: currentRefreshToken,
      },
      {
        baseURL: API_BASE_URL,
        timeout: 15000,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
    .then((response) => {
      // Supports the standard { data: { ...tokens } }
      // response as well as a direct token response.
      const result =
        response.data?.data ?? response.data;

      const { accessToken, refreshToken } = result ?? {};

      if (!accessToken || !refreshToken) {
        throw new Error(
          "Invalid refresh-token response from server.",
        );
      }

      // The backend rotates refresh tokens, so save BOTH.
      storage.setItem("accessToken", accessToken);
      storage.setItem("refreshToken", refreshToken);

      return {
        accessToken,
        refreshToken,
      };
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

// Refresh expired access tokens and retry failed requests.
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest =
      error.config as InternalAxiosRequestConfig | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const requestUrl = originalRequest.url ?? "";

    const isAuthEndpoint =
      /\/(?:admin\/login|auth\/refresh-token|auth\/logout)(?:\?|$)/.test(
        requestUrl,
      );

    if (
      status !== 401 ||
      originalRequest._retry ||
      isAuthEndpoint
    ) {
      return Promise.reject(error);
    }

    const auth = getAuthTokens();

    if (!auth?.refreshToken) {
      redirectToLogin();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const storageType =
        originalRequest._authStorage ?? auth.type;

      const tokens =
        await refreshAccessToken(storageType);

      originalRequest.headers.Authorization =
        `Bearer ${tokens.accessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      const refreshStatus = axios.isAxiosError(refreshError)
        ? refreshError.response?.status
        : undefined;

      // Only force logout when the server rejects the
      // refresh token. Preserve the session on network
      // failures or temporary server errors.
      if (
        refreshStatus === 401 ||
        refreshStatus === 403
      ) {
        redirectToLogin();
      }

      return Promise.reject(refreshError);
    }
  },
);