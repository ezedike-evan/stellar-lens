import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'

/**
 * Allowlist for rendered markdown. Content is repo-authored today, but
 * sanitizing keeps the pipeline safe if docs ever accept external input.
 * We preserve the tags markdown produces plus the heading `id`s and code
 * `class`es this renderer adds.
 */
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    ...sanitizeHtml.defaults.allowedTags,
    'img',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'span',
  ],
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    h1: ['id'],
    h2: ['id'],
    h3: ['id'],
    h4: ['id'],
    h5: ['id'],
    h6: ['id'],
    code: ['class'],
    span: ['class'],
    pre: ['class'],
    a: ['href', 'name', 'target', 'rel'],
  },
}

const contentDir = path.join(process.cwd(), 'content')

function slugify(text: string): string {
  return text
    .replace(/<[^>]+>/g, '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export type DocPage = {
  title: string
  description?: string
  content: string
}

export async function getDocPage(slug: string[]): Promise<DocPage | null> {
  const filePath = path.join(contentDir, ...slug) + '.md'
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data: fm, content } = matter(raw)

  const rawHtml = marked.parse(content, { gfm: true }) as string

  // Inject id attributes into h2–h4 for TOC anchor links
  const withIds = rawHtml.replace(
    /<h([2-4])>(.*?)<\/h[2-4]>/g,
    (_match: string, level: string, inner: string) => {
      const id = slugify(inner)
      return `<h${level} id="${id}">${inner}</h${level}>`
    }
  )

  const html = sanitizeHtml(withIds, SANITIZE_OPTIONS)

  return {
    title: (fm.title as string) || 'Untitled',
    description: fm.description as string | undefined,
    content: html,
  }
}
