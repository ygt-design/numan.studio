/**
 * Shared helpers for reading Are.na block/channel metadata.
 * Keeps homepage, project detail, tags, and input page in sync.
 */

export const blockTitle = (block) =>
  (block?.title || block?.generated_title || '').trim()

/** Lowercased title with a trailing file extension stripped (Cover.jpg → cover). */
export const normalizeBlockTitle = (blockOrTitle) => {
  const raw =
    typeof blockOrTitle === 'string' ? blockOrTitle : blockTitle(blockOrTitle)
  return raw
    .toLowerCase()
    .trim()
    .replace(/\.[a-z0-9]{1,8}$/i, '')
}

export const isCoverBlock = (block) => normalizeBlockTitle(block) === 'cover'

export const isMetaBlock = (block, name) =>
  normalizeBlockTitle(block) === String(name || '')
    .toLowerCase()
    .trim()

export const extractImageUrl = (block) => {
  const image = block?.image
  if (!image || typeof image !== 'object') return null

  return (
    image.large?.src ||
    image.medium?.src ||
    image.display?.src ||
    image.src ||
    image.small?.src ||
    image.thumb?.src ||
    image.square?.src ||
    image.original?.src ||
    image.large?.url ||
    image.medium?.url ||
    image.original?.url ||
    null
  )
}

export const findCoverBlock = (blocks = []) => {
  const exact = blocks.find(isCoverBlock)
  if (exact && extractImageUrl(exact)) return exact

  const withImage = blocks.find((block) => extractImageUrl(block))
  return withImage || exact || null
}

export const parseBlockTextContent = (block) => {
  if (!block) return ''

  const content = block.content
  if (content && typeof content === 'object' && !Array.isArray(content)) {
    return (content.plain || content.markdown || '').trim()
  }
  if (typeof content === 'string') return content.trim()
  if (block.content_html) {
    return block.content_html.replace(/<[^>]*>/g, '').trim()
  }
  return ''
}

/** Rich HTML/plain text for description-style blocks. */
export const extractTextContent = (block) => {
  if (!block) return ''

  const content = block.content
  const isMarkdownContent =
    content && typeof content === 'object' && !Array.isArray(content)

  let text = ''

  if (isMarkdownContent) {
    text = content.html || content.plain || content.markdown || ''
  } else {
    text =
      block.content_html ||
      (typeof content === 'string' ? content : '') ||
      block.description ||
      ''
  }

  const desc = block.description
  if (!text && desc && typeof desc === 'object' && !Array.isArray(desc)) {
    text = desc.html || desc.plain || desc.markdown || ''
  }

  if (
    text &&
    typeof text === 'string' &&
    !text.startsWith('<') &&
    !(isMarkdownContent && content.html)
  ) {
    const paragraphs = text
      .split(/\n\s*\n/)
      .filter((p) => p.trim())
      .map((p) => `<p>${p.trim()}</p>`)
      .join('')
    text = paragraphs || text.replace(/\n/g, '<br>')
  }

  return text
}

export const isProjectChannel = (channel) => {
  const title = (channel?.title || channel?.slug || '').trim()
  return /^project(\s*\/|\s+|-|_)/i.test(title) || title.startsWith('Project')
}

export const deriveProjectName = (titleOrChannel) => {
  const title =
    typeof titleOrChannel === 'string'
      ? titleOrChannel
      : titleOrChannel?.title || titleOrChannel?.slug || ''
  return title.replace(/^Project\s*\/\s*/i, '').trim() || title
}
