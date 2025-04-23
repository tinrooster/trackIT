import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, List, FileText, Settings } from 'lucide-react'
import { cn } from "@/lib/utils"
import { UserMenu } from '@/components/UserMenu'
import { useAuth } from '@/contexts/AuthContext'

export function Navigation() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const { isAuthenticated } = useAuth()

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/inventory", label: "Inventory", icon: List },
    { path: "/reports", label: "Reports", icon: FileText },
    { path: "/settings", label: "Settings", icon: Settings }
  ]

  return (
    <nav className="bg-background border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Title */}
          <h2 className="text-lg font-bold">TEd_Inventory Track</h2> 
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {isAuthenticated && navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  location.pathname.startsWith(item.path)
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4 mr-2" />
                {item.label}
              </Link>
            ))}
            
            {/* User Menu */}
            {isAuthenticated && <UserMenu />}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-3 space-y-1">
            {isAuthenticated && navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "block px-3 py-2 rounded-md text-base font-medium",
                  location.pathname.startsWith(item.path)
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center">
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                </div>
              </Link>
            ))}
            
            {/* Mobile User Menu */}
            {isAuthenticated && (
              <div className="px-3 py-2">
                <UserMenu />
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}