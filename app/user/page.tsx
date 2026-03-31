"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function User() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to customer sign-in page
    router.replace('/customersignin');
  }, [router]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to login...</p>
      </div>
    </div>
  );
}
