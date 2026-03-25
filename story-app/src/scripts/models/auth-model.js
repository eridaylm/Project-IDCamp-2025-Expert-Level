import { login as apiLogin, register as apiRegister } from '../data/api.js';

export default class AuthModel {
  async login({ email, password }) {
    const data = await apiLogin({ email, password });
    
    localStorage.setItem('token', data.loginResult.token);
    localStorage.setItem('userName', data.loginResult.name);
    return data.loginResult;
  }

  async register({ name, email, password }) {
    return await apiRegister({ name, email, password });
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
  }

  isLoggedIn() {
    return !!localStorage.getItem('token');
  }

  getUserName() {
    return localStorage.getItem('userName') || '';
  }
}
