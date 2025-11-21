import SignInForm from '@/components/auth/SignInForm'
import { Metadata } from 'next'
import Image from 'next/image'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Login | Milky Way Admin Panel',
  description: 'Sign in to Milky Way Admin Panel',
}

export default function LoginPage() {
  return (
    <div className="flex flex-col justify-center min-h-screen bg-gray-50 dark:bg-gray-950 lg:flex-row">
      {/* Left Side - Login Form */}
      <Suspense
        fallback={<div className="flex flex-1 items-center justify-center">Loading...</div>}
      >
        <SignInForm />
      </Suspense>

      {/* Right Side - Branding/Image */}
      <div className="relative hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-500 to-brand-700">
        <div className="flex items-center justify-center w-full p-12">
          <div className="max-w-md text-white">
            <h2 className="mb-4 text-4xl font-bold">Welcome to Milky Way Admin</h2>
            <p className="text-lg text-white/80">
              Manage your application with our powerful admin dashboard built with TailAdmin V2.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
