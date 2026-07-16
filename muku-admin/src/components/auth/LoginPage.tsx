import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export function LoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const { login, apiUrl } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch(`${apiUrl}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        throw new Error('Unauthorized');
      }

      const data = await res.json();
      if (data.user.username !== 'admin') {
        alert('Access denied: System admin role required.');
        return;
      }

      login(data.token);
    } catch (err) {
      setError('Invalid username or password.');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[radial-gradient(circle_at_10%_20%,rgba(255,184,0,0.15)_0%,transparent_40%),radial-gradient(circle_at_90%_80%,rgba(59,130,246,0.15)_0%,transparent_40%)]">
      <div className="bg-bg-card border border-border-color rounded-[20px] p-10 w-full max-w-[420px] shadow-[0_20px_40px_rgba(0,0,0,0.4)] text-center animate-[fadeInUp_0.5s_ease-out]">
        <div className="text-[3rem] mb-2.5">🐼</div>
        <h1 className="font-title text-[1.8rem] font-extrabold text-text-main mb-1">Muku Control Panel</h1>
        <p className="text-text-muted text-[0.9rem] mb-[30px]">Admin database access portal</p>
        
        <form onSubmit={handleLogin}>
          <Input 
            label="Username" 
            placeholder="admin" 
            required 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
          />
          <Input 
            type="password" 
            label="Password" 
            placeholder="••••••••" 
            required 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />
          <Button type="submit">Sign In ➔</Button>
        </form>
        {error && <div className="text-danger text-[0.85rem] mt-[15px]">{error}</div>}
      </div>
    </div>
  );
}
