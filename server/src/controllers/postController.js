/**
 * Gestiona publicaciones, likes y comentarios.
 */

import { prisma } from "../config/database.js";
import { PostModel } from "../models/postModel.js";
import { AppError } from "../utils/AppError.js";
import { publicUser } from "../utils/publicUser.js";
import { uploadImage } from "../services/storageService.js";
import { createNotification } from "../services/notificationService.js";
import { parsePositiveBigInt, parsePositiveInt } from "../utils/params.js";

// Transforma el resultado de Prisma al formato esperado por el frontend.
const format = (p, viewer) => ({
  id: p.id,
  authorId: p.authorId,
  contenido: p.content,
  content: p.content,
  imageUrl: p.imageUrl,
  visibility: p.visibility,
  createdAt: p.createdAt,
  fecha: p.createdAt,
  author: publicUser(p.author),
  likes: p.likes.length,
  likedByMe: p.likes.some((x) => x.userId === viewer),
  likedBy: p.likes.map((x) => x.userId),
  comentarios: p.comments.length,
  comments: p.comments.map((c) => ({
    id: c.id,
    content: c.content,
    createdAt: c.createdAt,
    fecha: c.createdAt,
    author: publicUser(c.author),
  })),
});

/**
 * Obtiene las amistades aceptadas del usuario para respetar la visibilidad
 * FRIENDS antes de construir el feed.
 */
const getFriendIds = async (userId) => {
  const relationships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    select: {
      requesterId: true,
      addresseeId: true,
    },
  });

  return relationships.map((relationship) =>
    relationship.requesterId === userId
      ? relationship.addresseeId
      : relationship.requesterId,
  );
};

// Determina si una publicación concreta puede ser consultada por el usuario.
const canViewPost = async (post, viewerId) => {
  if (post.authorId === viewerId || post.visibility === "PUBLIC") return true;

  if (post.visibility !== "FRIENDS") return false;

  const friendship = await prisma.friendship.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterId: viewerId, addresseeId: post.authorId },
        { requesterId: post.authorId, addresseeId: viewerId },
      ],
    },
    select: { id: true },
  });

  return Boolean(friendship);
};

// Obtiene el feed y respeta PUBLIC, FRIENDS y PRIVATE antes de enviarlo.
export const list = async (req, res) => {
  const friendIds = await getFriendIds(req.user.id);
  const posts = await PostModel.list({
    authorId: req.query.authorId || undefined,
    viewerId: req.user.id,
    friendIds,
  });

  res.json({
    posts: posts.map((post) => format(post, req.user.id)),
  });
};

// Busca una publicación visible por su identificador y devuelve un error cuando no existe o fue eliminada.
export const getOne = async (req, res) => {
  const p = await PostModel.find(
    parsePositiveInt(req.params.postId, "identificador de publicación"),
  );

  if (!p || !(await canViewPost(p, req.user.id))) {
    throw new AppError("Publicación no encontrada.", 404);
  }

  res.json({ post: format(p, req.user.id) });
};

// Crea una publicación asociada al usuario autenticado, incluyendo una imagen cuando fue enviada.
export const create = async (req, res) => {
  let imageUrl = null;

  // La imagen es opcional; solo se sube cuando Multer recibió un archivo.
  if (req.file) imageUrl = await uploadImage(req.file, `posts/${req.user.id}`);

  const p = await PostModel.create({
    authorId: req.user.id,
    content: req.body.content,
    visibility: req.body.visibility || "PUBLIC",
    imageUrl,
  });

  res.status(201).json({ post: format(p, req.user.id) });
};

// Actualiza una publicación solamente cuando el usuario autenticado es su autor.
export const update = async (req, res) => {
  const p = await PostModel.find(
    parsePositiveInt(req.params.postId, "identificador de publicación"),
  );

  if (!p || p.authorId !== req.user.id)
    throw new AppError("No autorizado.", 403);

  res.json({
    post: format(await PostModel.update(p.id, req.body), req.user.id),
  });
};

// Realiza una eliminación lógica de la publicación, conservando el registro en la base de datos.
export const remove = async (req, res) => {
  const p = await PostModel.find(
    parsePositiveInt(req.params.postId, "identificador de publicación"),
  );

  if (!p || p.authorId !== req.user.id)
    throw new AppError("No autorizado.", 403);

  await PostModel.remove(p.id);

  res.json({ message: "Publicación eliminada." });
};

// Registra un “me gusta” sin duplicarlo y notifica al autor cuando otra persona interactúa con su publicación.
export const like = async (req, res) => {
  const postId = parsePositiveInt(
    req.params.postId,
    "identificador de publicación",
  );

  const post = await PostModel.find(postId);

  if (!post || !(await canViewPost(post, req.user.id))) {
    throw new AppError("Publicación no encontrada.", 404);
  }

  await prisma.postLike.upsert({
    where: { postId_userId: { postId, userId: req.user.id } },
    update: {},
    create: { postId, userId: req.user.id },
  });

  if (post.authorId !== req.user.id)
    await createNotification(
      {
        userId: post.authorId,
        actorId: req.user.id,
        type: "POST_LIKE",
        entityType: "post",
        entityId: String(postId),
        content: "Le gustó tu publicación.",
      },
      req.app.get("io"),
    );

  res.json({ message: "Like agregado." });
};

// Elimina el “me gusta” del usuario autenticado sobre una publicación concreta.
export const unlike = async (req, res) => {
  const postId = parsePositiveInt(
    req.params.postId,
    "identificador de publicación",
  );

  await prisma.postLike.deleteMany({
    where: {
      postId,
      userId: req.user.id,
    },
  });

  res.json({ message: "Like eliminado." });
};

// Guarda un comentario, devuelve sus datos con el autor y notifica al dueño de la publicación.
export const addComment = async (req, res) => {
  const postId = parsePositiveInt(
    req.params.postId,
    "identificador de publicación",
  );

  const post = await PostModel.find(postId);

  if (!post || !(await canViewPost(post, req.user.id))) {
    throw new AppError("Publicación no encontrada.", 404);
  }

  const c = await prisma.comment.create({
    data: { postId, authorId: req.user.id, content: req.body.content },
    include: { author: true },
  });

  if (post.authorId !== req.user.id)
    await createNotification(
      {
        userId: post.authorId,
        actorId: req.user.id,
        type: "POST_COMMENT",
        entityType: "post",
        entityId: String(postId),
        content: "Comentó tu publicación.",
      },
      req.app.get("io"),
    );

  res.status(201).json({ comment: { ...c, author: publicUser(c.author) } });
};

// Elimina lógicamente un comentario cuando pertenece al usuario autenticado.
export const deleteComment = async (req, res) => {
  const c = await prisma.comment.findUnique({
    where: {
      id: parsePositiveBigInt(
        req.params.commentId,
        "identificador de comentario",
      ),
    },
  });

  if (!c || c.authorId !== req.user.id)
    throw new AppError("No autorizado.", 403);

  await prisma.comment.update({
    where: { id: c.id },
    data: { deletedAt: new Date() },
  });

  res.json({ message: "Comentario eliminado." });
};
