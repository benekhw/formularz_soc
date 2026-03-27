# SOC Scout Hub v2

Diagnostyczny formularz rekrutacyjny dla kandydatów SOC (Security Operations Center).
Klasyfikuje kandydatów na poziomy L1, L2, L3 i SOC Manager na podstawie 29 pytań w 6 modułach z warunkowym routingiem.

## Quick Start

### Wymagania
- Node.js >= 20
- Google Cloud Project z włączonymi API (Sheets, Gemini, OAuth)
- Pliki `.env` skonfigurowane (patrz [Konfiguracja](#konfiguracja))

### Uruchomienie lokalne

```bash
# 1. Klonowanie
git clone https://github.com/benekhw/formularz_soc.git
cd formularz_soc

# 2. Instalacja zależności
npm install
cd functions && npm install && cd ..

# 3. Konfiguracja (patrz sekcja poniżej)
# Utwórz pliki .env i functions/.env

# 4. Uruchomienie backendu (Terminal 1)
cd functions
npm run dev
# → SOC Scout Hub API running on port 8080

# 5. Uruchomienie frontendu (Terminal 2)
npm run dev
# → http://localhost:5173
```

### Otwieranie aplikacji

Po uruchomieniu obu serwerów:

1. Otwórz **http://localhost:5173** w przeglądarce
2. Wypełnij dane kandydata i kliknij "Rozpocznij formularz"
3. Przejdź przez moduły pytań (M1 → M2 → ... → M6)
4. Po zakończeniu zobaczysz raport kandydata
5. Zakładka "Raport rekrutera" wymaga logowania Google (@bitlife.pl)

## Konfiguracja

### Frontend `.env` (katalog główny)

```env
VITE_API_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=your-oauth-client-id.apps.googleusercontent.com
```

### Backend `functions/.env`

```env
GOOGLE_SHEETS_ID=your-google-sheets-id
GEMINI_API_KEY=your-gemini-api-key
GOOGLE_CLIENT_ID=your-oauth-client-id.apps.googleusercontent.com
ALLOWED_DOMAIN=bitlife.pl
GOOGLE_APPLICATION_CREDENTIALS=./your-service-account-key.json
```

### Wymagane zasoby Google Cloud

| Zasób | Opis |
|---|---|
| Google Sheets API | Baza danych (pytania, odpowiedzi, raporty AI) |
| Gemini API (Generative Language) | Generowanie raportów rekrutacyjnych AI |
| OAuth 2.0 Client ID | Autentykacja rekruterów |
| Service Account | Autoryzacja backendu do odczytu/zapisu w Sheets |

## Google Sheets (backend danych)

Arkusz pełni rolę bazy danych aplikacji. Zawiera 4 zakładki:

| Zakładka | Rola | Link |
|---|---|---|
| **Odpowiedzi** | Auto-zapis odpowiedzi kandydatów | [Otwórz arkusz](https://docs.google.com/spreadsheets/d/18ZW2w2Vw41Q65fPeB1hxBdIz73AcodRLXzPveyfg8jI/edit) |
| **Raporty AI** | Auto-generowane raporty Gemini AI | [Otwórz arkusz](https://docs.google.com/spreadsheets/d/18ZW2w2Vw41Q65fPeB1hxBdIz73AcodRLXzPveyfg8jI/edit#gid=raporty) |
| **Pytania** | Zarządzanie bankiem pytań | [Otwórz arkusz](https://docs.google.com/spreadsheets/d/18ZW2w2Vw41Q65fPeB1hxBdIz73AcodRLXzPveyfg8jI/edit#gid=pytania) |
| **Moduły** | Definicje modułów i progów | [Otwórz arkusz](https://docs.google.com/spreadsheets/d/18ZW2w2Vw41Q65fPeB1hxBdIz73AcodRLXzPveyfg8jI/edit#gid=moduly) |

**Sheets ID:** `18ZW2w2Vw41Q65fPeB1hxBdIz73AcodRLXzPveyfg8jI`

Arkusz jest udostępniony dla Service Account `soc-sheets-writer@soc-scout-hub.iam.gserviceaccount.com` z uprawnieniami Editor.

## Architektura

```
Frontend (React + Vite)          Backend (Express)           Google Cloud
localhost:5173                   localhost:8080
                                                             
┌──────────────┐                ┌──────────────┐            ┌─────────────┐
│  Formularz   │  POST /submit  │  Express     │  write →   │ Google      │
│  kandydata   │ ──────────────→│  API         │ ──────────→│ Sheets      │
└──────────────┘                │              │            └─────────────┘
                                │  7 endpoints │            ┌─────────────┐
┌──────────────┐  GET /report   │              │  call →    │ Gemini      │
│  Panel       │ ──────────────→│  OAuth       │ ──────────→│ 2.5 Flash   │
│  rekrutera   │  (auth req.)   │  middleware   │            └─────────────┘
└──────────────┘                └──────────────┘            ┌─────────────┐
                                                             │ Google      │
                                                             │ OAuth 2.0   │
                                                             └─────────────┘
```

## API Endpoints

| Endpoint | Method | Auth | Opis |
|---|---|---|---|
| `/api/health` | GET | -- | Status konfiguracji |
| `/api/questions` | GET | -- | Pytania z Sheets (cache 1h) |
| `/api/submit` | POST | -- | Zapis odpowiedzi + trigger AI |
| `/api/auth/verify` | POST | -- | Weryfikacja tokenu Google |
| `/api/report/:id` | GET | @bitlife.pl | Raport AI kandydata |
| `/api/candidates` | GET | @bitlife.pl | Lista kandydatów |
| `/api/setup-sheets` | POST | -- | Inicjalizacja nagłówków Sheets |

## Komendy

```bash
npm run dev          # Frontend dev server (port 5173)
npm run build        # Production build
npm run preview      # Preview production build
npx vitest run       # Uruchom testy (26 testów)
npx tsc --noEmit     # TypeScript type check
```

## Stack

**Frontend:** React 19, TypeScript 5.9, Vite 8, Zustand, react-hook-form, react-i18next, @react-oauth/google

**Backend:** Express 4, googleapis, @google/generative-ai (Gemini 2.5 Flash), google-auth-library, dotenv

**Testy:** Vitest 4 (26 testów: scoring, routing, classification, edge cases)

## Bezpieczeństwo

Następujące pliki **nigdy nie powinny trafić do git** (są w `.gitignore`):
- `.env` / `functions/.env` -- zmienne środowiskowe z kluczami API
- `functions/*.json` (poza `package.json`) -- klucz Service Account
- `node_modules/` -- zależności

## Dokumentacja

Pełna dokumentacja techniczna i raport sesji budowy znajdują się w:
- `BAZA WIEDZY/Aktualizacja soc scout hub 27.03/RAPORT_SESJI_27_03_2026.md`
- `analysis/SOC_Scout_Hub_Full_Analysis.md`
