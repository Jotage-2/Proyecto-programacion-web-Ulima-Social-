/**
 * Gestiona grupos, miembros y operaciones relacionadas con conversaciones grupales.
 */

import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import { publicUser } from "../utils/publicUser.js";
import { parsePositiveInt } from "../utils/params.js";

const include = {
  owner: true,
  members: {
    include: {
      user: true,
    },
  },
};

/**
 * Convierte el resultado de Prisma en una respuesta segura y útil para React.
 * No se exponen hashes de contraseña ni otros campos privados de los miembros.
 */
const formatGroup = (group, viewerId) => ({
  id: group.id,
  name: group.name,
  career: group.career,
  emoji: group.emoji,
  description: group.description,
  imageUrl: group.imageUrl,
  visibility: group.visibility,
  ownerId: group.ownerId,
  owner: publicUser(group.owner),
  createdAt: group.createdAt,
  updatedAt: group.updatedAt,
  memberCount: group.members.length,
  joinedByMe: group.members.some((member) => member.userId === viewerId),
  myRole:
    group.members.find((member) => member.userId === viewerId)?.role || null,
  members: group.members.map((member) => ({
    userId: member.userId,
    role: member.role,
    joinedAt: member.joinedAt,
    user: publicUser(member.user),
  })),
});

// Obtiene los grupos disponibles junto con el estado de membresía del usuario.
export const list = async (req, res) => {
  const groups = await prisma.group.findMany({
    include,
    orderBy: { createdAt: "desc" },
  });

  res.json({
    groups: groups.map((group) => formatGroup(group, req.user.id)),
  });
};

// Busca un grupo específico y devuelve sus datos y miembros.
export const getOne = async (req, res) => {
  const group = await prisma.group.findUnique({
    where: { id: parsePositiveInt(req.params.id, "identificador de grupo") },
    include,
  });

  if (!group) throw new AppError("Grupo no encontrado.", 404);

  res.json({ group: formatGroup(group, req.user.id) });
};

// Crea un grupo y registra automáticamente al creador como propietario.
export const create = async (req, res) => {
  const group = await prisma.$transaction(async (tx) => {
    const createdGroup = await tx.group.create({
      data: {
        ...req.body,
        ownerId: req.user.id,
      },
    });

    await tx.groupMember.create({
      data: {
        groupId: createdGroup.id,
        userId: req.user.id,
        role: "OWNER",
      },
    });

    return tx.group.findUnique({
      where: { id: createdGroup.id },
      include,
    });
  });

  res.status(201).json({
    group: formatGroup(group, req.user.id),
  });
};

// Permite modificar el grupo únicamente a su propietario.
export const update = async (req, res) => {
  const existingGroup = await prisma.group.findUnique({
    where: { id: parsePositiveInt(req.params.id, "identificador de grupo") },
  });

  if (!existingGroup || existingGroup.ownerId !== req.user.id) {
    throw new AppError("No autorizado.", 403);
  }

  const group = await prisma.group.update({
    where: { id: existingGroup.id },
    data: req.body,
    include,
  });

  res.json({ group: formatGroup(group, req.user.id) });
};

// Agrega al usuario autenticado como miembro de un grupo público.
export const join = async (req, res) => {
  const groupId = parsePositiveInt(req.params.id, "identificador de grupo");
  const existingGroup = await prisma.group.findUnique({
    where: { id: groupId },
  });

  if (!existingGroup) throw new AppError("Grupo no encontrado.", 404);

  if (existingGroup.visibility === "PRIVATE") {
    throw new AppError("Este grupo requiere invitación.", 403);
  }

  await prisma.groupMember.upsert({
    where: {
      groupId_userId: {
        groupId,
        userId: req.user.id,
      },
    },
    update: {},
    create: {
      groupId,
      userId: req.user.id,
    },
  });

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include,
  });

  res.json({
    message: "Te uniste al grupo.",
    group: formatGroup(group, req.user.id),
  });
};

// Retira al usuario del grupo, salvo cuando es su propietario.
export const leave = async (req, res) => {
  const groupId = parsePositiveInt(req.params.id, "identificador de grupo");
  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId: req.user.id,
      },
    },
  });

  if (!membership) throw new AppError("No perteneces al grupo.", 404);

  if (membership.role === "OWNER") {
    throw new AppError("El propietario no puede abandonar el grupo.", 409);
  }

  await prisma.groupMember.delete({
    where: {
      groupId_userId: {
        groupId,
        userId: req.user.id,
      },
    },
  });

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include,
  });

  res.json({
    message: "Saliste del grupo.",
    group: formatGroup(group, req.user.id),
  });
};
