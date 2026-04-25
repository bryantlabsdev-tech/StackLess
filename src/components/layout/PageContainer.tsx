import type { ReactNode } from 'react'

export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-full space-y-6 pb-4 md:max-w-7xl md:space-y-8 md:pb-10">
      {children}
    </div>
  )
}
