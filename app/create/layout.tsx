import { AdminWrapper } from "../security/AdminWrapper"
import Navigation from '../components/Navigator/Navigation';

export const metadata = {
  title: 'Next.js',
  description: 'Generated by Next.js',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminWrapper> 
    <html lang="en">
    <head><title>Create</title></head>
      <body>
      <div><Navigation /></div>
      {children}</body>
    </html>
    </AdminWrapper>
  )
}
