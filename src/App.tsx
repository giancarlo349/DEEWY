import { useEffect, useState } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import AdminView from './components/AdminView';
import ClientView from './components/ClientView';
import HomeView from './components/HomeView';
import Login from './components/Login';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientCode, setClientCode] = useState<string | null>(null);
  const [isAdminPath, setIsAdminPath] = useState(false);

  useEffect(() => {
    // Check URL for client code
    const params = new URLSearchParams(window.location.search);
    const code = params.get('codigo');
    if (code) {
      setClientCode(code);
    }

    // Check for admin or galeria path
    const path = window.location.pathname;
    if (path === '/admin' || path === '/galeria') {
      setIsAdminPath(path === '/admin');
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If there's a client code, show the client view regardless of auth
  if (clientCode) {
    return <ClientView code={clientCode} />;
  }

  // If on admin path, show admin area
  if (isAdminPath) {
    if (!user) {
      return <Login />;
    }
    return <AdminView user={user} />;
  }

  // Default to HomeView
  return <HomeView />;
}
