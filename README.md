# VaultX – Vaulting Scoring App

**Thesis Project (BSc)**

- **Student:** Bence Dániel
- **Class:** Computer Science (Programtervező Informatikus)

## Project Overview
VaultX is a scoring system for **equestrian vaulting** (lovastorna), a sport that combines elements of riding, gymnastics, and dance. Vaulters perform compulsory and freestyle exercises on a horse moving on a lunge line. The sport is regulated by the **FEI (Fédération Equestre Internationale)**, which defines competition rules, the judging system, and official procedures.

Scoring is complex and is based on three main criteria:
- **Horse performance and movement quality**
- **Technical execution of vaulting exercises**
- **Overall impression and artistic value**

This complexity increases with multiple disciplines (Individual, Pas-de-Deux, Team) and test types (Compulsory, Free Test, Technical Test), each evaluated with distinct criteria and weightings.

### Goal of the Project
This thesis develops a **Vaulting Scoring App** that supports judges, scribes, and organizers by digitalizing the scoring workflow. The core goals are:
- **Digitalized scoring logic** aligned with FEI rules
- **Real‑time score calculation and publication**
- **Reliable data capture** to minimize human error
- **Data storage and later analysis** (e.g., athlete progress, judge statistics)

Additional ecosystem modules (e.g., steward app, administration, horse welfare and safety protocols) are part of the broader **VaultX ecosystem**, but the thesis focuses primarily on the scoring system.

## Scoring Module Requirements
The scoring module must support:
- Multiple categories (Individual, Team, Pas‑de‑Deux)
- Multiple tests (Compulsory, Free Test, Technical Test)
- Different judge roles (Horse score, Exercise score, Artistic score)
- Real‑time calculation and publication of results
- Rule‑based weightings (e.g., Compulsory: Horse 25%, Exercise 75%)
- Error‑free data entry
- Exportable data for FEI reporting

## Technology Stack
- **Node.js + Express** (application server)
- **MongoDB + Mongoose** (database)
- **EJS + express-ejs-layouts** (server‑rendered UI)
- **Bootstrap 5 + Bootstrap Icons** (UI styling)
- **Winston** (structured logging)
- **JWT + Sessions** (authentication and session management)

## Project Structure
```
.
├── app.js                 # Application entry point
├── config/                # Configuration constants
├── controllers/           # Route controllers
├── DataServices/          # Database access layer
├── LogicServices/         # Scoring and calculation logic
├── middleware/            # Validation, auth, error handling
├── models/                # Mongoose models
├── routes/                # Express routes
├── static/                # Static assets (CSS, JS, images)
├── views/                 # EJS templates
├── logger.js              # Winston logging configuration
└── database/              # DB connection setup
```

## Setup & Run
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Create .env file** (see below)
3. **Run the app**
   ```bash
   npm start
   ```

## Environment Variables
The following variables are required in `.env`:
- `MONGODB_URI` – MongoDB connection string
- `PORT` – HTTP port
- `SECRET_ACCESS_TOKEN` – JWT signing secret
- `SECRET_API_KEY` – Session secret
- `SECURE_MODE` – `true|false` (cookie security)
- `TESTDB` – `true|false` (test database toggle)

## Notes
- The app uses a global middleware to inject **selected event**, **alerts**, and **version** info into views.
- Logging is centralized through Winston with environment‑aware levels.
- EJS templates use a shared layout in `views/layouts/layout.ejs`.

## License
This project is part of a university thesis and currently has no public license specified.
