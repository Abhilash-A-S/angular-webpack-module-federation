<div align="center">

# ⏱️ TaskFlow

### A Micro-Frontend Task Management Dashboard

**Built with Angular 20 · Webpack Module Federation · IndexedDB · Custom Event Bus**

[![Angular](https://img.shields.io/badge/Angular-20-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev)
[![Webpack](https://img.shields.io/badge/Webpack_Module_Federation-5-8DD6F9?style=for-the-badge&logo=webpack&logoColor=black)](https://webpack.js.org/concepts/module-federation/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

---

*TaskFlow is a production-grade micro-frontend application demonstrating real-world Webpack Module Federation architecture. Four independently deployable Angular applications compose into a single, cohesive task management dashboard — communicating entirely through a decoupled Custom Event bus and persisting all state to IndexedDB.*

</div>

---

## 📋 Table of Contents

- [Architecture Overview](#-architecture-overview)
- [Micro-Frontend Breakdown](#-micro-frontend-breakdown)
- [Event Bus Protocol](#-event-bus-protocol)
- [Data Persistence](#-data-persistence)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Development](#-development)
- [Build](#-build)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🏗 Architecture Overview

TaskFlow follows a **host-remote micro-frontend pattern** using [Webpack Module Federation](https://webpack.js.org/concepts/module-federation/). Each micro-frontend (MFE) is a standalone Angular application with its own build pipeline, independently deployable, and composed at runtime by the host shell.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        HOST-APP (Shell)                             │
│                       http://localhost:4200                          │
│                                                                     │
│  ┌─────────────────────────────┐  ┌──────────────────────────────┐  │
│  │       TODO-APP (Remote)     │  │     CLOCK-APP (Remote)       │  │
│  │     http://localhost:4203   │  │   http://localhost:4201       │  │
│  │                             │  │                              │  │
│  │  • Task CRUD               │  │  • Live digital clock        │  │
│  │  • Due-time evaluation     │  │  • Clock-tick event emitter  │  │
│  │  • Reschedule +5m          │  │  • Alert banner (dynamic)    │  │
│  │  • Critical priority flags │  │                              │  │
│  └──────────┬──────────────────┘  └──────────┬───────────────────┘  │
│             │                                │                      │
│             │    window.CustomEvent Bus       │                      │
│             │  ┌──────────────────────────┐   │                      │
│             └──► taskflow:clock-tick      ◄───┘                      │
│                │ taskflow:task-alert      │                          │
│                │ taskflow:state-mutation  │                          │
│             ┌──► (decoupled contract)    ◄───┐                      │
│             │  └──────────────────────────┘   │                      │
│  ┌──────────┴──────────────────┐              │                      │
│  │    HISTORY-APP (Remote)     │──────────────┘                      │
│  │   http://localhost:4202     │                                     │
│  │                             │                                     │
│  │  • Chronological audit log  │                                     │
│  │  • Real-time event capture  │                                     │
│  └─────────────────────────────┘                                     │
└─────────────────────────────────────────────────────────────────────┘
```

> **Zero shared runtime state.** Every MFE operates independently. Cross-MFE communication is achieved exclusively through `window.CustomEvent` — no shared services, no shared NgModules, no direct imports between remotes.

---

## 📦 Micro-Frontend Breakdown

### `host-app` — Shell & Orchestrator

| Property | Value |
|---|---|
| **Port** | `4200` |
| **Role** | Shell container, layout grid, navigation, remote module loader |
| **Key Component** | `DashboardComponent` — manages tab navigation and MFE composition |

The host dynamically loads remote Angular components at runtime using a generic `RemoteLoaderComponent` that accepts `remoteEntry`, `exposedModule`, and `exportName` inputs.

---

### `todo-app` — Task Management Remote

| Property | Value |
|---|---|
| **Port** | `4203` |
| **Exposed Module** | `./TodoWidget` → `TodoWidgetComponent` |
| **Persistence** | IndexedDB (`TaskFlowDB` → `tasks` store) |

**Capabilities:**
- Create tasks with title, date, and time inputs
- Date input guard — blocks past dates (`min=today`)
- Time input guard — blocks past times when today is selected
- Toggle critical priority (🚩 red flag vs. orange flag)
- Mark tasks complete (strikethrough + suppresses due alerts)
- `DUE NOW` badge + orange highlight when task reaches due time
- `Reschedule +5m` — pushes due time forward and clears alert state
- Emits `taskflow:task-alert` and `taskflow:state-mutation` events
- Listens to `taskflow:clock-tick` to evaluate due state every second

---

### `clock-app` — System Clock & Alert Banner Remote

| Property | Value |
|---|---|
| **Port** | `4201` |
| **Exposed Modules** | `./ClockWidget` → `ClockWidgetComponent`, `./Alertbanner` → `AlertBannerComponent` |

**Capabilities:**
- Live digital clock (`HH:mm:ss`) with formatted date display
- Broadcasts `taskflow:clock-tick` every second via `window.CustomEvent`
- `AlertBannerComponent` listens to `taskflow:task-alert` and dynamically displays the due task title
- Auto-clears alert when task is rescheduled or completed (via `taskflow:state-mutation`)

---

### `history-app` — Audit Log Remote

| Property | Value |
|---|---|
| **Port** | `4202` |
| **Exposed Module** | `./HistoryWidget` → `HistoryWidgetComponent` |
| **Persistence** | IndexedDB (`TaskFlowDB` → `history` store) |

**Capabilities:**
- Listens to `taskflow:state-mutation` and logs every task lifecycle event
- Supports action types: `CREATED`, `RESCHEDULED`, `COMPLETED`, `UNCOMPLETED`, `ASSIGNED`
- Formats human-readable audit descriptions (e.g., *"Marked Complete by Alistair Smith"*)
- Visual timeline with chronological entries and completion checkmarks
- Hydrates from IndexedDB on initialization

---

## 📡 Event Bus Protocol

All inter-MFE communication uses `window.CustomEvent`. No coupling between remotes.

### `taskflow:clock-tick`

| Field | Type | Description |
|---|---|---|
| `time` | `string` | Current time in `HH:mm` format |
| `fullTime` | `string` | Current time in `HH:mm:ss` format |
| `date` | `string` | Current date in `YYYY-MM-DD` format |
| `timestamp` | `number` | Unix timestamp (`Date.now()`) |

**Emitter:** `clock-app` (every second)
**Consumers:** `todo-app` (due-state evaluation)

---

### `taskflow:task-alert`

| Field | Type | Description |
|---|---|---|
| `taskId` | `string` | Unique task identifier |
| `title` | `string` | Task title to display in the alert banner |
| `dueTime` | `string` | Task due time in `HH:mm` format |

**Emitter:** `todo-app` (when a task becomes due)
**Consumers:** `clock-app` → `AlertBannerComponent`

---

### `taskflow:state-mutation`

| Field | Type | Description |
|---|---|---|
| `action` | `string` | One of: `CREATED`, `RESCHEDULED`, `COMPLETED`, `UNCOMPLETED`, `ASSIGNED` |
| `taskTitle` | `string` | Title of the affected task |
| `timestamp` | `string` | Time of the mutation in `HH:mm` format |
| `details` | `string` | Human-readable description of the change |

**Emitter:** `todo-app`
**Consumers:** `history-app` (audit log), `clock-app` → `AlertBannerComponent` (banner dismissal)

---

## 💾 Data Persistence

TaskFlow uses **IndexedDB** for client-side persistence via a shared `IndexedDBService` pattern.

```
TaskFlowDB
├── tasks          (keyPath: "id")    — Task objects with due dates, priority, completion state
│   └── Index: dueDate
└── history        (keyPath: "id")    — Audit log entries with action types and timestamps
    └── Index: timestamp
```

### Task Schema

```typescript
interface Task {
  id: string;
  title: string;
  dueDate: string;     // YYYY-MM-DD
  dueTime: string;     // HH:mm
  completed: boolean;
  critical: boolean;
  isDue?: boolean;
}
```

### History Entry Schema

```typescript
interface HistoryEntry {
  id: string;
  timestamp: string;
  taskTitle: string;
  action: 'CREATED' | 'RESCHEDULED' | 'COMPLETED' | 'UNCOMPLETED' | 'ASSIGNED';
  details?: string;
}
```

---

## ✨ Features

| Feature | Description |
|---|---|
| **Micro-Frontend Architecture** | Four independently deployable Angular apps composed at runtime |
| **Webpack Module Federation** | Dynamic remote module loading — no monolithic builds |
| **Decoupled Event Bus** | `window.CustomEvent`-based inter-MFE communication |
| **IndexedDB Persistence** | Offline-capable structured storage with object stores and indexes |
| **Live Clock Broadcast** | Real-time clock ticking at 1-second intervals with event dispatch |
| **Task Due-Time Evaluation** | Automatic `DUE NOW` alerts triggered by clock-tick comparison |
| **Date & Time Guards** | Input validation preventing task creation for past dates/times |
| **Critical Priority System** | Toggle-able priority flags with distinct visual treatment |
| **Reschedule +5m** | One-click task rescheduling that clears alerts and logs to history |
| **Audit Trail** | Every task lifecycle event is captured in a chronological timeline |
| **Dynamic Navigation** | Tab-based view switching across Dashboard, Tasks, Calendar, Reports, History |
| **Dark Theme UI** | Premium dark interface with orange alert accents and blue action highlights |

---

## 🛠 Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| **Angular** | 20.x | Component framework for all MFEs |
| **TypeScript** | 5.8 | Type-safe application logic |
| **Webpack Module Federation** | 5.x | Runtime remote module composition |
| **@angular-architects/module-federation** | 21.x | Angular-specific MF integration |
| **IndexedDB** | Native | Client-side structured data persistence |
| **SCSS** | — | Component-scoped styling |
| **ngx-build-plus** | 20.x | Extended Webpack configuration for Angular CLI |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- **Angular CLI** ≥ 20.x (`npm install -g @angular/cli`)

### Installation

Clone the repository and install dependencies for all four applications:

```bash
git clone https://github.com/Abhilash-A-S/angular-webpack-module-federation.git
cd angular-webpack-module-federation

# Install dependencies for each MFE
cd host-app && npm install && cd ..
cd clock-app && npm install && cd ..
cd history-app && npm install && cd ..
cd todo-app && npm install && cd ..
```

### Running the Application

Start all four applications in separate terminals:

```bash
# Terminal 1 — Clock App (port 4201)
cd clock-app && npm start

# Terminal 2 — History App (port 4202)
cd history-app && npm start

# Terminal 3 — Todo App (port 4203)
cd todo-app && npm start

# Terminal 4 — Host Shell (port 4200) — start LAST
cd host-app && npm start
```

> **⚠️ Important:** Start the remote apps (clock, history, todo) **before** the host app. The host fetches `remoteEntry.js` from each remote at runtime.

Then open your browser at **[http://localhost:4200](http://localhost:4200)**.

### One-Command Start (from host-app)

Alternatively, use the bundled dev server script:

```bash
cd host-app
npm run run:all
```

---

## 📁 Project Structure

```
angular-webpack-module-federation/
│
├── host-app/                          # Shell application (port 4200)
│   ├── src/app/
│   │   ├── dashboard-component/       # Main layout with nav tabs & MFE grid
│   │   └── remote-loader-component/   # Generic dynamic remote component loader
│   ├── webpack.config.js              # Module Federation host config
│   └── angular.json
│
├── todo-app/                          # Task management remote (port 4203)
│   ├── src/app/
│   │   ├── models/
│   │   │   └── task.model.ts          # Task interface definition
│   │   ├── services/
│   │   │   └── idb.service.ts         # IndexedDB service
│   │   └── widgets/todo/
│   │       └── todo.component/        # TodoWidgetComponent (exposed)
│   └── webpack.config.js              # Exposes: ./TodoWidget
│
├── clock-app/                         # Clock & alert remote (port 4201)
│   ├── src/app/widgets/
│   │   ├── clock/clock.component/     # ClockWidgetComponent (exposed)
│   │   └── alert/alert-banner.component/  # AlertBannerComponent (exposed)
│   └── webpack.config.js              # Exposes: ./ClockWidget, ./Alertbanner
│
└── history-app/                       # Audit log remote (port 4202)
    ├── src/app/
    │   ├── models/
    │   │   └── history.model.ts       # HistoryEntry interface definition
    │   ├── services/
    │   │   └── idb.service.ts         # IndexedDB service
    │   └── widgets/history/
    │       └── history.component/     # HistoryWidgetComponent (exposed)
    └── webpack.config.js              # Exposes: ./HistoryWidget
```

---

## 💻 Development

### Dev Server Ports

| Application | Port | URL |
|---|---|---|
| host-app | `4200` | [http://localhost:4200](http://localhost:4200) |
| clock-app | `4201` | [http://localhost:4201](http://localhost:4201) |
| history-app | `4202` | [http://localhost:4202](http://localhost:4202) |
| todo-app | `4203` | [http://localhost:4203](http://localhost:4203) |

### Running Tests

```bash
cd <app-name>
npm test
```

### Adding a New Remote MFE

1. Create a new Angular application with `ng new <name>`
2. Add Module Federation: `ng add @angular-architects/module-federation --project <name> --port <port>`
3. Configure `webpack.config.js` to expose your component
4. Add an `<app-remote-loader>` entry in `host-app`'s dashboard template
5. Define your Custom Event contracts and document them in this README

---

## 🔨 Build

Build each application individually for production:

```bash
cd host-app && npm run build
cd clock-app && npm run build
cd history-app && npm run build
cd todo-app && npm run build
```

Each app outputs to its own `dist/` directory and can be deployed independently to any static hosting provider.

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ using Angular 20 & Webpack Module Federation**

</div>