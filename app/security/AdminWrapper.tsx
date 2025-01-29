"use client";
import { ReactNode } from 'react';
import AdminCheck from './AdminCheck';

export const AdminWrapper = ({ children }: { children: ReactNode }) => (
  <AdminCheck>{children}</AdminCheck>
);