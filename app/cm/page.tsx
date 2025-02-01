"use client";

import CourseManagement from '@/app/components/course-management';
import { AdminWrapper} from '../security/AdminWrapper';
import Navigation from '../components/Navigator/Navigation';

export default function CourseManagementPage() {
  return <AdminWrapper><div><Navigation /></div><CourseManagement /></AdminWrapper>;
}