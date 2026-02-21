'use client' 

import { SignIn, useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function Page() {

  const { userId } = useAuth()
  const router = useRouter()

  if (userId) {
    router.push('/dashboard')
  }

  return <div className='flex justify-center min-h-screen mt-20'><SignIn /></div> 
}