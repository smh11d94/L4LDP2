// app/course-management/page.tsx
"use client";

import CourseManagement from '@/app/components/course-management/CourseManagement';
import { AdminWrapper} from '../security/AdminWrapper';
import Navigation from '../components/Navigator/Navigation';
import "./app.css";
export default function CourseManagementPage() {
  return (
    <AdminWrapper>
      <div>
        <Navigation />
      </div>
      <CourseManagement />
    </AdminWrapper>
  );
}