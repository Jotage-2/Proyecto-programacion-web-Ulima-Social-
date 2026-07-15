/**
 * Gestiona conversaciones, mensajes privados y mensajes en tiempo real.
 */

import { prisma } from "../config/database.js";
import { createNotification } from "../services/notificationService.js";
import { AppError } from "../utils/AppError.js";
import { parsePositiveBigInt } from "../utils/params.js";
import { publicUser } from "../utils/publicUser.js";

/**
 * Convierte los usuarios incluidos por Prisma a su versión pública.
 */
const formatConversation = (conversation) => ({
  ...conversation,
  members: conversation.members?.map((member) => ({
    ...member,
    user: publicUser(member.user),
  })),
});

/**
 * Verifica que el usuario pertenezca a la conversación antes de permitirle
 * consultar, enviar o marcar mensajes como leídos.
 */
const assertMember = async (conversationId, userId) => {
  const membership = await prisma.conversationMember.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId,
      },
    },
  });

  if (!membership || membership.leftAt) {
    throw new AppError("No perteneces a esta conversación.", 403);
  }

  return membership;
};

/**
 * Lista las conversaciones del usuario con sus participantes y el mensaje más
 * reciente, que se usa como vista previa en el frontend.
 */
export const list = async (req, res) => {
  const conversations = await prisma.conversation.findMany({
    where: {
      members: {
        some: {
          userId: req.user.id,
          leftAt: null,
        },
      },
    },
    include: {
      members: {
        include: {
          user: true,
        },
      },
      messages: {
        where: {
          deletedAt: null,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  res.json({
    conversations: conversations.map(formatConversation),
  });
};

/**
 * Crea una conversación o reutiliza una conversación directa existente.
 */
export const create = async (req, res) => {
  const memberIds = [...new Set([req.user.id, ...req.body.memberIds])];

  if (req.body.type === "DIRECT" && memberIds.length !== 2) {
    throw new AppError(
      "Una conversación directa debe tener dos integrantes.",
      400,
    );
  }

  // Se valida a los participantes antes de crear relaciones en Prisma para
  // evitar errores de clave foránea poco comprensibles para el usuario.
  const validMembers = await prisma.user.findMany({
    where: {
      id: {
        in: memberIds,
      },
      status: "ACTIVE",
      verified: true,
    },
    select: {
      id: true,
    },
  });

  if (validMembers.length !== memberIds.length) {
    throw new AppError("Uno o más integrantes no están disponibles.", 404);
  }

  if (req.body.type === "DIRECT") {
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        type: "DIRECT",
        AND: memberIds.map((userId) => ({
          members: {
            some: {
              userId,
              leftAt: null,
            },
          },
        })),
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (
      existingConversation &&
      existingConversation.members.length === memberIds.length
    ) {
      return res.json({
        conversation: formatConversation(existingConversation),
      });
    }
  }

  const conversation = await prisma.conversation.create({
    data: {
      type: req.body.type,
      name: req.body.name,
      createdBy: req.user.id,
      members: {
        create: memberIds.map((userId) => ({ userId })),
      },
    },
    include: {
      members: {
        include: {
          user: true,
        },
      },
    },
  });

  // Los usuarios conectados se incorporan a la nueva sala inmediatamente, de
  // modo que puedan recibir mensajes sin recargar la aplicación.
  const io = req.app.get("io");

  for (const userId of memberIds) {
    io?.in(`user:${userId}`).socketsJoin(`conversation:${conversation.id}`);
  }

  res.status(201).json({
    conversation: formatConversation(conversation),
  });
};

/**
 * Obtiene los mensajes de una conversación y actualiza la última fecha de
 * lectura del usuario autenticado.
 */
export const messages = async (req, res) => {
  const conversationId = parsePositiveBigInt(
    req.params.id,
    "identificador de conversación",
  );

  await assertMember(conversationId, req.user.id);

  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      deletedAt: null,
    },
    include: {
      sender: true,
    },
    orderBy: {
      createdAt: "asc",
    },
    take: 200,
  });

  await prisma.conversationMember.update({
    where: {
      conversationId_userId: {
        conversationId,
        userId: req.user.id,
      },
    },
    data: {
      lastReadAt: new Date(),
    },
  });

  res.json({
    messages: messages.map((message) => ({
      ...message,
      sender: publicUser(message.sender),
    })),
  });
};

/**
 * Guarda un mensaje nuevo, actualiza la conversación y lo emite en tiempo real
 * a sus integrantes conectados.
 */
export const send = async (req, res) => {
  const conversationId = parsePositiveBigInt(
    req.params.id,
    "identificador de conversación",
  );

  await assertMember(conversationId, req.user.id);

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: req.user.id,
      content: req.body.content,
    },
    include: {
      sender: true,
    },
  });

  await prisma.conversation.update({
    where: {
      id: conversationId,
    },
    data: {
      updatedAt: new Date(),
    },
  });

  const recipients = await prisma.conversationMember.findMany({
    where: {
      conversationId,
      leftAt: null,
      userId: {
        not: req.user.id,
      },
    },
  });

  const publicMessage = {
    ...message,
    sender: publicUser(message.sender),
  };
  const io = req.app.get("io");

  io?.to(`conversation:${conversationId}`).emit("message:new", publicMessage);

  for (const recipient of recipients) {
    await createNotification(
      {
        userId: recipient.userId,
        actorId: req.user.id,
        type: "NEW_MESSAGE",
        entityType: "conversation",
        entityId: String(conversationId),
        content: "Te envió un mensaje.",
      },
      io,
    );
  }

  res.status(201).json({
    message: publicMessage,
  });
};

/**
 * Marca como leída una conversación del usuario autenticado.
 */
export const markRead = async (req, res) => {
  const conversationId = parsePositiveBigInt(
    req.params.id,
    "identificador de conversación",
  );

  await assertMember(conversationId, req.user.id);

  await prisma.conversationMember.update({
    where: {
      conversationId_userId: {
        conversationId,
        userId: req.user.id,
      },
    },
    data: {
      lastReadAt: new Date(),
    },
  });

  res.json({
    message: "Conversación marcada como leída.",
  });
};
