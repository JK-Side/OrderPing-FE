export interface LogoutRequest {
  refreshToken: string;
}

export interface InfoResponse {
  userName: string;
  stores: Store[];
}

interface Store {
  id: number;
  name: string;
  imageUrl: string;
}
