'use client'
import { useEffect, useState } from 'react'
export function useDevice() {
  const [device, setDevice] = useState<'mobile' | 'pc'>('mobile')
  useEffect(() => {
    const check = () => setDevice(window.innerWidth < 768 ? 'mobile' : 'pc')
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return device
}
