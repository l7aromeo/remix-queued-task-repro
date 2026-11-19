import { get, route } from 'remix/routes'

export const routes = route({
  assets: get('/assets/*path'),
  home: '/',
  fixed: '/fixed',
  user: get('/api/users/:id'),
})
