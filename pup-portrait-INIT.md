# SpecMap 2.0 Project Bootstrap
<!-- DRAG THIS FILE INTO YOUR PROJECT FOLDER AND TELL CLAUDE CODE TO READ IT -->

## Instructions for Claude Code

Read this entire file, then execute the setup steps below. This initializes a project with SpecMap 2.0 tracking for bulletproof AI-assisted development.

---

## PROJECT DEFINITION

**Project Name:** Pup Portrait

**Description:** 
An AI-powered mobile app for dog owners that uses image recognition to identify dog breeds, provides personalized care recommendations, tracks health and activities, and connects owners with local pet services. The app learns from user interactions to provide increasingly personalized advice.

**Tech Stack:**
- Framework: React Native with Expo
- Backend: Python FastAPI
- Database: PostgreSQL with Prisma
- AI/ML: OpenAI Vision API for breed detection, Claude for care recommendations
- Key Libraries: React Navigation, Zustand (state), TailwindCSS (NativeWind)

**Features Needed:**
1. Dog Breed Identifier - Take/upload photo, AI identifies breed with confidence score
2. Dog Profile Management - Create profiles for each dog with photos, health info, preferences
3. AI Care Advisor - Chat interface for personalized care questions and recommendations
4. Activity Tracker - Log walks, meals, vet visits, medications with reminders
5. Local Services Finder - Find nearby vets, groomers, parks, pet stores with ratings
6. Health Dashboard - Visualize health trends, vaccination schedules, weight tracking

---

## SETUP STEPS FOR CLAUDE

Execute these steps in order:

### Step 1: Create CLAUDE.md

Create `CLAUDE.md` in project root:

```markdown
# Doggie AI

## Overview
AI-powered mobile app for dog owners featuring breed identification, personalized care recommendations, activity tracking, and local service discovery. Built with React Native (Expo) frontend and Python FastAPI backend.

## Architecture
```
doggie-ai/
├── mobile/                 # React Native Expo app
│   ├── app/               # Expo Router screens
│   ├── components/        # Reusable UI components
│   ├── services/          # API calls, AI integrations
│   ├── store/             # Zustand state management
│   └── utils/             # Helpers and constants
├── backend/               # Python FastAPI
│   ├── app/
│   │   ├── api/          # Route handlers
│   │   ├── models/       # Database models
│   │   ├── services/     # Business logic, AI calls
│   │   └── core/         # Config, auth, middleware
│   └── tests/
└── shared/                # Shared types/constants
```

## Commands
```bash
# Mobile
cd mobile && npx expo start          # Dev server
cd mobile && npm test                 # Run tests
cd mobile && npx expo build           # Production build

# Backend  
cd backend && uvicorn app.main:app --reload   # Dev server
cd backend && pytest                           # Run tests
cd backend && alembic upgrade head             # Migrations
```

## Workflow
1. Read progress.md → find active task
2. Implement until tests pass
3. Update progress.md with 🟢 entry + bullets
4. Update feature status table
5. If feature complete → commit → update features.json
6. Set next active task

## Standards
- TypeScript strict mode for mobile
- Python type hints required
- React functional components with hooks
- Tests before marking complete
- Commits: feat(XXX): description

## Critical Rule
> **Update progress.md after EVERY completed action. No exceptions.**
```

### Step 2: Create features.json

Create `features.json`:

```json
{
  "project": "Doggie AI",
  "version": "0.1.0",
  "features": [
    {
      "id": "001",
      "name": "Dog Breed Identifier",
      "description": "Take or upload photo, AI identifies breed with confidence score",
      "priority": "high",
      "requirements": [
        "Camera access and photo capture",
        "Photo library upload option",
        "OpenAI Vision API integration for breed detection",
        "Display breed name, confidence %, and breed info",
        "Save identified breed to dog profile"
      ],
      "tests": [
        { "name": "Camera permission requested and handled", "passing": false },
        { "name": "Photo can be captured from camera", "passing": false },
        { "name": "Photo can be selected from library", "passing": false },
        { "name": "Photo sent to API returns breed data", "passing": false },
        { "name": "Breed results displayed correctly", "passing": false }
      ],
      "status": "pending",
      "files": [],
      "completed_at": null
    },
    {
      "id": "002",
      "name": "Dog Profile Management",
      "description": "Create and manage profiles for each dog",
      "priority": "high",
      "requirements": [
        "Create new dog profile with name, breed, age, weight",
        "Upload and display dog photos",
        "Edit existing profile information",
        "Delete dog profile with confirmation",
        "Support multiple dogs per user account"
      ],
      "tests": [
        { "name": "Can create new dog profile", "passing": false },
        { "name": "Can upload profile photo", "passing": false },
        { "name": "Can edit profile fields", "passing": false },
        { "name": "Can delete profile with confirmation", "passing": false },
        { "name": "Multiple profiles display in list", "passing": false }
      ],
      "status": "pending",
      "files": [],
      "completed_at": null
    },
    {
      "id": "003",
      "name": "AI Care Advisor",
      "description": "Chat interface for personalized care questions",
      "priority": "high",
      "requirements": [
        "Chat UI with message bubbles",
        "Send questions to Claude API with dog context",
        "Stream responses for better UX",
        "Save chat history per dog",
        "Suggested questions based on dog profile"
      ],
      "tests": [
        { "name": "Chat UI renders correctly", "passing": false },
        { "name": "Message sends and response received", "passing": false },
        { "name": "Response streams to UI", "passing": false },
        { "name": "Chat history persists", "passing": false },
        { "name": "Suggested questions appear", "passing": false }
      ],
      "status": "pending",
      "files": [],
      "completed_at": null
    },
    {
      "id": "004",
      "name": "Activity Tracker",
      "description": "Log walks, meals, vet visits with reminders",
      "priority": "medium",
      "requirements": [
        "Log walk with duration, distance, date",
        "Log meals with food type and amount",
        "Log vet visits with notes and next appointment",
        "Log medications with dosage and schedule",
        "Set reminders with push notifications"
      ],
      "tests": [
        { "name": "Can log a walk activity", "passing": false },
        { "name": "Can log a meal", "passing": false },
        { "name": "Can log vet visit", "passing": false },
        { "name": "Can log medication", "passing": false },
        { "name": "Reminder notification fires", "passing": false }
      ],
      "status": "pending",
      "files": [],
      "completed_at": null
    },
    {
      "id": "005",
      "name": "Local Services Finder",
      "description": "Find nearby vets, groomers, parks with ratings",
      "priority": "medium",
      "requirements": [
        "Get user location with permission",
        "Search nearby pet services by category",
        "Display results on map and list view",
        "Show ratings, reviews, contact info",
        "Save favorite locations"
      ],
      "tests": [
        { "name": "Location permission requested", "passing": false },
        { "name": "Services load for current location", "passing": false },
        { "name": "Map displays service markers", "passing": false },
        { "name": "Service details show correctly", "passing": false },
        { "name": "Can save to favorites", "passing": false }
      ],
      "status": "pending",
      "files": [],
      "completed_at": null
    },
    {
      "id": "006",
      "name": "Health Dashboard",
      "description": "Visualize health trends and schedules",
      "priority": "medium",
      "requirements": [
        "Weight tracking chart over time",
        "Vaccination schedule with due dates",
        "Activity summary (walks per week)",
        "Medication compliance tracking",
        "Health alerts for overdue items"
      ],
      "tests": [
        { "name": "Weight chart renders with data", "passing": false },
        { "name": "Vaccination schedule displays", "passing": false },
        { "name": "Activity summary calculates correctly", "passing": false },
        { "name": "Medication tracking works", "passing": false },
        { "name": "Alerts show for overdue items", "passing": false }
      ],
      "status": "pending",
      "files": [],
      "completed_at": null
    }
  ],
  "decisions": [],
  "blockers": []
}
```

### Step 3: Create progress.md

Create `progress.md`:

```markdown
# Progress Tracker
**Project:** Doggie AI  
**Last Updated:** [INSERT_CURRENT_TIMESTAMP]  
**Current Focus:** Project Setup

---

## 🟡 Active Task
- **Task:** Initialize project structure and SpecMap 2.0 tracking
- **Feature:** Setup
- **Started:** [INSERT_CURRENT_TIMESTAMP]

---

## Session Log

### [INSERT_TODAY'S_DATE]

🟢 **[TIME]** - Initialized SpecMap 2.0 tracking
   - Created CLAUDE.md with project context
   - Created features.json with 6 features defined
   - Created progress.md (this file)
   - Ready to begin feature implementation

---

## Feature Status

| ID | Feature | Status | Tests | Notes |
|----|---------|--------|-------|-------|
| 001 | Dog Breed Identifier | ⚪ | 0/5 | High priority - core feature |
| 002 | Dog Profile Management | ⚪ | 0/5 | High priority - foundation |
| 003 | AI Care Advisor | ⚪ | 0/5 | High priority - key differentiator |
| 004 | Activity Tracker | ⚪ | 0/5 | Medium priority |
| 005 | Local Services Finder | ⚪ | 0/5 | Medium priority |
| 006 | Health Dashboard | ⚪ | 0/5 | Medium priority |

**Legend:** 🟢 Complete | 🟡 In Progress | ⚪ Pending | 🔴 Blocked | 🔵 Review

---

## Blockers
None currently

---

## Key Decisions
To be added as architectural choices are made

---

## Next Up
Initialize React Native project with Expo, then begin Feature 002 (Dog Profile Management) as foundation for other features

---

## Resume Instructions
```
Read this file. Continue from "Active Task" section.
Check "Session Log" for recent context.
Do not repeat completed (🟢) work.
```
```

### Step 4: Initialize Project Structure

```bash
# Create monorepo structure
mkdir -p mobile backend shared

# Initialize React Native with Expo
cd mobile
npx create-expo-app@latest . --template expo-template-blank-typescript

# Initialize FastAPI backend
cd ../backend
mkdir -p app/api app/models app/services app/core tests
touch app/__init__.py app/main.py requirements.txt

# Initialize git
cd ..
git init
git add CLAUDE.md features.json progress.md
git commit -m "chore: Initialize Doggie AI with SpecMap 2.0"
```

### Step 5: Delete This Bootstrap File

After setup is complete, delete this SPECMAP-INIT.md file.

### Step 6: Report Completion

Show me:
1. The created CLAUDE.md
2. Confirmation of features.json creation
3. The initialized progress.md
4. Git commit confirmation
5. Project structure tree

---

## SPECMAP 2.0 RULES (For Reference)

### The One Rule That Matters
> **Update progress.md after EVERY completed action. No exceptions.**

### Progress Entry Format
```markdown
🟢 **HH:MM** - [Completed action in past tense]
   - [Specific detail 1]
   - [Specific detail 2]
   - Tests: X/Y passing
```

### Workflow Loop
```
START TASK → Update progress.md (🟡)
IMPLEMENT  → Write code + tests
COMPLETE   → Add 🟢 entry + update table
FEATURE DONE → Commit + update features.json
REPEAT
```

---

## Ready

Claude, execute Steps 1-6 to initialize Pup Portrait.
