import { useSelector } from 'react-redux';

export const useAuth = () => useSelector((state) => state.auth);

export const useRole = () => {
  const { user } = useAuth();
  return user?.role_slug || user?.roleSlug;
};

export const isSuperAdmin = (user) => user?.role_slug === 'super_admin' || user?.roleSlug === 'super_admin';
export const isDealer = (user) => user?.role_slug === 'dealer' || user?.roleSlug === 'dealer';
