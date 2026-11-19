import { createController } from 'remix/router'

import { assets } from '../assets.ts'
import { routes } from '../routes.ts'
import { Document } from './document.tsx'
import { FixedPage, ReadmePage } from './public/user-card.tsx'

/** How long the user API takes to answer, like a slow backend or network. */
const API_LATENCY_MS = 1500

export default createController(routes, {
  actions: {
    async assets(context) {
      return (await assets.fetch(context.request)) ?? new Response('Not Found', { status: 404 })
    },
    home(context) {
      return context.render(
        <Document title="README UserCard">
          <ReadmePage />
        </Document>,
      )
    },
    fixed(context) {
      return context.render(
        <Document title="UserCard keyed on userId">
          <FixedPage />
        </Document>,
      )
    },
    async user({ params, request }) {
      let started = Date.now()
      let aborted = await new Promise<boolean>((resolve) => {
        let timer = setTimeout(() => resolve(false), API_LATENCY_MS)
        request.signal.addEventListener('abort', () => {
          clearTimeout(timer)
          resolve(true)
        })
      })
      let ms = Date.now() - started
      if (aborted) {
        console.log(`GET /api/users/${params.id}  cancelled by the browser after ${ms} ms`)
        return new Response(null, { status: 499 })
      }
      console.log(`GET /api/users/${params.id}  answered after ${ms} ms`)
      return Response.json({ name: `User ${params.id}` })
    },
  },
})
