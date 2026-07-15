/**
 * Hook para consultar y modificar publicaciones mediante la API.
 *
 * Reemplaza la persistencia anterior en localStorage. El estado local se usa
 * únicamente para reflejar los cambios de manera inmediata en React; Prisma
 * continúa siendo la fuente de verdad.
 */

import { useCallback, useEffect, useState } from "react";
import {
  createComment as createCommentRequest,
  createPost as createPostRequest,
  deletePost as deletePostRequest,
  getPosts,
  likePost,
  unlikePost,
} from "../services/api";

const formatDate = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("es-PE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const normalizeComment = (comment) => ({
  ...comment,
  id: String(comment.id),
  fecha: formatDate(comment.createdAt || comment.fecha),
});

const normalizePost = (post) => ({
  ...post,
  id: Number(post.id),
  contenido: post.contenido ?? post.content ?? "",
  fecha: formatDate(post.createdAt || post.fecha),
  likes: Number(post.likes || 0),
  comentarios: Number(post.comentarios || post.comments?.length || 0),
  likedByMe: Boolean(post.likedByMe),
  likedBy: Array.isArray(post.likedBy) ? post.likedBy.map(String) : [],
  comments: Array.isArray(post.comments)
    ? post.comments.map(normalizeComment)
    : [],
});

export const usePosts = (authorId, viewerId) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!viewerId) {
      setPosts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await getPosts(authorId);
      setPosts(response.map(normalizePost));
    } catch (requestError) {
      setPosts([]);
      setError(
        requestError.message || "No se pudieron cargar las publicaciones.",
      );
    } finally {
      setLoading(false);
    }
  }, [authorId, viewerId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createPost = useCallback(async (content) => {
    setError("");

    try {
      const created = normalizePost(
        await createPostRequest({
          content,
          visibility: "PUBLIC",
        }),
      );

      setPosts((current) => [created, ...current]);
      return true;
    } catch (requestError) {
      setError(requestError.message || "No se pudo crear la publicación.");
      return false;
    }
  }, []);

  const deletePost = useCallback(async (postId) => {
    setError("");

    try {
      await deletePostRequest(postId);
      setPosts((current) =>
        current.filter((post) => Number(post.id) !== Number(postId)),
      );
      return true;
    } catch (requestError) {
      setError(requestError.message || "No se pudo eliminar la publicación.");
      return false;
    }
  }, []);

  const toggleLike = useCallback(
    async (postId) => {
      const currentPost = posts.find(
        (post) => Number(post.id) === Number(postId),
      );

      if (!currentPost) return false;

      const nextLikedState = !currentPost.likedByMe;

      // La actualización optimista mantiene la interfaz ágil mientras responde la API.
      setPosts((current) =>
        current.map((post) =>
          Number(post.id) === Number(postId)
            ? {
                ...post,
                likedByMe: nextLikedState,
                likes: Math.max(0, post.likes + (nextLikedState ? 1 : -1)),
              }
            : post,
        ),
      );

      try {
        if (nextLikedState) {
          await likePost(postId);
        } else {
          await unlikePost(postId);
        }

        return true;
      } catch (requestError) {
        // Si el servidor rechaza la operación, se restaura el estado anterior.
        setPosts((current) =>
          current.map((post) =>
            Number(post.id) === Number(postId) ? currentPost : post,
          ),
        );
        setError(requestError.message || "No se pudo actualizar el like.");
        return false;
      }
    },
    [posts],
  );

  const addComment = useCallback(async (postId, content) => {
    if (!content.trim()) return false;

    setError("");

    try {
      const comment = normalizeComment(
        await createCommentRequest(postId, content.trim()),
      );

      setPosts((current) =>
        current.map((post) =>
          Number(post.id) === Number(postId)
            ? {
                ...post,
                comments: [...post.comments, comment],
                comentarios: post.comentarios + 1,
              }
            : post,
        ),
      );

      return true;
    } catch (requestError) {
      setError(requestError.message || "No se pudo publicar el comentario.");
      return false;
    }
  }, []);

  return {
    posts,
    loading,
    error,
    refresh,
    createPost,
    deletePost,
    toggleLike,
    addComment,
  };
};
