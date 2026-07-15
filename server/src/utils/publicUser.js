/**
 * Elimina información sensible antes de devolver un usuario al cliente.
 */

// Selecciona únicamente campos seguros del usuario para la respuesta pública.
export const publicUser = (u) =>
  u
    ? {
        id: u.id,
        name: u.name,
        lastName: u.lastName,
        studentCode: u.studentCode,
        email: u.email,
        career: u.career,
        cycle: u.cycle,
        profilePicture: u.profilePicture || "",
        coverPicture: u.coverPicture || "",
        bio: u.bio || "",
        verified: u.verified,
        status: u.status,
        entryYear: u.studentCode?.slice(0, 4),
        createdAt: u.createdAt,
      }
    : null;
