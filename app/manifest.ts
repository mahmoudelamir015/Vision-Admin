import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Vision Center',
    short_name: 'Vision',
    description: 'Vision Educational Center Management App',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A2540',
    theme_color: '#0A2540',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
