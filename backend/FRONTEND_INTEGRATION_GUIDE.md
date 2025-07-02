# Guide d'Intégration Frontend - Login Unifié GameZone

## 🔗 Intégration avec React/TypeScript

### Types TypeScript

```typescript
// types/auth.ts
export interface LoginResponse {
  token: string;
  userType: 'admin' | 'client';
  user: {
    id?: number;           // Pour admin: id_admin
    id_client?: number;    // Pour client: id_client
    email: string;
    nom: string;
    prenom: string;
  };
}

export interface ProfileResponse {
  userType: 'admin' | 'client';
  user: {
    id_admin?: number;
    id_client?: number;
    email: string;
    nom: string;
    prenom: string;
  };
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface DeleteAccountRequest {
  password: string;
}
```

### Service d'Authentification

```typescript
// services/authService.ts
import { LoginResponse, ProfileResponse, ChangePasswordRequest, DeleteAccountRequest } from '../types/auth';

class AuthService {
  private baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    
    // Stocker le token et les infos utilisateur
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('userType', data.userType);
    localStorage.setItem('userInfo', JSON.stringify(data.user));
    
    return data;
  }

  async register(userData: {
    nom: string;
    prenom: string;
    email: string;
    password: string;
  }): Promise<LoginResponse> {
    const response = await fetch(`${this.baseURL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    const data = await response.json();
    
    // Auto-login après inscription
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('userType', 'client');
    localStorage.setItem('userInfo', JSON.stringify(data.user));
    
    return data;
  }

  async getProfile(): Promise<ProfileResponse> {
    const token = this.getToken();
    
    const response = await fetch(`${this.baseURL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    return response.json();
  }

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    const token = this.getToken();
    
    const response = await fetch(`${this.baseURL}/auth/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to change password');
    }
  }

  async deleteAccount(data: DeleteAccountRequest): Promise<void> {
    const token = this.getToken();
    
    const response = await fetch(`${this.baseURL}/auth/delete-account`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete account');
    }

    // Supprimer les données locales après suppression réussie
    this.logout();
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  getUserType(): 'admin' | 'client' | null {
    return localStorage.getItem('userType') as 'admin' | 'client' | null;
  }

  getUserInfo() {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('userInfo');
  }
}

export const authService = new AuthService();
```

### Hook d'Authentification Mis à Jour

```typescript
// hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { LoginResponse } from '../types/auth';

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState<'admin' | 'client' | null>(null);

  useEffect(() => {
    // Charger les données utilisateur au démarrage
    const token = authService.getToken();
    const storedUserType = authService.getUserType();
    const storedUser = authService.getUserInfo();

    if (token && storedUserType && storedUser) {
      setUserType(storedUserType);
      setUser(storedUser);
    }
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials.email, credentials.password);
      setUser(response.user);
      setUserType(response.userType);
      return response;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: {
    nom: string;
    prenom: string;
    email: string;
    password: string;
  }) => {
    setIsLoading(true);
    try {
      const response = await authService.register(userData);
      setUser(response.user);
      setUserType('client');
      return response;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (data: { currentPassword: string; newPassword: string }) => {
    setIsLoading(true);
    try {
      await authService.changePassword(data);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAccount = async (password: string) => {
    setIsLoading(true);
    try {
      await authService.deleteAccount({ password });
      setUser(null);
      setUserType(null);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setUserType(null);
  };

  return {
    user,
    userType,
    isLoading,
    isAuthenticated: authService.isAuthenticated(),
    login,
    register,
    changePassword,
    deleteAccount,
    logout,
  };
}
```

### Composant Login Mis à Jour

```typescript
// components/Login.tsx
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Mail, Lock, Gamepad2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { LoadingButton } from './LoadingButton';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading, isAuthenticated, userType } = useAuth();
  const navigate = useNavigate();

  // Redirection basée sur le type d'utilisateur
  if (isAuthenticated) {
    if (userType === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/client/home" replace />;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await login({ email, password });
      
      // Redirection basée sur le type d'utilisateur connecté
      if (response.userType === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/client/home');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erreur de connexion');
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4">
            <Gamepad2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">GameZone</h1>
          <p className="text-white/80">Connectez-vous pour accéder à votre espace</p>
        </div>

        <div className="glass-effect rounded-2xl p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-white text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-white/30 focus:border-transparent outline-none"
                  placeholder="votre@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-white/30 focus:border-transparent outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <LoadingButton
              type="submit"
              isLoading={isLoading}
              className="w-full bg-white text-primary-600 font-semibold py-3 px-4 rounded-xl hover:bg-white/90 transition-colors"
            >
              Se connecter
            </LoadingButton>
          </form>

          <div className="mt-6 text-center">
            <p className="text-white/80 text-sm">
              Pas encore de compte ?{' '}
              <Link to="/register" className="text-white font-medium hover:underline">
                Créer un compte
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Composant de Gestion de Compte

```typescript
// components/AccountSettings.tsx
import { useState } from 'react';
import { Lock, Trash2, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { LoadingButton } from './LoadingButton';

export function AccountSettings() {
  const { user, userType, changePassword, deleteAccount, logout } = useAuth();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [deleteForm, setDeleteForm] = useState({
    password: '',
    confirmDelete: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setSuccess('Mot de passe modifié avec succès');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erreur lors du changement de mot de passe');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!deleteForm.confirmDelete) {
      setError('Veuillez confirmer la suppression de votre compte');
      return;
    }

    setIsDeletingAccount(true);
    try {
      await deleteAccount(deleteForm.password);
      // L'utilisateur sera automatiquement déconnecté
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erreur lors de la suppression du compte');
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      {/* Informations du profil */}
      <div className="glass-effect rounded-2xl p-6">
        <div className="flex items-center mb-4">
          <User className="h-6 w-6 text-primary-400 mr-3" />
          <h2 className="text-xl font-bold text-white">Informations du profil</h2>
        </div>
        <div className="space-y-3 text-white/80">
          <p><span className="font-medium">Type de compte:</span> {userType === 'admin' ? 'Administrateur' : 'Client'}</p>
          <p><span className="font-medium">Email:</span> {user?.email}</p>
          <p><span className="font-medium">Nom:</span> {user?.prenom} {user?.nom}</p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-white text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-white text-sm">
          {success}
        </div>
      )}

      {/* Changement de mot de passe */}
      <div className="glass-effect rounded-2xl p-6">
        <div className="flex items-center mb-4">
          <Lock className="h-6 w-6 text-primary-400 mr-3" />
          <h2 className="text-xl font-bold text-white">Changer le mot de passe</h2>
        </div>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <input
            type="password"
            placeholder="Mot de passe actuel"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-white/30 focus:border-transparent outline-none"
            required
          />
          <input
            type="password"
            placeholder="Nouveau mot de passe"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-white/30 focus:border-transparent outline-none"
            required
          />
          <input
            type="password"
            placeholder="Confirmer le nouveau mot de passe"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-white/30 focus:border-transparent outline-none"
            required
          />
          <LoadingButton
            type="submit"
            isLoading={isChangingPassword}
            className="w-full bg-primary-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-primary-700 transition-colors"
          >
            Changer le mot de passe
          </LoadingButton>
        </form>
      </div>

      {/* Suppression de compte (seulement pour les clients) */}
      {userType === 'client' && (
        <div className="glass-effect rounded-2xl p-6 border border-red-500/30">
          <div className="flex items-center mb-4">
            <Trash2 className="h-6 w-6 text-red-400 mr-3" />
            <h2 className="text-xl font-bold text-white">Supprimer le compte</h2>
          </div>
          <p className="text-white/80 mb-4">
            Cette action est irréversible. Toutes vos données seront définitivement supprimées.
          </p>
          <form onSubmit={handleDeleteAccount} className="space-y-4">
            <input
              type="password"
              placeholder="Confirmer avec votre mot de passe"
              value={deleteForm.password}
              onChange={(e) => setDeleteForm(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-white/30 focus:border-transparent outline-none"
              required
            />
            <label className="flex items-center text-white/80">
              <input
                type="checkbox"
                checked={deleteForm.confirmDelete}
                onChange={(e) => setDeleteForm(prev => ({ ...prev, confirmDelete: e.target.checked }))}
                className="mr-3"
              />
              Je comprends que cette action est irréversible
            </label>
            <LoadingButton
              type="submit"
              isLoading={isDeletingAccount}
              className="w-full bg-red-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-red-700 transition-colors"
              disabled={!deleteForm.confirmDelete}
            >
              Supprimer définitivement mon compte
            </LoadingButton>
          </form>
        </div>
      )}
    </div>
  );
}
```

## 🔄 Routes et Navigation

### Configuration des Routes

```typescript
// App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AdminDashboard } from './pages/admin/Dashboard';
import { ClientHome } from './pages/client/Home';
import { AccountSettings } from './pages/AccountSettings';

function App() {
  const { isAuthenticated, userType } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Routes protégées */}
      <Route path="/admin/*" element={
        isAuthenticated && userType === 'admin' ? 
        <AdminDashboard /> : 
        <Navigate to="/login" />
      } />
      
      <Route path="/client/*" element={
        isAuthenticated && userType === 'client' ? 
        <ClientHome /> : 
        <Navigate to="/login" />
      } />
      
      <Route path="/account" element={
        isAuthenticated ? 
        <AccountSettings /> : 
        <Navigate to="/login" />
      } />
      
      <Route path="/" element={
        isAuthenticated ? 
        (userType === 'admin' ? <Navigate to="/admin/dashboard" /> : <Navigate to="/client/home" />) :
        <Navigate to="/login" />
      } />
    </Routes>
  );
}
```

## 📱 Support Mobile

### Variables d'Environnement

```env
# .env
REACT_APP_API_URL=http://localhost:3001/api

# .env.local (pour développement mobile)
REACT_APP_API_URL=http://192.168.1.XXX:3001/api
```

### Configuration PWA

Le système fonctionne parfaitement avec les Progressive Web Apps pour une expérience mobile optimale.

## 🚀 Déploiement

### Checklist de Déploiement

1. ✅ Login unifié admin/client
2. ✅ Changement de mot de passe
3. ✅ Suppression de compte (clients uniquement)
4. ✅ Gestion des types d'utilisateurs
5. ✅ Protection des routes
6. ✅ Support mobile
7. ✅ Gestion d'erreurs
8. ✅ Validation des données
