export type DocItem = {
  title: string
  href: string
}

export type DocSection = {
  title: string
  items: DocItem[]
}

import { referenceItems } from './reference-routes'

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
    title: 'Guides',
    items: [
      { title: 'Core Concepts', href: '/docs/guides/core-concepts' },
      { title: 'Resilient RPC Routing', href: '/docs/guides/resilient-routing' },
      { title: 'Simulating & Submitting Transactions', href: '/docs/guides/simulating-transactions' },
      { title: 'Handling Failed Transactions', href: '/docs/guides/handling-errors' },
      { title: 'Networks', href: '/docs/guides/networks' },
      { title: 'Stability & Versioning', href: '/docs/guides/versioning' },
    ],
  },
  {
    title: 'Modules',
    items: [
      { title: 'RpcClient', href: '/docs/api/rpc-client' },
      { title: 'RpcRouter', href: '/docs/api/rpc-router' },
      { title: 'Transaction Simulation', href: '/docs/api/transaction-simulation' },
      { title: 'XDR Error Decoding', href: '/docs/api/error-decoding' },
      { title: 'Error Reference', href: '/docs/api/error-reference' },
    ],
  },
  {
    title: 'API Reference',
    items: referenceItems,
  },
]

export const allDocPages: DocItem[] = docSections.flatMap((s) => s.items)
