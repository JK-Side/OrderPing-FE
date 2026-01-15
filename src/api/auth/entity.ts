export interface LogoutRequest {
  refreshToken: string;
}

export interface UserInfoResponse {
  userName: string;
  stores: Store[];
}

interface Store {
  id: number;
  name: string;
  imageUrl: string;
}
