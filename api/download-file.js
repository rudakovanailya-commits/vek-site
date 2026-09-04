import { Readable } from 'node:stream'
import { get } from '@vercel/blob'

export const config = {
  maxDuration: 30,
}

function basename(pathname) {
  const parts = String(pathname || '')
    .split('/')
    .filter(Boolean)
  return parts[parts.length - 1] || 'file'
}

function contentDisposition(filename) {
  const ascii = filename.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_')
  const encoded = encodeURIComponent(filename)
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`
}

function sanitizePathname(raw) {
  if (raw == null) return null
  let value = Array.isArray(raw) ? raw[0] : raw
  if (typeof value !== 'string') return null
  value = value.trim()
  if (!value) return null

  try {
    value = decodeURIComponent(value)
  } catch {
    return null
  }

  if (value.includes('\0')) return null
  value = value.replace(/\\/g, '/')

  if (value.startsWith('/') || value.startsWith('~') || /^[a-zA-Z]:/.test(value)) {
    return null
  }
  if (value.includes('://') || value.includes('..')) {
    return null
  }

  const parts = value.split('/')
  if (parts.some((part) => part === '' || part === '.' || part === '..')) {
    return null
  }

  const normalized = parts.join('/')
  if (!normalized.startsWith('requests/') || normalized === 'requests/') {
    return null
  }

  return normalized
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Метод не поддерживается' })
    return
  }

  const queryPath =
    req.query?.pathname ??
    new URL(req.url || '/', 'http://localhost').searchParams.get('pathname')
  const pathname = sanitizePathname(queryPath)

  if (!pathname) {
    console.error('download-file: invalid pathname')
    res.status(400).json({ error: 'Некорректный путь файла' })
    return
  }

  try {
    const result = await get(pathname, { access: 'private' })

    if (!result || result.statusCode !== 200 || !result.stream) {
      console.error('download-file: blob get failed', {
        pathname,
        status: result?.statusCode ?? 'null',
      })
      res.status(404).json({ error: 'Файл не найден' })
      return
    }

    const type = result.blob?.contentType || 'application/octet-stream'
    res.setHeader('Content-Type', type)
    res.setHeader('Content-Disposition', contentDisposition(basename(pathname)))
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Cache-Control', 'private, no-store')

    const nodeStream = Readable.fromWeb(result.stream)
    nodeStream.on('error', (error) => {
      console.error('download-file: stream error', { pathname, name: error?.name })
      if (!res.headersSent) {
        res.status(500).json({ error: 'Не удалось прочитать файл' })
      } else {
        res.destroy(error)
      }
    })
    nodeStream.pipe(res)
  } catch (error) {
    console.error('download-file: blob get failed', {
      pathname,
      name: error?.name,
      message: error?.message ? String(error.message).slice(0, 180) : undefined,
    })
    res.status(500).json({ error: 'Не удалось скачать файл' })
  }
}
