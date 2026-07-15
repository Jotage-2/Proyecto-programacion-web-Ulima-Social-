/**
 * Mantiene sincronizadas las amistades del usuario con la API.
 *
 * Este contexto reemplaza el almacenamiento local anterior. Todas las
 * solicitudes, aceptaciones, rechazos y eliminaciones se guardan ahora en la
 * tabla friendships mediante el backend.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  acceptFriendRequest,
  deleteFriendship,
  getFriendships,
  rejectFriendRequest,
  sendFriendRequest,
} from "../services/api";
import { useAuth } from "./AuthContext";

const FriendsContext = createContext(null);

const emptyState = {
  friends: [],
  sentRequests: [],
  receivedRequests: [],
};

export const FriendsProvider = ({ children }) => {
  const { user } = useAuth();
  const [data, setData] = useState(emptyState);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  /**
   * Vuelve a consultar las relaciones del usuario autenticado.
   */
  const refresh = useCallback(async () => {
    if (!user?.id) {
      setData(emptyState);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await getFriendships();

      setData({
        friends: response.friends || [],
        sentRequests: response.sentRequests || [],
        receivedRequests: response.receivedRequests || [],
      });
    } catch (requestError) {
      setData(emptyState);
      setError(requestError.message || "No se pudieron cargar las amistades.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /**
   * Ejecuta una mutación y actualiza la lista completa al terminar. De esta
   * forma React siempre refleja el estado real guardado por Prisma.
   */
  const performMutation = useCallback(
    async (operation) => {
      if (updating) return false;

      setUpdating(true);
      setError("");

      try {
        await operation();
        await refresh();
        return true;
      } catch (requestError) {
        setError(requestError.message || "No se pudo actualizar la amistad.");
        return false;
      } finally {
        setUpdating(false);
      }
    },
    [refresh, updating],
  );

  const sendRequest = useCallback(
    async (targetUser) => {
      if (!targetUser?.id) return false;

      return performMutation(() => sendFriendRequest(targetUser.id));
    },
    [performMutation],
  );

  const acceptRequest = useCallback(
    async (person) => {
      const relationship = data.receivedRequests.find(
        (item) => String(item.id) === String(person?.id),
      );

      if (!relationship?.friendshipId) return false;

      return performMutation(() =>
        acceptFriendRequest(relationship.friendshipId),
      );
    },
    [data.receivedRequests, performMutation],
  );

  const rejectRequest = useCallback(
    async (personId) => {
      const relationship = data.receivedRequests.find(
        (item) => String(item.id) === String(personId),
      );

      if (!relationship?.friendshipId) return false;

      return performMutation(() =>
        rejectFriendRequest(relationship.friendshipId),
      );
    },
    [data.receivedRequests, performMutation],
  );

  const cancelRequest = useCallback(
    async (personId) => {
      const relationship = data.sentRequests.find(
        (item) => String(item.id) === String(personId),
      );

      if (!relationship?.friendshipId) return false;

      return performMutation(() => deleteFriendship(relationship.friendshipId));
    },
    [data.sentRequests, performMutation],
  );

  const removeFriend = useCallback(
    async (personId) => {
      const relationship = data.friends.find(
        (item) => String(item.id) === String(personId),
      );

      if (!relationship?.friendshipId) return false;

      return performMutation(() => deleteFriendship(relationship.friendshipId));
    },
    [data.friends, performMutation],
  );

  const value = useMemo(
    () => ({
      friends: data.friends,
      sentRequests: data.sentRequests,
      receivedRequests: data.receivedRequests,
      pendingCount: data.receivedRequests.length,
      loading,
      updating,
      error,
      refresh,
      sendRequest,
      acceptRequest,
      rejectRequest,
      cancelRequest,
      removeFriend,
      isFriend: (id) =>
        data.friends.some((item) => String(item.id) === String(id)),
      hasSentRequest: (id) =>
        data.sentRequests.some((item) => String(item.id) === String(id)),
      hasReceivedRequest: (id) =>
        data.receivedRequests.some((item) => String(item.id) === String(id)),
    }),
    [
      acceptRequest,
      cancelRequest,
      data,
      error,
      loading,
      refresh,
      rejectRequest,
      removeFriend,
      sendRequest,
      updating,
    ],
  );

  return (
    <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>
  );
};

export const useFriends = () => {
  const context = useContext(FriendsContext);

  if (!context) {
    throw new Error("useFriends debe usarse dentro de FriendsProvider");
  }

  return context;
};
