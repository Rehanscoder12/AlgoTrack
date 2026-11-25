const YOUTUBE_ID = /^[\w-]{11}$/
const VIMEO_ID = /^\d+$/

export function getVideoSource(value) {
  let url
  try {
    url = new URL(value)
  } catch {
    return { type: 'unsupported' }
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return { type: 'unsupported' }
  }

  const host = url.hostname.toLowerCase()
  const parts = url.pathname.split('/').filter(Boolean)

  if (host === 'youtu.be') {
    const id = parts[0]
    return YOUTUBE_ID.test(id || '')
      ? { type: 'youtube', src: `https://www.youtube-nocookie.com/embed/${id}` }
      : { type: 'unsupported' }
  }

  if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(host)) {
    let id = url.searchParams.get('v')
    if (['shorts', 'embed', 'live'].includes(parts[0])) id = parts[1]
    return YOUTUBE_ID.test(id || '')
      ? { type: 'youtube', src: `https://www.youtube-nocookie.com/embed/${id}` }
      : { type: 'unsupported' }
  }

  if (host === 'youtube-nocookie.com' || host === 'www.youtube-nocookie.com') {
    const id = parts[0] === 'embed' ? parts[1] : ''
    return YOUTUBE_ID.test(id || '')
      ? { type: 'youtube', src: `https://www.youtube-nocookie.com/embed/${id}` }
      : { type: 'unsupported' }
  }

  if (['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'].includes(host)) {
    const videoIndex = parts.indexOf('videos')
    const id = host === 'player.vimeo.com'
      ? (parts[0] === 'video' ? parts[1] : '')
      : (videoIndex >= 0 ? parts[videoIndex + 1] : parts.find(part => VIMEO_ID.test(part)))
    if (!VIMEO_ID.test(id || '')) return { type: 'unsupported' }
    const hash = url.searchParams.get('h') || (parts[videoIndex + 2] || '')
    const privacyHash = /^[\da-f]+$/i.test(hash) ? hash : ''
    return {
      type: 'vimeo',
      src: `https://player.vimeo.com/video/${id}${privacyHash ? `?h=${privacyHash}` : ''}`,
    }
  }

  if (url.pathname.toLowerCase().endsWith('.mp4')) {
    return { type: 'mp4', src: url.href }
  }

  return { type: 'unsupported' }
}
