export type DocItem = {
  title: string
  href: string
}

export type DocSection = {
  title: string
  items: DocItem[]
}

export const docSections: DocSection[] = [
  {
    title: 'Getting Started',
    items: [
      { title: 'Introduction', href: '/docs/getting-started/introduction' },
      { title: 'Installation', href: '/docs/getting-started/installation' },
      { title: 'Quick Start', href: '/docs/getting-started/quick-start' },
    ],
  },
  {
    title: 'API Reference',
    items: [
      { title: 'RpcClient', href: '/docs/api/rpc-client' },
      { title: 'RpcRouter', href: '/docs/api/rpc-router' },
      { title: 'Transaction Simulation', href: '/docs/api/transaction-simulation' },
      { title: 'XDR Error Decoding', href: '/docs/api/error-decoding' },
    ],
  },
]

export const allDocPages: DocItem[] = docSections.flatMap((s) => s.items)
