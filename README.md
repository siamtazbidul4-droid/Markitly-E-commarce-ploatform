<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/3957566f-ce89-412f-a333-66802bb41483

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env` and fill in the required values, including `MONGODB_URI` and `AUTH_SECRET`.
3. Run the app:
   `npm run dev`

## Deploy to Render

This repository includes a `render.yaml` configuration for a Node.js web service. Connect the repo to Render, set the required environment variables in the service settings, and deploy using the default build and start commands:

- Build: `npm install && npm run build`
- Start: `npm start`

The Express server serves the production client bundle from `dist/` and exposes the API under `/api`.
