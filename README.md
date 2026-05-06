# ⚡ TaskFlow — Team Task Manager

A full-stack web app for managing projects, assigning tasks, and tracking progress with role-based access control.

## 🔗 Links
- **Live URL:** https://artistic-inspiration-production-945c.up.railway.app
- **Backend API:** https://assignment-production-72d5.up.railway.app
- **GitHub:** https://github.com/BhartiSinghal16/Assignment

---

## 🚀 Features
- ✅ JWT Authentication (Signup / Login)
- ✅ Create & manage projects
- ✅ Add team members to projects
- ✅ Create, assign & track tasks with status (Todo / In Progress / Done)
- ✅ Priority levels (Low / Medium / High) and due dates
- ✅ Dashboard with task stats and overdue detection
- ✅ Kanban board view per project
- ✅ Role-based access control (Global Admin / Project Admin / Member)

---

## ⚙️ Tech Stack
| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + React Router |
| Backend | Node.js + Express |
| Database | PostgreSQL + Sequelize ORM |
| Auth | JWT + bcryptjs |
| Deployment | Railway |

---

## 🏗️ Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL running locally

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Fill in your DATABASE_URL and JWT_SECRET in .env
npm run dev
```

### Frontend
```bash
cd frontend
npm install
# Create .env with:
# VITE_API_URL=http://localhost:5000
npm run dev
```

Frontend runs on http://localhost:5173
Backend runs on http://localhost:5000

---

## 🌐 Deploy on Railway

1. Push code to GitHub
2. Go to railway.app → New Project
3. Add PostgreSQL → copy DATABASE_URL
4. Deploy backend → set env vars: DATABASE_URL, JWT_SECRET, NODE_ENV=production
5. Deploy frontend → set VITE_API_URL=https://your-backend.up.railway.app
6. Generate domains for both services ✅

---

## 🔐 Role-Based Access

| Action | Member | Project Admin | Global Admin |
|---|---|---|---|
| View projects | ✅ | ✅ | ✅ |
| Create project | ✅ | ✅ | ✅ |
| Add members | ❌ | ✅ | ✅ |
| Create tasks | ✅ | ✅ | ✅ |
| Update task status | ✅ | ✅ | ✅ |
| Delete tasks | ❌ | ✅ | ✅ |
| Delete project | ❌ | ✅ | ✅ |

---

## 📁 Project Structure
```
task-manager/
├── backend/
│   ├── config/database.js
│   ├── middleware/auth.js
│   ├── models/ (User, Project, Task, ProjectMember)
│   ├── routes/ (auth, projects, tasks, dashboard)
│   └── server.js
└── frontend/
    └── src/
        ├── context/AuthContext.jsx
        ├── pages/ (Login, Signup, Dashboard, Projects, ProjectDetail)
        ├── components/ (Layout)
        └── App.jsx
```
