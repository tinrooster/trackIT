export interface ApplicationModule {
  id: string
  label: string
  title: string
  description: string
  to: '/inventory' | '/reports' | '/settings'
}

export const applicationModules = [
  {
    id: 'inventory',
    label: 'Inventory',
    title: 'Inventory Management',
    description: 'Track and manage all your equipment and assets',
    to: '/inventory',
  },
  {
    id: 'reports',
    label: 'Reports',
    title: 'Reports',
    description: 'Generate insights and track inventory metrics',
    to: '/reports',
  },
  {
    id: 'settings',
    label: 'Settings',
    title: 'Settings',
    description: 'Configure application settings and preferences',
    to: '/settings',
  },
] as const satisfies ReadonlyArray<ApplicationModule>
