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
const MAX_TOTAL_BYTES = 100 * 1024 * 1024
const MAX_FILES = 10
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

async function readRawBody(req) {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

async function parseFormData(req) {
  const buffer = await readRawBody(req)
  if (buffer.length > MAX_TOTAL_BYTES + 1024 * 1024) {
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

function appUrl() {
  return process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'https://vek-site.vercel.app'
}

function downloadLink(pathname) {
  return `${appUrl()}/api/download-file?pathname=${encodeURIComponent(pathname)}`
}

async function sendMail({ name, company, phone, email, message, uploadedFiles }) {
  const to = process.env.REQUEST_EMAIL_TO
  const from = process.env.REQUEST_EMAIL_FROM
  const apiKey = process.env.RESEND_API_KEY
  if (!to || !from || !apiKey) {
    throw new Error('email_not_configured')
  }

  const sentAt = new Date().toLocaleString('ru-RU', {
    timeZone: 'Europe/Moscow',
  })

  const fileBlock =
    uploadedFiles.length === 0
      ? 'Файлы не приложены'
      : uploadedFiles
          .map(
            (file, index) =>
              [
                `Файл ${index + 1}`,
                `Название: ${file.name}`,
                `Размер: ${file.sizeLabel}`,
                `Ссылка на скачивание файла: ${file.downloadLink}`,
                file.pathname ? `Путь файла: ${file.pathname}` : '',
              ]
                .filter(Boolean)
                .join('\n'),
          )
          .join('\n\n')

  const text = [
    'Заявка на расчёт изготовления детали — сайт ООО ВЕК',
    '',
    `Имя: ${name || '—'}`,
    `Компания: ${company || '—'}`,
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
    console.error('send-request: Resend error', {
      name: error.name,
      message: error.message ? String(error.message).slice(0, 180) : undefined,
    })
    throw new Error('email_send_failed')
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
            access: 'private',
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
    const binaryFiles = [...formData.getAll('files'), ...formData.getAll('file')].filter(
      (item) => item && typeof item === 'object' && typeof item.arrayBuffer === 'function' && item.size > 0,
    )

    const metaPathnames = formData.getAll('blobPathname').map((item) => clean(item, 400)).filter(Boolean)
    const metaNames = formData.getAll('fileName').map((item) => clean(item, 180))
    const metaSizes = formData.getAll('fileSize').map((item) => Number(item) || 0)

    const uploadedFiles = []

    if (binaryFiles.length > 0) {
      const total = binaryFiles.reduce((sum, file) => sum + file.size, 0)
      if (binaryFiles.length > MAX_FILES || total > MAX_TOTAL_BYTES) {
        json(res, 413, { ok: false, error: 'file_too_large' })
        return
      }

      for (const uploaded of binaryFiles) {
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

        uploadedFiles.push({
          name: originalName,
          sizeLabel: formatSize(uploaded.size),
          downloadLink: downloadLink(blob.pathname),
          pathname: blob.pathname,
        })
      }
    } else if (metaPathnames.length > 0) {
      const total = metaSizes.reduce((sum, size) => sum + size, 0)
      if (metaPathnames.length > MAX_FILES || total > MAX_TOTAL_BYTES) {
        json(res, 413, { ok: false, error: 'file_too_large' })
        return
      }

      for (let i = 0; i < metaPathnames.length; i += 1) {
        const pathname = metaPathnames[i]
        const fileName = metaNames[i] || 'файл'
        const fileSize = metaSizes[i] || 0

        if (!pathname.startsWith('requests/') || pathname.includes('..') || (fileName && !isAllowedFilename(fileName))) {
          json(res, 400, { ok: false, error: 'unsupported_file_type' })
          return
        }
        if (fileSize > MAX_FILE_BYTES) {
          json(res, 413, { ok: false, error: 'file_too_large' })
          return
        }

        uploadedFiles.push({
          name: fileName,
          sizeLabel: formatSize(fileSize),
          downloadLink: downloadLink(pathname),
          pathname,
        })
      }
    }

    await sendMail({ name, company, phone, email, message, uploadedFiles })
    json(res, 200, { ok: true })
  } catch (error) {
    const message = String(error?.code || error?.message || '')
    if (message.includes('file_too_large') || message.includes('maximumSizeInBytes') || message.includes('too large')) {
      json(res, 413, { ok: false, error: 'file_too_large' })
      return
    }
    console.error('send-request failed', {
      name: error?.name,
      message: message ? String(message).slice(0, 180) : undefined,
    })
    json(res, 500, { ok: false, error: 'send_failed' })
  }
}
