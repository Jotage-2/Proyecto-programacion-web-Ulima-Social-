/**
 * Centraliza todas las solicitudes HTTP realizadas por el frontend.
 *
 * Mantener las llamadas en este archivo evita que los componentes conozcan
 * detalles como la URL base, las cookies, los encabezados o la estructura
 * exacta de cada respuesta del servidor.
 */

export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

/**
 * Ejecuta una solicitud contra la API y transforma los errores HTTP en
 * excepciones con mensajes legibles para la interfaz.
 */
const request = async (endpoint, options = {}) => {
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${API_URL}${endpoint}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error = new Error(
      data?.message ||
        data?.error ||
        "Ocurrió un error al comunicarse con el servidor.",
    );

    error.status = response.status;
    error.details = data?.details;

    throw error;
  }

  return data;
};

// ---------------------------------------------------------------------------
// Autenticación
// ---------------------------------------------------------------------------

/**
 * Registra un usuario. Cuando existe una foto, se utiliza multipart/form-data
 * para que el backend pueda subirla a Supabase Storage antes de guardar la URL.
 */
export const registerUser = async (userData, profileImageFile = null) => {
  if (!profileImageFile) {
    return request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  const formData = new FormData();

  Object.entries(userData).forEach(([key, value]) => {
    formData.append(key, String(value));
  });

  formData.append("image", profileImageFile);

  return request("/auth/register", {
    method: "POST",
    body: formData,
  });
};

export const verifyEmail = async (email, code) =>
  request("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });

export const resendVerificationCode = async (email) =>
  request("/auth/resend-code", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export const loginUser = async (identifier, password) =>
  request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier, password }),
  });

export const logoutUser = async () =>
  request("/auth/logout", {
    method: "POST",
  });

export const getCurrentUser = async () => request("/auth/me");

export const forgotPassword = async (email) =>
  request("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export const verifyResetCode = async (email, code) =>
  request("/auth/verify-reset-code", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });

export const resetPassword = async (email, code, newPassword) =>
  request("/auth/reset-password", {
    method: "PATCH",
    body: JSON.stringify({
      email,
      code,
      newPassword,
    }),
  });

// ---------------------------------------------------------------------------
// Usuarios y perfiles
// ---------------------------------------------------------------------------

/**
 * El backend responde con { user }; esta función devuelve directamente el
 * usuario para que las páginas no dependan del envoltorio HTTP.
 */
export const getUserById = async (userId) => {
  const response = await request(`/users/${encodeURIComponent(userId)}`);
  return response.user;
};

/**
 * El backend responde con { users }; se devuelve solo el arreglo normalizado.
 */
export const searchUsers = async (query) => {
  const response = await request(
    `/users/search?q=${encodeURIComponent(query)}`,
  );

  return response.users || [];
};

export const updateUserProfile = async (updates) =>
  request("/users/me", {
    method: "PATCH",
    body: JSON.stringify(updates),
  });

export const uploadProfilePicture = async (file) => {
  const formData = new FormData();
  formData.append("image", file);

  return request("/users/me/profile-picture", {
    method: "PATCH",
    body: formData,
  });
};

// ---------------------------------------------------------------------------
// Publicaciones
// ---------------------------------------------------------------------------

export const getPosts = async (authorId) => {
  const query = authorId ? `?authorId=${encodeURIComponent(authorId)}` : "";
  const response = await request(`/posts${query}`);

  return response.posts || [];
};

export const createPost = async ({
  content,
  visibility = "PUBLIC",
  imageFile = null,
}) => {
  if (!imageFile) {
    const response = await request("/posts", {
      method: "POST",
      body: JSON.stringify({ content, visibility }),
    });

    return response.post;
  }

  const formData = new FormData();
  formData.append("content", content);
  formData.append("visibility", visibility);
  formData.append("image", imageFile);

  const response = await request("/posts", {
    method: "POST",
    body: formData,
  });

  return response.post;
};

export const deletePost = async (postId) =>
  request(`/posts/${encodeURIComponent(postId)}`, {
    method: "DELETE",
  });

export const likePost = async (postId) =>
  request(`/posts/${encodeURIComponent(postId)}/likes`, {
    method: "POST",
  });

export const unlikePost = async (postId) =>
  request(`/posts/${encodeURIComponent(postId)}/likes`, {
    method: "DELETE",
  });

export const createComment = async (postId, content) => {
  const response = await request(
    `/posts/${encodeURIComponent(postId)}/comments`,
    {
      method: "POST",
      body: JSON.stringify({ content }),
    },
  );

  return response.comment;
};

// ---------------------------------------------------------------------------
// Amistades
// ---------------------------------------------------------------------------

export const getFriendships = async () => request("/friendships");

export const sendFriendRequest = async (userId) =>
  request(`/friendships/${encodeURIComponent(userId)}`, {
    method: "POST",
  });

export const acceptFriendRequest = async (friendshipId) =>
  request(`/friendships/${encodeURIComponent(friendshipId)}/accept`, {
    method: "PATCH",
  });

export const rejectFriendRequest = async (friendshipId) =>
  request(`/friendships/${encodeURIComponent(friendshipId)}/reject`, {
    method: "PATCH",
  });

export const deleteFriendship = async (friendshipId) =>
  request(`/friendships/${encodeURIComponent(friendshipId)}`, {
    method: "DELETE",
  });

// ---------------------------------------------------------------------------
// Grupos
// ---------------------------------------------------------------------------

export const getGroups = async () => {
  const response = await request("/groups");
  return response.groups || [];
};

export const createGroup = async (groupData) => {
  const response = await request("/groups", {
    method: "POST",
    body: JSON.stringify(groupData),
  });

  return response.group;
};

export const joinGroup = async (groupId) =>
  request(`/groups/${encodeURIComponent(groupId)}/join`, {
    method: "POST",
  });

export const leaveGroup = async (groupId) =>
  request(`/groups/${encodeURIComponent(groupId)}/leave`, {
    method: "DELETE",
  });

// ---------------------------------------------------------------------------
// Conversaciones y mensajes
// ---------------------------------------------------------------------------

export const getConversations = async () => {
  const response = await request("/conversations");
  return response.conversations || [];
};

export const createConversation = async ({
  memberIds,
  type = "DIRECT",
  name,
}) => {
  const response = await request("/conversations", {
    method: "POST",
    body: JSON.stringify({ memberIds, type, name }),
  });

  return response.conversation;
};

export const getConversationMessages = async (conversationId) => {
  const response = await request(
    `/conversations/${encodeURIComponent(conversationId)}/messages`,
  );

  return response.messages || [];
};

export const sendConversationMessage = async (conversationId, content) => {
  const response = await request(
    `/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      method: "POST",
      body: JSON.stringify({ content }),
    },
  );

  return response.message;
};

export const markConversationAsRead = async (conversationId) =>
  request(`/conversations/${encodeURIComponent(conversationId)}/read`, {
    method: "PATCH",
  });

// ---------------------------------------------------------------------------
// Notificaciones
// ---------------------------------------------------------------------------

export const getNotifications = async () => request("/notifications");

export const markNotificationAsRead = async (notificationId) =>
  request(`/notifications/${encodeURIComponent(notificationId)}/read`, {
    method: "PATCH",
  });

export const markAllNotificationsAsRead = async () =>
  request("/notifications/read-all", {
    method: "PATCH",
  });

// ---------------------------------------------------------------------------
// Estado del servicio
// ---------------------------------------------------------------------------

export const checkHealth = async () => request("/health");
