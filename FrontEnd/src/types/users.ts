export type AdminUser = {
  id: string;
  email: string;
  userName: string | null;
  createdAt: string;
  roles: string[];
  assignedCinemaIds: string[];
};
