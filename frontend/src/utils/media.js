export const getUploadUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const normalized = path.replace(/\\/g, '/');
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
};
