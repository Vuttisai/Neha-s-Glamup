# Deploying Neha's GlamUp Backend to Render

Step-by-step guide to deploy the Node.js backend (admin dashboard + API) from the `/backend` subfolder to Render's free tier.

---

## Prerequisites

- A GitHub account with the project pushed to a repository
- A Render account (sign up free at [render.com](https://render.com))

---

## Step 1: Push to GitHub

1. Create a new repository on GitHub (e.g., `nehas-glamup`)
2. Push your code:

```bash
git init
git add .
git commit -m "Configure codebase separation"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/nehas-glamup.git
git push -u origin main
```

---

## Step 2: Create Render Web Service

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **"New" → "Web Service"**
3. Connect your GitHub repository
4. Configure the settings:

   | Setting | Value | Description |
   |---|---|---|
   | **Name** | `nehas-glamup` | Service identifier |
   | **Region** | Singapore | Closest region to India |
   | **Branch** | `main` | Production code branch |
   | **Root Directory** | `backend` | **[CRITICAL] Tells Render to build from the /backend subfolder** |
   | **Runtime** | `Node` | Execution environment |
   | **Build Command** | `npm install` | Installs backend dependencies |
   | **Start Command** | `npm start` | Runs the Express server |
   | **Instance Type** | Free | Free tier hosting |

---

## Step 3: Set Environment Variables

In Render dashboard → Your service → **Environment**, add the variables:

| Variable | Value | Purpose |
|---|---|---|
| `GOOGLE_CLIENT_ID` | `298848968214-mgtjrff8lj51b2st8vimemmeomis510d.apps.googleusercontent.com` | Google Cloud OAuth ID |
| `ADMIN_EMAIL` | `sk1779504@gmail.com,another-email@gmail.com` | Comma-separated list of authorized Gmails |
| `PORT` | `10000` (Render's default) | Server port |
| `NODE_ENV` | `production` | Run environment |

---

## Step 4: Deploy

1. Click **"Create Web Service"**
2. Render will automatically build and deploy from the `/backend` folder.
3. Wait for the status to show **"Live"**
4. Your backend URL will be: `https://nehas-glamup.onrender.com`

---

## Step 5: Access Your Admin Panel & Site

- **Admin Dashboard**: `https://nehas-glamup.onrender.com/admin/`
- **Live Website (Served from Render)**: `https://nehas-glamup.onrender.com/`
- **Health Check**: `https://nehas-glamup.onrender.com/api/health`

---

## Important Notes

> [!WARNING]
> **Free Tier Limitations**
> - The server spins down after 15 minutes of inactivity. The first request after spin-down takes ~30 seconds.
> - Uploaded images are stored on the filesystem and will be **lost on redeploy**. For persistent storage, consider upgrading to a paid plan or using Cloudinary for images.

> [!TIP]
> **Custom Domain**
> You can add a custom domain in Render's dashboard under **Settings → Custom Domains**.

> [!NOTE]
> **Auto-Deploy**
> Every push to the `main` branch on GitHub will trigger an automatic redeploy on Render.
