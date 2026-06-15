# Deploying Neha's GlamUp Backend to Render

Step-by-step guide to deploy the Node.js backend (admin dashboard + API) to Render's free tier.

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
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/nehas-glamup.git
git push -u origin main
```

---

## Step 2: Create Render Web Service

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **"New" → "Web Service"**
3. Connect your GitHub repository
4. Configure:

   | Setting           | Value                          |
   | ----------------- | ------------------------------ |
   | **Name**          | `nehas-glamup`                 |
   | **Region**        | Singapore (closest to India)   |
   | **Branch**        | `main`                         |
   | **Runtime**       | Node                           |
   | **Build Command** | `npm install`                  |
   | **Start Command** | `npm start`                    |
   | **Instance Type** | Free                           |

---

## Step 3: Set Environment Variables

In Render dashboard → Your service → **Environment**, add:

| Variable         | Value                                          |
| ---------------- | ---------------------------------------------- |
| `ADMIN_PASSCODE` | Your secret admin password (change from default!) |
| `PORT`           | `10000` (Render's default)                     |
| `NODE_ENV`       | `production`                                   |

---

## Step 4: Deploy

1. Click **"Create Web Service"**
2. Render will automatically build and deploy
3. Wait for the status to show **"Live"**
4. Your backend URL will be: `https://nehas-glamup.onrender.com`

---

## Step 5: Access Your Admin Panel

- **Admin Dashboard**: `https://nehas-glamup.onrender.com/admin.html`
- **Live Website**: `https://nehas-glamup.onrender.com/`
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

---

## Troubleshooting

| Problem              | Solution                                                                 |
| -------------------- | ------------------------------------------------------------------------ |
| **Build fails**      | Check that `package.json` has all dependencies listed                    |
| **Server crashes**   | Check Render logs for errors                                             |
| **Images not loading** | Ensure image paths use relative URLs (e.g., `assets/uploads/...`)      |
