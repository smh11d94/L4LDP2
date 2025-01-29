"use client";
import { useEffect, useState } from 'react';
import { checkAdminGroups } from './checkAdminGroups';

export default function AdminCheck({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      const groups = await checkAdminGroups();
      setIsAdmin(Array.isArray(groups) && groups.includes('admin'));
      setLoading(false);
    };
    checkAccess();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAdmin) {
    return <div className="flex items-center justify-center h-screen">
      <h1 className="text-2xl font-bold">Access Denied: Admin Only</h1>
    </div>;
  }

  return <>{children}</>;
}