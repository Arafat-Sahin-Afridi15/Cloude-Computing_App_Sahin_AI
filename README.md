# AI Cloud Service

**Name:** Arafat Sahin Afridi
**Student ID:** 2026512801

A simple Node.js + Express web service with a functioning AI feature (chat/Q&A powered
by the OpenAI API), built for Assignment 1: "Make a simple Render-based cloud service
that uses AI feature."

## What it does
- Home page shows my name and student ID.
- A text box lets you type a prompt/question.
- The server calls the OpenAI API and returns the AI's answer on the page.

## Project structure
```
ai-cloud-service/
├── public/
│   └── index.html      # home page + AI chat UI
├── server.js            # Express server + /api/ask endpoint
├── package.json
├── .env.example
└── README.md
```

## Step-by-step: how I deployed this to Render

### 1. Get a free Google Gemini API key
1. Go to https://aistudio.google.com/apikey and sign in with a Google account.
2. Click "Create API key" (select or create a project if asked).
3. Copy the key — it's a long string (no special prefix like OpenAI's `sk-`).
4. This uses Google's free tier: no credit card required, generous daily limits
   for a class demo.

### 2. Push the code to GitHub
From inside the `ai-cloud-service` folder:
```bash
git init
git add .
git commit -m "Initial commit: AI cloud service for Assignment 1"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```
(Create an empty repository first at https://github.com/new — don't add a
README/.gitignore there, since this project already has them.)

### 3. Deploy on Render
1. Go to https://render.com and sign up / log in (you can sign in with GitHub).
2. Click **New +** → **Web Service**.
3. Connect your GitHub account and select this repository.
4. Fill in the settings:
   - **Name:** ai-cloud-service (or anything you like)
   - **Region:** closest to you
   - **Branch:** main
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
5. Under **Environment Variables**, click **Add Environment Variable**:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** (paste your Gemini key from Step 1)
6. Click **Create Web Service**.
7. Render will build and deploy automatically. After a minute or two, you'll get a
   live URL like `https://ai-cloud-service-xxxx.onrender.com`.
8. Open that URL — you should see the home page with your name/ID and the AI box working.

### 4. Submit
- Submit the Render live URL and the GitHub repo link to the LMS by 28 September.

## Running locally (optional, to test before deploying)
```bash
npm install
cp .env.example .env
# edit .env and paste your real GEMINI_API_KEY
npm start
# open http://localhost:3000
```

## Notes
- The free Render tier "spins down" after inactivity, so the first request after
  idle time may take ~30–50 seconds to wake up — this is normal.
- Never commit your real API key. `.env` is already excluded via `.gitignore`.

## Database (chat history)
Every question + AI answer is saved to a database and shown in the **Saved History** panel
(reuse / copy / delete / export JSON). Each visitor only sees their own history.

- **Locally:** nothing to set up — it uses a SQLite file at `data/app.db`.
- **On Render:** use PostgreSQL (SQLite files are wiped on every redeploy on the free tier).
  1. Render Dashboard → **New +** → **PostgreSQL** → Free → Create.
  2. Copy its **Internal Database URL**.
  3. Web Service → **Environment** → add `DATABASE_URL` = that URL → save (auto redeploys).
  4. (Optional) add `ADMIN_KEY` = any secret. Then open
     `https://<your-app>.onrender.com/api/admin/history?key=<ADMIN_KEY>` to see ALL rows.
  5. To browse the tables directly, use the database's **External Database URL** with
     `psql`, DBeaver, or pgAdmin. Table: `chats(id, session_id, prompt, response, created_at)`.
- Note: Render's free Postgres expires after ~30 days.
