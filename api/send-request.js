import { put } from '@vercel/blob'
import { handleUpload } from '@vercel/blob/client'
import { Resend } from 'resend'

export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 30,
}

const MAX_FILE_BYTES = 30 * 1024 * 1024
const ALLOWED_EXT = new Set([
  '.pdf',
  '.dwg',
  '.dxf',
  '.step',
  '.stp',
  '.iges',
  '.igs',
  '.jpg',
  '.jpeg',
  '.png',
  '.zip',
  '.rar',
  '.7z',
])
const BLOCKED_EXT = new Set([
  '.exe',
  '.js',
  '.bat',
  '.cmd',
  '.scr',
  '.ps1',
  '.sh',
  '.vbs',
  '.msi',
  '.html',
  '.php',
])

function json(res, status, body) {
  res.status(status).json(body)
}

function clean(value, max = 4000) {
  return String(value || '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim()
    .slice(0, max)
}

function fileExtension(name) {
  const base = String(name || '')
    .split(/[/\\]/)
    .pop()
  const dot = base.lastIndexOf('.')
  return dot >= 0 ? base.slice(dot).toLowerCase() : ''
}

function isAllowedFilename(name) {
  const ext = fileExtension(name)
  if (!ext || BLOCKED_EXT.has(ext) || !ALLOWED_EXT.has(ext)) return false
  const lower = String(name || '').toLowerCase()
  for (const blocked of BLOCKED_EXT) {
    if (lower.includes(`${blocked}.`) || lower.endsWith(blocked)) {
      if (ext === blocked) return false
      if (lower.split('.').some((part) => `.${part}` === blocked)) return false
    }
  }
  return true
}

function safeBasename(name) {
  const base = String(name || 'document')
    .split(/[/\\]/)
    .pop()
    .replace(/[^\w.\-а-яА-ЯёЁ ()]+/g, '_')
    .slice(0, 120)
  return base || 'document'
}

function formatSize(bytes) {
  const n = Number(bytes) || 0
  if (n < 1024) return `${n} Б`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} КБ`
  return `${(n / (1024 * 1024)).toFixed(1)} МБ`
}

function isVercelBlobUrl(url) {
  try {
    const parsed = new URL(url)
    return (
      parsed.protocol === 'https:' &&
      parsed.hostname.endsWith('.blob.vercel-storage.com')
    )
  } catch {
    return false
  }
}

async function readRawBody(req) {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

async function parseFormData(req) {
  const buffer = await readRawBody(req)
  if (buffer.length > MAX_FILE_BYTES + 1024 * 1024) {
    const error = new Error('file_too_large')
    error.code = 'file_too_large'
    throw error
  }
  const request = new Request('http://localhost/api/send-request', {
    method: 'POST',
    headers: {
      'content-type': req.headers['content-type'] || '',
    },
    body: buffer,
    duplex: 'half',
  })
  return request.formData()
}

async function parseJson(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body
  }
  const buffer = await readRawBody(req)
  return JSON.parse(buffer.toString('utf8') || '{}')
}

async function sendMail({ name, company, phone, email, message, fileInfo }) {
  const to = process.env.REQUEST_EMAIL_TO
  const from = process.env.REQUEST_EMAIL_FROM
  const apiKey = process.env.RESEND_API_KEY
  if (!to || !from || !apiKey) {
    throw new Error('email_not_configured')
  }

  const sentAt = new Date().toLocaleString('ru-RU', {
    timeZone: 'Europe/Moscow',
  })

  const fileBlock = fileInfo
    ? [
        `Название файла: ${fileInfo.name}`,
        `Размер файла: ${fileInfo.sizeLabel}`,
        `Ссылка на файл в Vercel Blob: ${fileInfo.url}`,
        fileInfo.pathname ? `Путь файла: ${fileInfo.pathname}` : '',
      ]
        .filter(Boolean)
        .join('\n')
    : 'Файл не приложен.'

  const text = [
    'Заявка на расчёт изготовления детали — сайт ООО ВЕК',
    '',
    `Имя: ${name || '—'}`,
    company ? `Компания: ${company}` : '',
    `Телефон: ${phone || '—'}`,
    `E-mail: ${email || '—'}`,
    '',
    'Описание задачи:',
    message || '—',
    '',
    fileBlock,
    '',
    `Дата и время отправки: ${sentAt} (МСК)`,
  ]
    .filter((line, index, arr) => !(line === '' && arr[index - 1] === ''))
    .join('\n')

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from,
    to,
    subject: 'Заявка на расчёт изготовления детали — сайт ООО ВЕК',
    text,
  })
  if (error) {
    throw new Error(error.message || 'email_send_failed')
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    json(res, 405, { ok: false, error: 'method_not_allowed' })
    return
  }

  try {
    const contentType = String(req.headers['content-type'] || '')

    if (contentType.includes('application/json')) {
      const body = await parseJson(req)
      const result = await handleUpload({
        body,
        request: req,
        onBeforeGenerateToken: async (pathname) => {
          if (!isAllowedFilename(pathname)) {
            throw new Error('unsupported_file_type')
          }
          return {
            addRandomSuffix: true,
            maximumSizeInBytes: MAX_FILE_BYTES,
            validUntil: Date.now() + 60 * 60 * 1000,
          }
        },
      })
      json(res, 200, result)
      return
    }

    const formData = await parseFormData(req)
    const name = clean(formData.get('name'), 200)
    const company = clean(formData.get('company'), 200)
    const phone = clean(formData.get('phone'), 80)
    const email = clean(formData.get('email'), 200)
    const message = clean(formData.get('message') || formData.get('comment'), 4000)
    const uploaded = formData.get('file')

    let fileInfo = null

    if (uploaded && typeof uploaded === 'object' && typeof uploaded.arrayBuffer === 'function' && uploaded.size > 0) {
      const originalName = clean(uploaded.name, 180)
      if (!isAllowedFilename(originalName)) {
        json(res, 400, { ok: false, error: 'unsupported_file_type' })
        return
      }
      if (uploaded.size > MAX_FILE_BYTES) {
        json(res, 413, { ok: false, error: 'file_too_large' })
        return
      }

      const blob = await put(`requests/${Date.now()}-${safeBasename(originalName)}`, uploaded, {
        access: 'private',
        addRandomSuffix: true,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      })

      fileInfo = {
        name: originalName,
        sizeLabel: formatSize(uploaded.size),
        url: blob.downloadUrl || blob.url,
        pathname: blob.pathname,
      }
    } else {
      const blobUrl = clean(formData.get('blobDownloadUrl') || formData.get('blobUrl'), 1000)
      const fileName = clean(formData.get('fileName'), 180)
      const fileSize = Number(formData.get('fileSize') || 0)
      const pathname = clean(formData.get('blobPathname'), 400)

      if (blobUrl) {
        if (!isVercelBlobUrl(blobUrl) || (fileName && !isAllowedFilename(fileName))) {
          json(res, 400, { ok: false, error: 'unsupported_file_type' })
          return
        }
        if (fileSize > MAX_FILE_BYTES) {
          json(res, 413, { ok: false, error: 'file_too_large' })
          return
        }
        fileInfo = {
          name: fileName || 'файл',
          sizeLabel: formatSize(fileSize),
          url: blobUrl,
          pathname,
        }
      }
    }

    await sendMail({ name, company, phone, email, message, fileInfo })
    json(res, 200, { ok: true })
  } catch (error) {
    const message = String(error?.code || error?.message || '')
    if (message.includes('file_too_large') || message.includes('maximumSizeInBytes') || message.includes('too large')) {
      json(res, 413, { ok: false, error: 'file_too_large' })
      return
    }
    console.error('send-request failed')
    json(res, 500, { ok: false, error: 'send_failed' })
  }
}
