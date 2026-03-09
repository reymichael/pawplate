/**
 * PawPlate Service Worker
 * Strategy:
 *   - App shell (HTML, JS, CSS): Cache-first, update in background
 *   - Supabase API: Network-first with cache fallback
 *   - Everything else: Network-first
 */

const CACHE_VERSION = 'pawplate-v1'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`

// App shell assets that get cached on install
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/paw-icon.svg',
]

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(SHELL_ASSETS))
  )
  self.skipWaiting()
})

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => !k.startsWith(CACHE_VERSION))
          .map(k => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET and browser-extension requests
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) return

  // Network-first for Supabase API (auth + data)
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(networkFirst(request, RUNTIME_CACHE))
    return
  }

  // Cache-first for static JS/CSS chunks (immutable hashed filenames)
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  // Network-first with cache fallback for everything else (HTML navigation)
  event.respondWith(networkFirst(request, RUNTIME_CACHE))
})

// ── Strategies ───────────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('Offline', { status: 503 })
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    // Fallback to index.html for navigation requests (SPA routing)
    if (request.mode === 'navigate') {
      const shell = await caches.match('/index.html')
      if (shell) return shell
    }
    return new Response('Offline', { status: 503 })
  }
}
