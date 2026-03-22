export interface UserInfoResponse {
  userName: string;
  stores: UserStore[];
}

export interface UserStore {
  id: number;
  name: string;
  imageUrl: string;
}

export interface RefreshResponse {
  accessToken: string;
}
