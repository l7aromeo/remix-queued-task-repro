# remix-queued-task-repro

The `UserCard` example from the `remix/component` docs ([Queued Tasks](https://docs.remix.run/api/component/#queued-tasks)) never finishes loading when the component renders again more often than its request takes.

Created with `npx remix@3.2.0 new`, then reduced to one page.

## Run

```sh
npm install
npm run dev
```

Open http://localhost:44100 with the browser's Network panel open.

## What happens

The page has a clock in its header, following the docs' `Clock` example, which renders the page every second. Below it is the docs' `UserCard`, copied unchanged, with `userId="1"`. The API at `/api/users/:id` answers after 1.5 s.

Expected: the card shows `User 1` after about 1.5 s.

Actual: the card shows `Loading…` for as long as the page is open. The Network panel shows a request to `/api/users/1` every second, each cancelled before it completes. The server log shows the same:

```
GET /api/users/1  cancelled by the browser after 994 ms
GET /api/users/1  cancelled by the browser after 999 ms
GET /api/users/1  cancelled by the browser after 1000 ms
```

Each clock tick renders the card again. That render aborts the signal passed to the previous queued task, and the card queues a new request because `userId !== loadedId` is still true.

http://localhost:44100/fixed is the same page with a card that starts a request only when `userId` changes and owns its `AbortController`. It loads after 1.5 s. Switching users with the header buttons still cancels the request for the previous user.

## Files

- `app/actions/public/user-card.tsx`: the docs' `UserCard`, the keyed version, and the page with the clock.
- `app/actions/controller.tsx`: the two pages and the slow `/api/users/:id` route.
