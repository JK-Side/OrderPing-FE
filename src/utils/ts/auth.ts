import { getCookie } from './cookie';

export const getAuthHeader = () => ({
  Authorization: `Bearer ${getCookie('AUTH_TOKEN_KEY')}`,
});
