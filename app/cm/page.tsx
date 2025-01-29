"use client";

import CourseManagement from '@/app/components/course-management';
import { AdminWrapper

 } from '../security/AdminWrapper';
export default function CourseManagementPage() {
  return <AdminWrapper><CourseManagement /></AdminWrapper>;
}