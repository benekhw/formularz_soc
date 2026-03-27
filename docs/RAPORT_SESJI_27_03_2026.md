# SOC Scout Hub -- Raport sesji 27.03.2026

**Data:** 27 marca 2026
**Autor sesji:** OpenCode (Claude Opus 4) + Bieniek
**Zakres:** Przebudowa aplikacji SOC Scout Hub z vanilla JS na React + TypeScript + backend Google Cloud

---

## Spis treści

1. [Podsumowanie sesji](#1-podsumowanie-sesji)
2. [Co zostało zbudowane](#2-co-zostało-zbudowane)
3. [Architektura aplikacji](#3-architektura-aplikacji)
4. [Connection strings i konfiguracja](#4-connection-strings-i-konfiguracja)
5. [Stack technologiczny](#5-stack-technologiczny)
6. [Logika biznesowa](#6-logika-biznesowa)
7. [API Endpoints (backend)](#7-api-endpoints-backend)
8. [Struktura Google Sheets](#8-struktura-google-sheets)
9. [Prompt Gemini AI](#9-prompt-gemini-ai)
10. [Google OAuth -- konfiguracja](#10-google-oauth--konfiguracja)
11. [Struktura plików](#11-struktura-plików)
12. [Testy](#12-testy)
13. [Instrukcja uruchomienia](#13-instrukcja-uruchomienia)
14. [Zweryfikowane integracje](#14-zweryfikowane-integracje)
15. [Znane ograniczenia i co dalej](#15-znane-ograniczenia-i-co-dalej)
16. [Discoveries & Gotchas (lekcje z sesji)](#16-discoveries--gotchas-lekcje-z-sesji)
17. [Repozytorium GitHub](#17-repozytorium-github)
18. [Google Sheets -- link do arkusza](#18-google-sheets--link-do-arkusza)
19. [Kontekst dla następnej sesji](#19-kontekst-dla-następnej-sesji)

---

## 1. Podsumowanie sesji

### Punkt wyjścia
Aplikacja SOC Scout Hub istniała jako **vanilla JavaScript SPA** (zero zależności, zero frameworka, zero backendu). Cała logika działała w przeglądarce, dane ginęły po odświeżeniu strony, nie było autentykacji, integracji z bazą danych ani raportu AI. Folder `google-apps-script/` w starym repo był pusty.

### Co zostało zrobione
1. **Pełna przebudowa** na React 19 + TypeScript + Vite 8
2. **Backend Express** z integracją Google Sheets API (zapis/odczyt)
3. **Google Gemini AI** (model `gemini-2.5-flash`) do automatycznego generowania raportów rekrutacyjnych
4. **Google OAuth 2.0** z ograniczeniem do domeny `@bitlife.pl` -- panel rekrutera wymaga logowania
5. **26 testów jednostkowych** (Vitest) pokrywających scoring, routing, classification i edge cases
6. **Pełna dwujęzyczność** PL/EN przez react-i18next
7. **Konfiguracja środowiska** -- pliki `.env`, Service Account, OAuth Client ID -- wszystko podłączone i przetestowane

### Wynik końcowy
Aplikacja działa end-to-end:
- Kandydat wypełnia formularz → widzi raport z klasyfikacją i rekomendacjami
- Odpowiedzi automatycznie trafiają do Google Sheets
- Gemini AI generuje raport rekrutacyjny w tle
- Rekruter loguje się Google (@bitlife.pl) → widzi pełną analitykę + raport AI

---

## 2. Co zostało zbudowane

### Frontend (React + TypeScript)
| Element | Opis |
|---|---|
| Formularz identyfikacyjny | Imię, nazwisko, email, kontynent, kraj (react-hook-form z walidacją) |
| 6 modułów pytań | M1-M6 z warunkowym routingiem, sliderem pewności, opcją skip |
| Stepper nawigacyjny | Sidebar z wizualizacją ścieżki modułów (aktualny, ukończone, odkryte) |
| Raport kandydata | Poziom, wyniki modułów, gap analysis, obszary rozwoju, ścieżka |
| Raport rekrutera | Chroniony Google OAuth. Klasyfikacja, tabela wyników, confidence calibration, sygnały profilowe, motywacja, raport AI |
| Top bar | Brand, przełącznik PL/EN, reset sesji |
| Dark theme | Kompletny system designu z CSS variables |

### Backend (Express / Node.js)
| Element | Opis |
|---|---|
| `/api/submit` | Zapisuje odpowiedzi do Google Sheets + triggeruje Gemini AI |
| `/api/questions` | Pobiera pytania z Sheets (cache 1h) -- fallback do kodu |
| `/api/report/:id` | Zwraca raport AI dla sesji (wymaga auth) |
| `/api/candidates` | Lista kandydatów z Sheets (wymaga auth) |
| `/api/auth/verify` | Weryfikacja tokenu Google OAuth |
| `/api/setup-sheets` | Inicjalizacja nagłówków arkuszy |
| `/api/health` | Health check statusu konfiguracji |

### Logika biznesowa (TypeScript)
| Moduł | Opis |
|---|---|
| `scoring.ts` | Ocenianie odpowiedzi, walidacja, budowanie wyników modułów |
| `routing.ts` | Warunkowe przechodzenie między modułami (gate thresholds) |
| `classification.ts` | 7-poziomowa klasyfikacja (preL1 → manager), gap analysis, confidence calibration, profile signals |
| `assessment.ts` | Agregacja wszystkich analiz w jeden obiekt Assessment |

---

## 3. Architektura aplikacji

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                    │
│                      localhost:5173                           │
│                                                              │
│  ┌──────────────┐  ┌───────────────┐  ┌───────────────────┐ │
│  │  Formularz   │  │  Panel        │  │  Panel            │ │
│  │  kandydata   │  │  wyników      │  │  rekrutera        │ │
│  │  (publiczny) │  │  (publiczny)  │  │  (Google OAuth)   │ │
│  └──────┬───────┘  └───────────────┘  └─────────┬─────────┘ │
│         │                                        │           │
│         │  POST /api/submit                      │ GET       │
│         │  (fire-and-forget)                     │ /report   │
└─────────┼────────────────────────────────────────┼───────────┘
          │                                        │
          ▼                                        ▼
┌─────────────────────────────────────────────────────────────┐
│                BACKEND (Express, localhost:8080)              │
│                                                              │
│  ┌──────────────┐  ┌───────────────┐  ┌───────────────────┐ │
│  │ submitAnswers │  │ getQuestions  │  │ getReport         │ │
│  │              │  │ (cache 1h)    │  │ getCandidates     │ │
│  │ → Sheets     │  │ → Sheets      │  │ (requireAuth)     │ │
│  │ → Gemini     │  │ → fallback    │  │ → Sheets          │ │
│  └──────┬───────┘  └───────┬───────┘  └───────────────────┘ │
│         │                  │                                  │
└─────────┼──────────────────┼──────────────────────────────────┘
          │                  │
          ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                     GOOGLE CLOUD                             │
│                                                              │
│  ┌──────────────┐  ┌───────────────┐  ┌───────────────────┐ │
│  │ Google       │  │ Google        │  │ Google Gemini     │ │
│  │ Sheets API   │  │ OAuth 2.0    │  │ 2.5 Flash         │ │
│  │              │  │              │  │                   │ │
│  │ Service      │  │ Client ID    │  │ API Key           │ │
│  │ Account auth │  │ @bitlife.pl  │  │ (billing enabled) │ │
│  └──────────────┘  └───────────────┘  └───────────────────┘ │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                   GOOGLE SHEETS                              │
│         ID: 18ZW2w2Vw41Q65fPeB1hxBdIz73AcodRLXzPveyfg8jI    │
│                                                              │
│  Tab 1: "Pytania"      Tab 2: "Moduły"                      │
│  (zarządzanie          (definicje modułów,                   │
│   pytaniami)            progi przejścia)                     │
│                                                              │
│  Tab 3: "Odpowiedzi"   Tab 4: "Raporty AI"                  │
│  (auto-zapis            (auto-generowane                     │
│   po submicie)           przez Gemini)                       │
└─────────────────────────────────────────────────────────────┘
```

### Przepływ danych

```
1. Kandydat otwiera formularz (localhost:5173)
2. Wypełnia dane osobowe → react-hook-form waliduje
3. Przechodzi przez moduły M1→M2→...→M6 (routing warunkowy)
4. Klika "Generuj raport"
5. Frontend:
   a) Oblicza assessment lokalnie (scoring + classification)
   b) Wyświetla raport kandydata natychmiast
   c) Wysyła dane do POST /api/submit (fire-and-forget)
6. Backend:
   a) Zapisuje wiersz do "Odpowiedzi" w Sheets
   b) Asynchronicznie wywołuje Gemini AI
   c) Gemini generuje raport JSON
   d) Backend zapisuje raport do "Raporty AI" w Sheets
7. Rekruter loguje się Google (@bitlife.pl) w zakładce "Rekruter"
8. Frontend fetchuje GET /api/report/:sessionId z tokenem
9. Raport AI wyświetla się w panelu rekrutera
```

---

## 4. Connection strings i konfiguracja

### Identyfikatory i klucze

| Zasób | Wartość | Gdzie używany |
|---|---|---|
| **Google Sheets ID** | `18ZW2w2Vw41Q65fPeB1hxBdIz73AcodRLXzPveyfg8jI` | Backend `.env` |
| **Gemini API Key** | `AIzaSyBshCu73fBsf9PvEHXG10iSAvtTMWdE9lU` | Backend `.env` |
| **OAuth Client ID** | `368352113100-hqte2kvca69vrob574asmmfef8e8tgqk.apps.googleusercontent.com` | Frontend `.env` + Backend `.env` |
| **Service Account email** | `soc-sheets-writer@soc-scout-hub.iam.gserviceaccount.com` | Udostępniony jako Editor w Sheets |
| **Service Account key file** | `functions/soc-scout-hub-e9f052e8ca9b.json` | Backend (GOOGLE_APPLICATION_CREDENTIALS) |
| **Allowed domain** | `bitlife.pl` | Backend `.env` |
| **Gemini model** | `gemini-2.5-flash` | Backend `index.js` |

### Pliki .env

**Frontend** (`soc-scout-hub/.env`):
```
VITE_API_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=368352113100-hqte2kvca69vrob574asmmfef8e8tgqk.apps.googleusercontent.com
```

**Backend** (`soc-scout-hub/functions/.env`):
```
GOOGLE_SHEETS_ID=18ZW2w2Vw41Q65fPeB1hxBdIz73AcodRLXzPveyfg8jI
GEMINI_API_KEY=AIzaSyBshCu73fBsf9PvEHXG10iSAvtTMWdE9lU
GOOGLE_CLIENT_ID=368352113100-hqte2kvca69vrob574asmmfef8e8tgqk.apps.googleusercontent.com
ALLOWED_DOMAIN=bitlife.pl
GOOGLE_APPLICATION_CREDENTIALS=./soc-scout-hub-e9f052e8ca9b.json
```

### Bezpieczeństwo
Następujące pliki **NIGDY nie powinny trafić do git** (są w `.gitignore`):
- `.env`
- `functions/.env`
- `functions/soc-scout-hub-e9f052e8ca9b.json` (klucz Service Account)
- `functions/*.json` (poza package.json)

---

## 5. Stack technologiczny

### Frontend

| Technologia | Wersja | Rola |
|---|---|---|
| React | 19.2 | UI framework |
| TypeScript | 5.9 | Typowanie |
| Vite | 8.0 | Bundler + dev server |
| Zustand | 5.0 | State management |
| react-hook-form | 7.72 | Walidacja formularzy |
| react-i18next | 16.6 | Internacjonalizacja PL/EN |
| @react-oauth/google | 0.13 | Google OAuth login |
| clsx | 2.1 | CSS class utility |
| Vitest | 4.1 | Test framework |

### Backend

| Technologia | Wersja | Rola |
|---|---|---|
| Node.js | >=20 | Runtime |
| Express | 4.21 | HTTP framework |
| googleapis | 144.0 | Google Sheets API |
| @google/generative-ai | 0.21 | Gemini AI |
| google-auth-library | 9.14 | OAuth token verification |
| dotenv | 17.3 | Ładowanie zmiennych .env |
| cors | 2.8 | Cross-origin requests |

### Google Cloud

| Usługa | Rola |
|---|---|
| Google Sheets API | Baza danych (pytania, odpowiedzi, raporty AI) |
| Gemini 2.5 Flash | Generowanie raportów rekrutacyjnych AI |
| Google OAuth 2.0 | Autentykacja rekruterów (@bitlife.pl) |
| IAM Service Account | Autoryzacja backendu do Sheets |

---

## 6. Logika biznesowa

### 6.1 Moduły i pytania

| Moduł | Nazwa | Typ | Pytania | Pkt/pytanie | Max | Próg |
|---|---|---|---|---|---|---|
| M1 | Profil kandydata | Non-technical | 5 | 0 | 0 | Brak |
| M2 | Fundamenty SOC (L1) | Technical | 5 | 3 | 15 | 60% |
| M3 | Analiza incydentów (L2) | Technical | 5 | 5 | 25 | 50% |
| M4 | Threat Hunting (L3) | Technical | 5 | 8 | 40 | 50% |
| M5 | Strategia i zarządzanie (MGR) | Technical | 5 | 8 | 40 | 70% |
| M6 | Samoocena i motywacja | Non-technical | 4 | 0 | 0 | Brak |

**Łącznie: 29 pytań**

### 6.2 Routing warunkowy

```
M1 → zawsze → M2
M2 < 60%     → M6 (koniec, preL1)
M2 >= 60%    → M3
M3 >= 50%    → M4
M3 < 50% + rola=management → M5
M3 < 50% + rola!=management → M6
M4 >= 50%    → M5
M4 < 50% + rola=management → M5
M4 < 50% + rola!=management → M6
M5 → zawsze → M6
```

### 6.3 Klasyfikacja (7 poziomów)

| Poziom | Warunek |
|---|---|
| preL1 | M2 < 60% |
| l1 | M2 pass, M3 fail |
| seniorL1 | M2 >= 85% AND M3 30-49% |
| l2 | M3 pass, M4 fail |
| seniorL2 | M3 >= 70% AND M4 30-49% |
| l3 | M4 pass (>= 50%) |
| manager | rola=management AND M5 >= 70% |

### 6.4 Analityka

- **Gap Analysis**: porównanie samooceny (P1.5) z osiągniętym poziomem → accurate / moderateOverestimate / strongOverestimate / underestimate / hiddenTalent
- **Confidence Calibration**: porównanie średniej pewności z accuracy → wellCalibrated / dunningKrugerRisk / hiddenTalent / optimistic / conservative
- **Profile Signals**: weryfikacja doświadczenia, backgroundu, certyfikatów vs poziom → match / partial / recruiterVerification
- **Development Areas**: fundamentals / incidentAnalysis / huntingForensics / strategyLeadership / confidenceCalibration
- **Interview Questions**: dynamicznie dobierane na podstawie słabych obszarów

---

## 7. API Endpoints (backend)

| Endpoint | Metoda | Auth | Opis |
|---|---|---|---|
| `/api/health` | GET | Brak | Status konfiguracji (sheets, gemini, oauth) |
| `/api/questions` | GET | Brak | Pytania z Sheets (cache 1h), fallback do kodu |
| `/api/submit` | POST | Brak | Zapis odpowiedzi do Sheets + trigger Gemini |
| `/api/auth/verify` | POST | Brak | Weryfikacja tokenu Google OAuth |
| `/api/report/:sessionId` | GET | @bitlife.pl | Raport AI dla konkretnego kandydata |
| `/api/candidates` | GET | @bitlife.pl | Lista wszystkich kandydatów |
| `/api/setup-sheets` | POST | Brak | Inicjalizacja nagłówków arkuszy |

### Szczegóły requestów

**POST /api/submit** -- body:
```json
{
  "sessionId": "soc-1711000000-abc123",
  "identity": {
    "firstName": "Anna",
    "lastName": "Kowalska",
    "email": "anna@example.com",
    "continent": "Europa",
    "country": "Polska"
  },
  "answers": { "P1.1": {"choice": "C"}, "P2.1": {"choice": "B", "skipped": false, "confidence": 4}, ... },
  "assessment": { "classification": {...}, "moduleResults": {...}, ... },
  "timestamp": "2026-03-27T17:00:00Z"
}
```

**Response:** `{"success": true, "sessionId": "soc-1711000000-abc123"}`

---

## 8. Struktura Google Sheets

**Arkusz:** `SOC Scout Hub - Database`
**ID:** `18ZW2w2Vw41Q65fPeB1hxBdIz73AcodRLXzPveyfg8jI`
**Udostępniony dla:** `soc-sheets-writer@soc-scout-hub.iam.gserviceaccount.com` (Editor)

### Tab "Odpowiedzi" (auto-wypełniany)
| Kolumna | Opis |
|---|---|
| timestamp | ISO 8601 data submitu |
| session_id | Unikalny ID sesji |
| first_name | Imię kandydata |
| last_name | Nazwisko |
| email | Email |
| continent | Kontynent |
| country | Kraj |
| public_level | Klasyfikacja publiczna (preL1/l1/.../manager) |
| base_level | Klasyfikacja bazowa |
| route | Przebyta ścieżka (M1 > M2 > M3 > M6) |
| answers_json | Pełny JSON odpowiedzi |
| assessment_json | Pełny JSON assessmentu |

### Tab "Raporty AI" (auto-wypełniany przez Gemini)
| Kolumna | Opis |
|---|---|
| session_id | Powiązanie z kandydatem |
| timestamp | Kiedy wygenerowano |
| model | gemini-2.5-flash |
| report_json | Pełny raport JSON |
| summary | Podsumowanie tekstowe |
| recommendation | hire / consider / reject |

### Tab "Pytania" (do zarządzania przez admina)
| Kolumna | Opis |
|---|---|
| id | ID pytania (P2.1) |
| module_id | ID modułu (M2) |
| type | single / multi / open |
| question_pl / question_en | Treść pytania |
| option_a_pl...option_e_pl | Opcje odpowiedzi |
| correct_answer | Poprawna odpowiedź (B) |
| points | Waga punktowa (3/5/8) |
| has_confidence | TRUE/FALSE |
| order | Kolejność |
| active | TRUE/FALSE |

### Tab "Moduły" (do zarządzania przez admina)
| Kolumna | Opis |
|---|---|
| id | M1, M2, ... |
| name_pl / name_en | Nazwy |
| type | technical / profile / selfAssessment |
| gate_percent | Próg przejścia (60, 50, 70) |
| order | Kolejność |

---

## 9. Prompt Gemini AI

Backend buduje prompt dynamicznie na podstawie danych kandydata. Pełny szablon:

```
ROLA:
Ekspert ds. rekrutacji w cyberbezpieczeństwie, specjalizujący się w ocenie
kandydatów na stanowiska SOC.

DANE WEJŚCIOWE:
- Profil kandydata (imię, email, lokalizacja)
- Klasyfikacja systemu (publicLevel, baseLevel)
- Trasa modułów (M1 → M2 → ... → M6)
- Wynik per moduł (score/max, %, pass/fail)
- Gap analysis (declared vs achieved level)
- Confidence calibration (avg confidence vs accuracy)
- Profile signals (match/partial/recruiterVerification + flagi)
- Szczegółowe odpowiedzi (JSON, max 3000 znaków)

OCZEKIWANY OUTPUT (JSON):
{
  "summary": "3-5 zdań",
  "strengths": ["max 5"],
  "weaknesses": ["max 5"],
  "competencyProfile": {
    "networking": "low/medium/high",
    "siem": "low/medium/high",
    "incidentResponse": "low/medium/high",
    "threatHunting": "low/medium/high",
    "forensics": "low/medium/high",
    "management": "low/medium/high/notApplicable"
  },
  "confidenceAssessment": "opis kalibracji",
  "interviewFocus": ["3-5 obszarów"],
  "recommendation": "hire / consider / reject",
  "recommendationRationale": "2-3 zdania",
  "developmentPlan": "plan rozwoju",
  "riskFlags": ["jeśli są"]
}
```

### Zweryfikowany output (test z sesji)

```
Session: soc-e2e-test-001
Model: gemini-2.5-flash
Recommendation: consider
Summary: "Kandydatka Anna Kowalska prezentuje bardzo solidne podstawy na
poziomie analityka L1, osiągając 100% w tym module. Jednakże, jej wynik 60%
w module L2, mimo aspiracji na to stanowisko, wskazuje na znaczące luki
kompetencyjne w obszarach kluczowych..."
```

---

## 10. Google OAuth -- konfiguracja

### Google Auth Platform
- **App name:** SOC Scout Hub
- **Audience:** Internal (jeśli Google Workspace) lub External + test users
- **Scopes:** openid, email, profile

### OAuth Client ID
- **Type:** Web application
- **Name:** SOC Scout Hub Frontend
- **Client ID:** `368352113100-hqte2kvca69vrob574asmmfef8e8tgqk.apps.googleusercontent.com`
- **Authorized JavaScript origins:**
  - `http://localhost:5173`
  - `http://localhost:8080`
- **Authorized redirect URIs:**
  - `http://localhost:5173`

### Flow w aplikacji
1. Rekruter klika "Zaloguj się przez Google" w zakładce Rekruter
2. `@react-oauth/google` otwiera popup Google Sign-In
3. Po zalogowaniu -- frontend dostaje `access_token`
4. Frontend fetchuje `googleapis.com/oauth2/v3/userinfo` z tokenem
5. Sprawdza czy email kończy się na `@bitlife.pl`
6. Jeśli tak -- ustawia `auth` w Zustand store, otwiera panel rekrutera
7. Przy fetchowaniu raportu AI -- token idzie w headerze `Authorization: Bearer`

### Dodatkowe zabezpieczenie w backendzie
Endpointy `/api/report/:id` i `/api/candidates` mają middleware `requireAuth` który:
- Sprawdza header `Authorization: Bearer <token>`
- Weryfikuje token przez `google-auth-library` (OAuth2Client.verifyIdToken)
- Sprawdza czy email jest z domeny `@bitlife.pl`
- Jeśli nie -- zwraca 403

---

## 11. Struktura plików

### Frontend (soc-scout-hub/src/)

```
src/                              3,140 linii kodu
├── main.tsx                      (15)    Entry point + GoogleOAuthProvider
├── App.tsx                       (21)    Phase router (identity/form/report)
├── components/
│   ├── form/
│   │   ├── ModuleView.tsx        (65)    Kontener modułu + submit
│   │   ├── QuestionCard.tsx      (161)   Renderowanie pytań (single/multi/open)
│   │   └── Stepper.tsx           (47)    Nawigacja modułów
│   ├── identity/
│   │   └── IdentityForm.tsx      (94)    Formularz danych kandydata
│   ├── layout/
│   │   └── TopBar.tsx            (46)    Header + język + reset
│   └── report/
│       ├── CandidateReport.tsx   (127)   Raport dla kandydata
│       ├── RecruiterReport.tsx   (287)   Panel rekrutera + Google Auth + AI
│       └── ReportShell.tsx       (34)    Tab switcher
├── data/
│   └── questionBank.ts           (397)   29 pytań + 6 modułów (fallback)
├── i18n/
│   ├── index.ts                  (13)    Konfiguracja i18next
│   ├── pl.json                          Tłumaczenia polskie
│   └── en.json                          Tłumaczenia angielskie
├── logic/
│   ├── scoring.ts                (142)   Scoring + walidacja
│   ├── routing.ts                (63)    Routing warunkowy
│   ├── classification.ts         (235)   Klasyfikacja + gap + confidence + signals
│   ├── assessment.ts             (82)    Agregacja assessment
│   └── __tests__/
│       ├── scoring.test.ts       (85)    Testy scoringu
│       ├── routing.test.ts       (82)    Testy routingu
│       ├── classification.test.ts(103)   Testy klasyfikacji
│       └── edge-cases.test.ts    (161)   Testy graniczne
├── services/
│   └── api.ts                    (87)    Warstwa API (fetch + auth headers)
├── store/
│   └── useFormStore.ts           (183)   Zustand store + submit do backendu
├── styles/
│   └── app.css                   (378)   Dark theme design system
└── types/
    ├── questions.ts              (52)    Typy pytań i modułów
    ├── assessment.ts             (173)   Typy assessment i AI report
    └── identity.ts               (7)     Typ danych kandydata
```

### Backend (soc-scout-hub/functions/)

```
functions/
├── package.json                         Zależności backendu
├── .env                                 Zmienne środowiskowe (SECRET)
├── soc-scout-hub-e9f052e8ca9b.json     Klucz Service Account (SECRET)
└── src/
    └── index.js                  (451)  Pełny serwer Express
                                         7 endpointów API
                                         Gemini prompt builder
                                         Sheets parser
                                         OAuth middleware
```

### Statystyki

| Kategoria | Pliki | Linie |
|---|---|---|
| Komponenty React | 8 | 861 |
| Logika biznesowa | 4 | 522 |
| Testy | 4 | 431 |
| Data + Store + Services + Types | 7 | 899 |
| CSS | 1 | 378 |
| Backend | 1 | 451 |
| **Łącznie** | **25+1** | **~3,600** |

---

## 12. Testy

### Wyniki: 26/26 PASS

```
Test Files  4 passed (4)
     Tests  26 passed (26)
  Duration  179ms
```

### Pokrycie testowe

| Plik testowy | Testy | Co sprawdza |
|---|---|---|
| `scoring.test.ts` | 5 | Scoring M2 (all correct, all wrong, skipped), M1 non-technical, walidacja |
| `routing.test.ts` | 4 | M1→M2 always, M2 fail→M6, M2 pass→M3, full path simulation |
| `classification.test.ts` | 7 | preL1, L1, L3, Manager, strong overestimate gap, Dunning-Kruger |
| `edge-cases.test.ts` | 10 | Boundary 60% exact, 59.9% fail, all-skip, management routing, seniorL1, hidden talent, exclusive multi, open validation, confidence calibration |

### TypeScript
```
npx tsc --noEmit → 0 errors
```

### Build
```
npx vite build → 338 KB JS (109 KB gzip), 13 KB CSS
Built in 101ms
```

---

## 13. Instrukcja uruchomienia

### Wymagania
- Node.js >= 20
- npm
- Dostęp do Google Cloud Console

### Krok 1: Instalacja zależności

```bash
# Frontend
cd soc-scout-hub
npm install

# Backend
cd functions
npm install
```

### Krok 2: Konfiguracja .env

Pliki `.env` już istnieją w repozytorium lokalnie (NIE w git).
Jeśli klonujesz z GitHub -- musisz je odtworzyć na podstawie sekcji 4 tego raportu.

### Krok 3: Uruchomienie

**Terminal 1 -- backend:**
```bash
cd soc-scout-hub/functions
npm run dev
# → SOC Scout Hub API running on port 8080
```

**Terminal 2 -- frontend:**
```bash
cd soc-scout-hub
npm run dev
# → http://localhost:5173
```

### Krok 4: Test
1. Otwórz `http://localhost:5173`
2. Wypełnij formularz
3. Sprawdź Google Sheets -- nowy wiersz w "Odpowiedzi"
4. Kliknij "Raport rekrutera" → zaloguj się @bitlife.pl
5. Raport AI powinien się pojawić po kilku sekundach

---

## 14. Zweryfikowane integracje

### Testy wykonane w sesji

| Test | Wynik | Dowód |
|---|---|---|
| TypeScript compilation | PASS | 0 errors |
| Vitest (26 testów) | PASS | 26/26 |
| Vite build | PASS | 338 KB, 101ms |
| Dev server start | PASS | HTTP 200 on localhost:5173 |
| Backend health check | PASS | `{"status":"ok","sheets":"configured","gemini":"configured","oauth":"configured"}` |
| Setup Sheets headers | PASS | 4 zakładki z nagłówkami |
| Submit to Sheets | PASS | Dane Anny Kowalskiej widoczne w arkuszu |
| Gemini AI call | PASS | `gemini-2.5-flash` odpowiada "Tak" |
| Gemini AI report generation | PASS | Pełny raport JSON z recommendation: "consider" |
| AI report saved to Sheets | PASS | Wiersz w "Raporty AI" z session_id, model, summary |
| /api/report without auth | PASS (403) | `{"error":"Missing authorization header"}` |
| Service Account key file | PASS | Plik istnieje, ładuje się poprawnie |
| Environment variables | PASS | Wszystkie 5 zmiennych wczytane |

---

## 15. Znane ograniczenia i co dalej

### Co nie działa jeszcze
1. **Google OAuth flow w przeglądarce** -- wymaga testowania w przeglądarce z popupem Google (nie da się przetestować z CLI)
2. **Pytania z Sheets** -- aktualnie arkusz "Pytania" jest pusty, aplikacja używa fallbacka z kodu; trzeba wypełnić arkusz jeśli chcesz zarządzać pytaniami z Sheets
3. **Deploy produkcyjny** -- aplikacja działa lokalnie; deploy na Cloud Run + Vercel wymaga dodatkowej konfiguracji (Dockerfile, authorized origins/redirects)
4. **Lista kandydatów w UI** -- endpoint `/api/candidates` istnieje w backendzie, ale frontend nie ma jeszcze dedykowanego widoku listy kandydatów (jest tylko widok per-kandydat)

### Rekomendowane następne kroki
1. **Test w przeglądarce** -- uruchom frontend + backend, przejdź cały formularz, zweryfikuj Google Login
2. **Wypełnij "Pytania" w Sheets** -- jeśli chcesz zarządzać pytaniami z arkusza
3. **Deploy** -- Vercel (frontend) + Cloud Run (backend)
4. **Widok listy kandydatów** -- dodaj stronę admina z tabelą kandydatów, filtrami, porównywaniem
5. **Rotacja kluczy** -- klucz API Gemini i Service Account powinny być okresowo rotowane

### Koszty miesięczne (szacunek)

| Usługa | Koszt |
|---|---|
| Google Cloud Functions / Cloud Run | $0 (free tier) |
| Google Sheets API | $0 (free tier) |
| Gemini 2.5 Flash API | ~$1-5/mies. |
| Vercel (frontend) | $0 (free tier) |
| **Łącznie** | **~$1-5/mies.** |

---

## 16. Discoveries & Gotchas (lekcje z sesji)

Problemy, które kosztowały czas i które warto znać przy dalszej pracy:

### 16.1 Gemini API

| Problem | Rozwiązanie |
|---|---|
| Model `gemini-2.0-flash` jest **deprecated** — zwracał 404 | Przejście na `gemini-2.5-flash` |
| Klucze API z GCP Console (`console.cloud.google.com`) wymagają osobnego włączenia bilingu na projekcie | Alternatywa: klucze z AI Studio (`aistudio.google.com/apikey`) mają darmowy tier. My włączyliśmy billing na istniejącym kluczu. |

### 16.2 Google OAuth / Auth Platform

| Problem | Rozwiązanie |
|---|---|
| Google **przemianowało** "OAuth Consent Screen" na **"Google Auth Platform"** — stare tutoriale nie pasują | Nowa ścieżka: `console.developers.google.com/auth/overview` → GET STARTED → App Info + Audience + Contact → zakładka "Clients" → Create Client |
| Audience "Internal" wymaga **Google Workspace org** — bez Workspace nie można wybrać Internal | Użyliśmy "External" z test users + dodatkowe zabezpieczenie w kodzie backendu (`requireAuth` middleware sprawdza domenę `@bitlife.pl`) |

### 16.3 Architektura / Code

| Problem | Rozwiązanie |
|---|---|
| Google Sheets API auth (Service Account) vs Google OAuth (Client ID) — to **dwa osobne mechanizmy** | Service Account (JSON key file) → backend czyta/pisze do Sheets. OAuth Client ID → browser login rekrutera. Nie mylić. |
| Stary folder `google-apps-script/` był **pusty** — zero kodu Google Apps Script | Usunięty. Cała integracja z Sheets przez googleapis npm w backendzie. |
| Krytyczna analiza w BAZA WIEDZY opisywała **znacznie starszą wersję** — większość krytyk była już naprawiona w vanilla JS | Nie tracić czasu na naprawianie "problemów" z analizy — weryfikować w kodzie. |
| Logika scoringu/routingu z `logic.mjs` była **dobrze napisana** — czyste funkcje, czytelna struktura | Port do TypeScript był prosty (dodanie typów), nie wymagał rewriteów logiki. |

### 16.4 Cel aplikacji (kompaktowe podsumowanie)

Kompletna aplikacja diagnostyczna dla rekrutacji SOC, która:
1. Testuje kandydatów cybersec przez 6 modułów z warunkowym routingiem
2. Klasyfikuje ich w 7 poziomów (preL1 → manager)
3. Auto-zapisuje odpowiedzi do Google Sheets
4. Generuje raporty AI rekrutera przez Google Gemini 2.5 Flash
5. Chroni panel rekrutera za Google OAuth (ograniczenie do domeny @bitlife.pl)

### 16.5 Instrukcje robocze

- Katalog roboczy: `/Users/bieniek/Desktop/BITLIFE/FORMULARZ DLA SOC/`
- Zachowuj foldery `BAZA WIEDZY/` i `analysis/`
- Stara aplikacja: `SOC_SCOUT_HUB_APP/FORMULARZ SOC/` (vanilla JS) — przebudowana od zera w `soc-scout-hub/`
- React + Vite + TypeScript (frontend), Express (backend)
- Google Sheets = baza danych; pytania z Sheets, odpowiedzi auto-save, raporty AI auto-save
- Backend docelowo na Google Cloud Run, frontend na Vercel — aktualnie lokalnie
- Polski to główny język; użytkownik przełącza się między PL/EN
- GitHub repo: `benekhw/formularz_soc` — nadpisane nowym kodem via force push

---

## 17. Repozytorium GitHub

### Dane repo

| Pole | Wartość |
|---|---|
| **URL** | https://github.com/benekhw/formularz_soc |
| **Branch** | `main` |
| **Konto** | `benekhw` |
| **Opis** | SOC Scout Hub v2 — Diagnostic SOC recruitment form with React, Google Sheets, Gemini AI, and OAuth 2.0 |
| **Widoczność** | Public |
| **Plików** | 46 (bez node_modules, .env, kluczy) |
| **Commit** | `9cf6801` — "SOC Scout Hub v2: React + TypeScript + Google Sheets + Gemini AI" |

### Clone i uruchomienie z GitHub

```bash
git clone https://github.com/benekhw/formularz_soc.git
cd formularz_soc
npm install
cd functions && npm install && cd ..
```

Po clonie trzeba ręcznie odtworzyć:
1. **`.env`** (katalog główny) — z wartościami z sekcji 4 tego raportu
2. **`functions/.env`** — z wartościami z sekcji 4 tego raportu
3. **`functions/soc-scout-hub-e9f052e8ca9b.json`** — klucz Service Account (pobrany z Google Cloud Console → IAM → Service Accounts → Keys)

### Co jest w repo, a co nie

**W repo (commitowane):**
- Cały kod frontend (React + TypeScript): `src/`
- Backend Express: `functions/src/index.js`
- Package.json (frontend + backend)
- `.env.example` — szablon zmiennych środowiskowych
- Konfiguracja: `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`
- `.gitignore` z regułami bezpieczeństwa

**NIE w repo (wymaga ręcznego odtworzenia):**
- `.env` — zmienne frontendu (VITE_API_URL, VITE_GOOGLE_CLIENT_ID)
- `functions/.env` — zmienne backendu (SHEETS_ID, GEMINI_KEY, CLIENT_ID, DOMAIN, SA_CREDENTIALS)
- `functions/soc-scout-hub-e9f052e8ca9b.json` — klucz Service Account (plik JSON)
- `node_modules/` — instalowane przez `npm install`
- `dist/` — generowany przez `npm run build`

### Weryfikacja po clonie

Po sklonowaniu z GitHub i odtworzeniu `.env` + klucza SA:

```bash
npx tsc --noEmit        # → 0 errors
npx vitest run          # → 26/26 tests passed
npx vite build          # → 338 KB JS, 13 KB CSS, built in ~300ms
```

---

## 18. Google Sheets — link do arkusza

**Pełny URL:** https://docs.google.com/spreadsheets/d/18ZW2w2Vw41Q65fPeB1hxBdIz73AcodRLXzPveyfg8jI/edit

**Sheets ID:** `18ZW2w2Vw41Q65fPeB1hxBdIz73AcodRLXzPveyfg8jI`

Arkusz zawiera 4 zakładki:
- **Odpowiedzi** — auto-wypełniane po każdym submicie kandydata
- **Raporty AI** — auto-generowane przez Gemini po każdym submicie
- **Pytania** — zarządzanie bankiem pytań (aktualnie puste, fallback w kodzie)
- **Moduły** — definicje modułów i progów przejścia (aktualnie puste, fallback w kodzie)

Service Account z dostępem Editor: `soc-sheets-writer@soc-scout-hub.iam.gserviceaccount.com`

---

## 19. Kontekst dla następnej sesji

Ten raport jest źródłem wiedzy dla kontynuacji pracy nad aplikacją. Oto najważniejsze informacje dla modelu AI w następnym context window:

### Stan aplikacji na 27.03.2026

Aplikacja SOC Scout Hub v2 jest **zbudowana i działająca lokalnie**. Frontend (React) i backend (Express) są połączone z Google Sheets i Gemini AI. Google OAuth jest zaimplementowany w kodzie, ale nie przetestowany w przeglądarce (wymaga interakcji z Google popup).

### Co działa (zweryfikowane w CLI)
- Formularz z 29 pytaniami, 6 modułami, warunkowym routingiem
- Scoring, classification (7 poziomów), gap analysis, confidence calibration
- Zapis odpowiedzi do Google Sheets (arkusz "Odpowiedzi")
- Generowanie raportu AI przez Gemini 2.5 Flash (arkusz "Raporty AI")
- 26 testów jednostkowych (all pass)
- Build produkcyjny (338 KB)

### Co wymaga dalszej pracy
1. **Test Google OAuth w przeglądarce** — popup logowania Google nie da się przetestować z CLI
2. **Wypełnienie arkusza "Pytania"** — aktualnie pytania są hardcoded w `src/data/questionBank.ts`, arkusz w Sheets jest pusty
3. **Deploy produkcyjny** — Vercel (frontend) + Google Cloud Run (backend)
4. **Widok listy kandydatów** — endpoint `/api/candidates` istnieje, brakuje UI
5. **Dodanie Authorized Origins na produkcji** — po deployu trzeba dodać URL produkcyjny do OAuth Client ID

### Kluczowe pliki do przeczytania na start następnej sesji
1. `src/store/useFormStore.ts` — cały state management + submit do API
2. `src/logic/classification.ts` — klasyfikacja, gap analysis, confidence, signals
3. `src/components/report/RecruiterReport.tsx` — Google OAuth + AI report
4. `functions/src/index.js` — cały backend (7 endpointów, Gemini prompt, Sheets integration)
5. `src/data/questionBank.ts` — 29 pytań, 6 modułów (fallback data)

### Ścieżki plików (dla modelu)
- Katalog roboczy: `/Users/bieniek/Desktop/BITLIFE/FORMULARZ DLA SOC/soc-scout-hub/`
- Backend: `/Users/bieniek/Desktop/BITLIFE/FORMULARZ DLA SOC/soc-scout-hub/functions/`
- BAZA WIEDZY: `/Users/bieniek/Desktop/BITLIFE/FORMULARZ DLA SOC/BAZA WIEDZY/`
- Ten raport: `/Users/bieniek/Desktop/BITLIFE/FORMULARZ DLA SOC/BAZA WIEDZY/Aktualizacja soc scout hub 27.03/RAPORT_SESJI_27_03_2026.md`

---

*Raport wygenerowany automatycznie podczas sesji budowy SOC Scout Hub v2, 27.03.2026.*
*Repozytorium GitHub: https://github.com/benekhw/formularz_soc*
*Google Sheets: https://docs.google.com/spreadsheets/d/18ZW2w2Vw41Q65fPeB1hxBdIz73AcodRLXzPveyfg8jI/edit*
