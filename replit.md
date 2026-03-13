# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5 + express-session
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Frontend**: React + Vite + Tailwind CSS + React Query

## Application: Контроль посещаемости обучающихся (EdControl)

A full-stack web application for tracking student attendance at educational institutions.

### Features
- Authentication (admin/teacher roles, session-based)
- Groups management (student groups with specialty and year)
- Students management (linked to groups)
- Subjects/Disciplines management
- Lessons management (lecture, practice, lab, seminar types)
- Attendance tracking per lesson (present, absent, late, excused statuses)
- Reports with attendance matrix per group/subject
- Dashboard with statistics

### Demo Credentials
- Admin: `admin` / `admin123`
- Teacher (Иванова): `ivanova` / `teacher123`
- Teacher (Петров): `petrov` / `teacher123`

### Demo Data
- 3 groups: ИС-21, ПО-22, СА-21
- 12 students distributed across groups
- 4 subjects: Базы данных, Программирование, Сетевые технологии, Операционные системы
- 3 sample lessons with attendance records for ИС-21

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server (auth, CRUD, reports)
│   └── attendance/         # React+Vite frontend (EdControl)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## DB Schema Tables
- `users` — system users (admins and teachers)
- `groups` — student groups
- `students` — students linked to groups
- `subjects` — disciplines/subjects linked to teachers
- `lessons` — class sessions (date, topic, type, group, subject)
- `attendance` — attendance records per student per lesson

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`.

- Run `pnpm run typecheck` for full check
- Run `pnpm --filter @workspace/api-spec run codegen` to regenerate API client
- Run `pnpm --filter @workspace/db run push` to push schema changes

## API Routes

All under `/api`:
- `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- `GET/POST /groups`, `GET/PUT/DELETE /groups/:id`
- `GET/POST /students`, `GET/PUT/DELETE /students/:id`
- `GET/POST /subjects`, `PUT/DELETE /subjects/:id`
- `GET/POST /lessons`, `GET/PUT/DELETE /lessons/:id`
- `GET/POST /attendance`
- `GET /reports/group/:groupId`
- `GET /reports/stats`
