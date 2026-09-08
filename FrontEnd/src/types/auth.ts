export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
};

export type RefreshTokenRequest = {
  refreshToken: string;
};

export type LogoutRequest = {
  refreshToken: string;
};

export type AuthResponse = {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
};

export type CurrentUser = {
  userId: string;
  email: string;
  roles: string[];
};

export type ProblemDetails = {
  status?: number;
  title?: string;
  detail?: string;
};
