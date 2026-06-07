# REBUILD Backend v1.0

Node.js + Express + MySQL backend voor het REBUILD platform.

## Mappenstructuur

rebuild-backend/
├── config/env.js
├── middleware/errorHandler.js
├── middleware/auth.js
├── middleware/isAdmin.js
├── migrations/migrate.js
├── routes/auth.js
├── routes/admin.js
├── routes/health.js
├── services/email.js
├── app.js
├── db.js
└── index.js

## Render deployment

1. Koppel repo aan Render
2. Build command: npm install
3. Start command: npm start
4. Voeg environment variables toe
5. Na eerste deploy: npm run db:migrate via Render Shell
