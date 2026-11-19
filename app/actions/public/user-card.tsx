import { clientEntry, on, type Handle } from 'remix/component'

// ---- UserCard, copied unchanged from the README ("Queued Tasks") ----
function UserCard(handle: Handle<{ userId: string }>) {
  let user: { name: string } | undefined
  let error: string | undefined
  let loadedId: string | undefined

  return () => {
    let { userId } = handle.props
    let loading = userId !== loadedId

    if (loading) {
      handle.queueTask(async (signal) => {
        try {
          let response = await fetch(`/api/users/${userId}`, { signal })
          let data = await response.json()
          if (signal.aborted) return
          user = data
          error = undefined
        } catch (caught) {
          if (signal.aborted) return
          error = caught instanceof Error ? caught.message : 'Failed to load user'
        }
        loadedId = userId
        handle.update()
      })
    }

    if (loading) return <p>Loading…</p>
    if (error) return <p role="alert">{error}</p>
    return <p>{user?.name}</p>
  }
}
// ---------------------------------------------------------------------

/** The same card, but it starts a request only when `userId` changes. */
function KeyedUserCard(handle: Handle<{ userId: string }>) {
  let user: { name: string } | undefined
  let error: string | undefined
  let loadedId: string | undefined
  let requestedId: string | undefined
  let controller: AbortController | undefined
  handle.signal.addEventListener('abort', () => controller?.abort())

  return () => {
    let { userId } = handle.props
    let loading = userId !== loadedId

    if (userId !== requestedId) {
      requestedId = userId
      handle.queueTask(async () => {
        controller?.abort()
        if (handle.signal.aborted) return
        let { signal } = (controller = new AbortController())
        try {
          let response = await fetch(`/api/users/${userId}`, { signal })
          let data = await response.json()
          if (signal.aborted) return
          user = data
          error = undefined
        } catch (caught) {
          if (signal.aborted) return
          error = caught instanceof Error ? caught.message : 'Failed to load user'
        }
        loadedId = userId
        handle.update()
      })
    }

    if (loading) return <p>Loading…</p>
    if (error) return <p role="alert">{error}</p>
    return <p>{user?.name}</p>
  }
}

/** Renders the component again every second, following the README's `Clock` example. */
function startClock(handle: Handle, onTick: (now: Date) => void) {
  handle.queueTask(() => {
    if (handle.signal.aborted) return

    let tick = () => {
      onTick(new Date())
      handle.update()
    }
    tick()
    let interval = setInterval(tick, 1000)
    handle.signal.addEventListener('abort', () => clearInterval(interval))
  })
}

/**
 * A page with a live clock and a user switcher in its header, and a user card
 * below. Each clock tick renders the page again, and with it the card, with
 * the same props.
 */
function page(Card: typeof UserCard) {
  return function Page(handle: Handle) {
    let now: Date | undefined
    let userId = '1'
    startClock(handle, (date) => (now = date))

    return () => (
      <main>
        <header>
          <time>{now ? now.toLocaleTimeString() : '--:--:--'}</time>{' '}
          {['1', '2'].map((id) => (
            <button
              type="button"
              disabled={id === userId}
              mix={on('click', () => {
                userId = id
                handle.update()
              })}
            >
              User {id}
            </button>
          ))}
        </header>
        <Card userId={userId} />
      </main>
    )
  }
}

export const ReadmePage = clientEntry(`${import.meta.url}#ReadmePage`, page(UserCard))

/** The same page with the card keyed on `userId`. */
export const FixedPage = clientEntry(`${import.meta.url}#FixedPage`, page(KeyedUserCard))
