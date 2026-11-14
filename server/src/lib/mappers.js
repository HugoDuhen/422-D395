export function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    firstName: row.first_name,
    lastName: row.last_name,
    isAdmin: row.is_admin,
    active: row.active,
    roles: row.roles ?? [],
    createdAt: row.created_at,
  };
}

export function mapRole(row) {
  if (!row) return null;
  return { id: row.id, key: row.key, label: row.label, createdAt: row.created_at };
}

export function mapSportEntry(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    authorId: row.author_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: row.author_first_name ? { firstName: row.author_first_name, lastName: row.author_last_name } : null,
  };
}

export function mapAlbum(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    description: row.description,
    addedById: row.added_by_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    addedBy: row.added_by_first_name ? { firstName: row.added_by_first_name, lastName: row.added_by_last_name } : null,
  };
}
