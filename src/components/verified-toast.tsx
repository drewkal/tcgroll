'use client'
import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export function VerifiedToast() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const v = searchParams.get('verified')
    if (!v) return
    if (v === '1')       toast.success('Email verified! 🪙 250 tokens added to your balance.')
    if (v === 'expired') toast.error('Verification link expired — resend from the banner above.')
    if (v === 'error')   toast.error('Verification failed — please try again.')
    router.replace('/cases')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
