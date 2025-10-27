"use client"

import { useSession, signOut } from "next-auth/react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export function LogoutButton() {
  const { data: session } = useSession()
  const pathname = usePathname()
  
  // Only show logout button on protected pages when user is logged in
  const protectedPages = ['/', '/invoicing']
  const shouldShowLogout = session && protectedPages.includes(pathname)
  
  if (!shouldShowLogout) {
    return null
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogout}
      className="gap-2"
    >
      <LogOut className="h-4 w-4" />
      Logout
    </Button>
  )
}
