import { redirect } from 'next/navigation';

// Dashboard content lives at the root route "/".
// This route exists for sidebar link compatibility (/dashboard href).
export default function DashboardRedirectPage() {
  redirect('/');
}
