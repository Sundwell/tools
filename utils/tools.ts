export interface Tool {
  id: string
  title: string
  icon: string
  href: string
}

export const tools: Tool[] = [
  {
    id: 'invoice',
    title: 'Invoice Generator',
    icon: '🧾',
    href: '/invoice',
  },
]
