import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { getCurrentUser, logoutUser } from "../services/api";
import { disconnectSocket } from "../services/socket";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await getCurrentUser();
        setUser(response.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, []);

  const login = useCallback((userData) => {
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      // La conexión en tiempo real también debe cerrarse al terminar la sesión.
      disconnectSocket();
      setUser(null);
    }
  }, []);

  const updateUser = useCallback((updatedData) => {
    setUser((currentUser) => ({
      ...currentUser,
      ...updatedData,
    }));
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }

  return context;
};

export default AuthContext;
