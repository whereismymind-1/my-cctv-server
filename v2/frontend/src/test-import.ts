// Test file to debug import issue
import { AuthResponse } from './shared/types/index';

console.log('AuthResponse type imported successfully');

const testAuth: AuthResponse = {
  user: {
    id: '1',
    username: 'test',
    email: 'test@test.com',
    level: 1
  },
  token: 'test-token'
};

console.log('Test object created:', testAuth);