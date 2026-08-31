# My Personal Dashboard

A small, modern web app that sits on top of your Notion **Main Database** as
a proper frontend. Notion stays your single source of truth; this app is
just a nicer way to look at it and act on it.

```
Browser  →  This server (Express)  →  Notion API  →  Main Database
```

Your Notion secret only ever lives in the server's environment variables.
It is never sent to the browser.

## 1. Get your Notion credentials

1. Go to https://www.notion.so/my-integrations → **New integration** →
   give it a name → copy the **Internal Integration Secret**. That's your
   `NOTION_TOKEN`.
2. Open "Main Database" in Notion → **···** menu (top right) → **Connections**
   → connect the integration you just created. Without this step the API
   calls will fail with a 404, not a permissions error, which is a common
   point of confusion.
3. Your `NOTION_DATABASE_ID` for this workspace's Main Database is:
   `8eb75a8417ef48e09a46639bf7ae6c38`

## 2. Run it locally

```bash
cp .env.example .env
# edit .env and paste in your real NOTION_TOKEN

npm install
npm start
```

Open http://localhost:3000 — you should see today's real tasks.

## 3. Deploy it for free

Any Node host works. Two straightforward free-tier options:

**Render**
1. Push this folder to a GitHub repo (`.env` is already git-ignored).
2. Render → New → Web Service → connect the repo.
3. Build command: `npm install`. Start command: `npm start`.
4. Add `NOTION_TOKEN` and `NOTION_DATABASE_ID` under Environment.

**Railway**
1. Same idea — new project from your GitHub repo.
2. Set the same two environment variables in the project's Variables tab.
3. Railway detects `npm start` automatically.

Either way, never paste your token into the frontend, into a public repo,
or into a client-side `.js` file — only into the host's environment
variable settings.

## How each part maps to your original spec

- **Dynamic "Today"** — the server computes today's date itself
  (`new Date()`), never hardcoded, and asks Notion for tasks whose `Due
  Date` equals that date.
- **Empty state** — if Notion returns zero tasks, the UI shows "Your day is
  clear" instead of an empty list.
- **Categories only shown when populated** — the frontend groups tasks by
  `Category` and simply never renders a group with nothing in it.
- **Real checkboxes** — checking a task sends `PATCH /api/tasks/:id`, which
  updates the actual page's `Completed` and `Status` properties together in
  Main Database, so they can never fall out of sync with each other.
- **Add Task** — the modal's Category → Segment dropdown is populated live
  from your database's actual select options (via `GET /api/meta`), so if
  you add a new segment in Notion later, the form picks it up automatically
  — nothing to edit in the code.
- **One database, no duplicates** — every route reads and writes the same
  `NOTION_DATABASE_ID`. Nothing in this app can create a second database.

## What's next

The Weekly Planner (Saturday → Friday, same database, filtered by whichever
day is selected) is a natural phase 2 on top of this same server — it would
reuse `GET /api/tasks?date=YYYY-MM-DD`, which already supports any date, not
just today.
