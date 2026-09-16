import type { PropsWithChildren } from 'react'
import { Banner } from './Banner'

export function RootLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-screen flex-col">
      <Banner />
      <main className="mx-auto mt-10 w-full max-w-[1200px] px-4 sm:px-6 md:px-8">{children}</main>
    </div>
  )
}
