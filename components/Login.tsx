
import React, { useState } from 'react';
import { UserType } from '../types';
import { Icon } from './Icons';

interface LoginProps {
  onLogin: (userType: UserType) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (password === '123456') {
      onLogin('limited');
    } else if (password === '110527') {
      onLogin('full');
    } else {
      setError('كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى');
      setPassword('');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-4 bg-gradient-to-br from-purple-600 to-blue-500">
      <div className="bg-white rounded-2xl p-8 md:p-12 shadow-2xl w-full max-w-md text-center transform hover:scale-105 transition-transform duration-300">
        <div className="flex justify-center items-center mb-4 text-purple-600">
          <Icon name="school" className="w-16 h-16" />
        </div>
        <h2 className="text-gray-800 text-3xl font-bold mb-2">نظام إدارة الطلاب</h2>
        <p className="text-gray-500 text-lg mb-8">مدرسة ابن خفاجة</p>
        <div className="mb-6">
          <input
            type="password"
            className="w-full border-2 border-gray-300 rounded-lg p-4 text-lg text-center transition-all duration-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none"
            id="passwordInput"
            placeholder="أدخل كلمة المرور"
            autoComplete="off"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          {error && (
            <div className="text-red-500 mt-3 text-sm flex items-center justify-center">
              <Icon name="warning" className="w-4 h-4 mr-2" />
              {error}
            </div>
          )}
        </div>
        <button
          className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
          onClick={handleLogin}
        >
          <span className="flex items-center justify-center">
            <Icon name="login" className="w-5 h-5 ml-2" />
            دخول
          </span>
        </button>
      </div>
    </div>
  );
};

export default Login;
