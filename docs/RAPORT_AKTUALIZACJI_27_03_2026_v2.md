# SOC Scout Hub — Raport Aktualizacji v2

**Data:** 27 marca 2026, sesja wieczorna (18:30–19:00)  
**Wersja:** v2.1 — Admin Panel + Google Sheets Sync  
**Commit:** `57b0a64` on `main`  
**Repo:** https://github.com/benekhw/formularz_soc  
**Kontekst historyczny:** Plik `RAPORT_SESJI_27_03_2026.md` w tym samym katalogu zawiera pełny raport z pierwszej sesji budowy aplikacji (v2.0), w tym: opis migracji z vanilla JS na React+TS, szczegoly integracji Google Cloud, pełny zapis testow i konfiguracji.

---

## 1. Co zostalo zbudowane w tej sesji

### Czesc A: Google Sheets jako baza pytan

| Zadanie | Opis |
|---|---|
| **A.1 Seed script** | Stworzony `functions/src/seed-sheets.js` — jednorazowy skrypt ktory zapisal wszystkie 6 modulow i 29 pytan do Google Sheets (zakladki "Moduly" i "Pytania"). Uruchomiony pomyslnie. |
| **A.2 Backend transform** | Zmodyfikowany `functions/src/index.js`: dodane funkcje `transformModule()` i `transformQuestion()` ktore konwertuja surowe wiersze Sheets do formatu `Module[]`/`Question[]` zgodnego z frontendem. Cache zmniejszony z 1h do 5 min. Dodany endpoint `POST /api/questions/refresh` (wymaga auth). |
| **A.3 Frontend loader** | Stworzony `src/hooks/useLoadQuestions.ts` — hook ktory na starcie pobiera pytania z API i podmienia runtime dane. Refaktoryzowany `src/data/questionBank.ts` — dane sa teraz mutowalne (`_modules`/`_questions`), hardcoded data pozostaje jako fallback. |
| **A.4 Weryfikacja** | Backend potwierdza `source: "sheets"`, 6 modulow, 29 pytan w poprawnym formacie. Frontend laduje dane z API lub uzywa fallbacku. |

### Czesc B: Panel administracyjny

| Zadanie | Opis |
|---|---|
| **B.1 React Router** | Zainstalowany `react-router-dom`. `App.tsx` uzywa `<Routes>` z `/admin/*` i `/*`. `main.tsx` opakowany w `BrowserRouter`. |
| **B.2 Usuniecie zakladki rekrutera** | `ReportShell.tsx` uproszczony — renderuje tylko `CandidateReport`. Z `useFormStore.ts` usuniete: `activeReportTab`, `auth`, `aiReport*` (przeniesione do admin store). |
| **B.3 Admin store** | Stworzony `src/store/useAdminStore.ts` — pelne zarzadzanie stanem: auth, lista kandydatow, szczegoly, compare list (max 3), filtry, statystyki. |
| **B.4 Backend endpoints** | Rozszerzony `GET /api/candidates` (pelne dane). Dodany `GET /api/candidates/:sessionId` (laczy odpowiedzi + raport AI). Dodany `GET /api/stats` (statystyki agregatowe). |
| **B.5 Komponenty admin** | 7 komponentow: AdminPanel, AdminLogin, Dashboard, CandidateList, CandidateDetail, CandidateCompare, QuestionManager. |
| **B.6 Stylowanie** | ~200 linii CSS: sidebar layout, tabele, dashboard cards, bar charts, level badges, filtry, responsive. |
| **B.7 Fix OAuth** | `verifyGoogleToken()` w backendzie obsluguje teraz zarowno ID tokeny (authorization code flow) jak i access tokeny (implicit flow) przez fallback na Google userinfo endpoint. |
| **B.8 i18n** | 49 nowych kluczy tlumaczen w `pl.json` i `en.json` dla interfejsu admina. |

### Podsumowanie zmian

- **22 pliki zmienione**, +2,349 linii, -98 linii
- **10 nowych plikow** stworzonych
- **TypeScript:** 0 bledow
- **Testy:** 26/26 pass
- **Build:** 400 KB JS (127 KB gzip), 22 KB CSS (4.2 KB gzip)

---

## 2. Architektura aplikacji — stan aktualny

### Diagram przeplywu

```
                    KANDYDAT                              ADMIN (@bitlife.pl)
                       |                                        |
                  localhost:5173/                       localhost:5173/admin
                       |                                        |
              +--------v--------+                    +----------v----------+
              |   IdentityForm  |                    |     AdminLogin      |
              |   ModuleView    |                    |   (Google OAuth)    |
              |  CandidateReport|                    +----------+----------+
              +--------+--------+                               |
                       |                              +---------v---------+
                       | POST /api/submit             |    AdminPanel     |
                       |                              |  +-- Dashboard    |
              +--------v--------+                     |  +-- CandidateList|
              |    EXPRESS API   |<--------------------+  +-- CandidateDetail
              |  localhost:8080  |   GET /api/stats    |  +-- Compare     |
              +--------+--------+   GET /api/candidates|  +-- QuestionMgr |
                       |            GET /api/report    +---------+---------+
              +--------v--------+
              |  GOOGLE SHEETS  |
              |  (4 zakladki)   |
              +--------+--------+
                       |
              +--------v--------+
              |   GEMINI 2.5    |
              |   FLASH (AI)    |
              +-----------------+
```

### Warstwy

1. **Frontend** — React 19 + TypeScript 5.9 + Vite 8
   - Routing: `react-router-dom` (`/` = formularz, `/admin` = panel)
   - State: 2 Zustand stores (`useFormStore` dla formularza, `useAdminStore` dla admina)
   - i18n: `react-i18next` (PL/EN)
   - OAuth: `@react-oauth/google` (implicit flow)

2. **Backend** — Express 4 + Node.js (ESM)
   - 9 endpointow (szczegoly w sekcji 5)
   - Google Sheets API (Service Account)
   - Gemini 2.5 Flash (generowanie raportow AI)
   - Cache pytan: 5 minut TTL

3. **Google Cloud**
   - Sheets jako baza danych (4 zakladki)
   - Gemini AI do raportow rekrutacyjnych
   - OAuth 2.0 ograniczone do `@bitlife.pl`

---

## 3. Struktura plikow — pelny inwentarz

### Frontend (src/)

| Plik | Linie | Opis |
|---|---|---|
| `App.tsx` | 57 | Glowny komponent z routingiem (/ i /admin) |
| `main.tsx` | 18 | Entry point: BrowserRouter + GoogleOAuthProvider |
| **Komponenty — Formularz** | | |
| `components/form/ModuleView.tsx` | 65 | Widok modulu z pytaniami i nawigacja |
| `components/form/QuestionCard.tsx` | 161 | Karta pytania (single/multi/open + confidence) |
| `components/form/Stepper.tsx` | 47 | Wskaznik postepow (breadcrumbs modulow) |
| `components/identity/IdentityForm.tsx` | 94 | Formularz danych kandydata |
| `components/layout/TopBar.tsx` | 46 | Gorny pasek z branding + przelacznik jezyka |
| `components/report/ReportShell.tsx` | 11 | Shell raportu (renderuje CandidateReport) |
| `components/report/CandidateReport.tsx` | 127 | Raport kandydata (poziom, sciezka, rozwoj) |
| `components/report/RecruiterReport.tsx` | 287 | **DEAD CODE — do usuniecia** (legacy, broken imports) |
| **Komponenty — Admin** | | |
| `components/admin/AdminPanel.tsx` | 75 | Layout admina: sidebar + widok glowny |
| `components/admin/AdminLogin.tsx` | 61 | Bramka Google OAuth (@bitlife.pl) |
| `components/admin/Dashboard.tsx` | 136 | Karty statystyk + rozkład poziomow + tabele |
| `components/admin/CandidateList.tsx` | 173 | Filtrowana/sortowana tabela kandydatow |
| `components/admin/CandidateDetail.tsx` | 271 | Pelny widok kandydata (assessment, AI, odpowiedzi) |
| `components/admin/CandidateCompare.tsx` | 154 | Porownanie 2-3 kandydatow obok siebie |
| `components/admin/QuestionManager.tsx` | 97 | Link do Sheets + przycisk odswiezania cache |
| **Logika** | | |
| `logic/scoring.ts` | 142 | Punktacja: budowanie wynikow modulu |
| `logic/routing.ts` | 63 | Routing warunkowy miedzy modulami |
| `logic/classification.ts` | 235 | 7-poziomowa klasyfikacja (preL1 do manager) |
| `logic/assessment.ts` | 82 | Agregacja: gap analysis, confidence, profile signals |
| **Testy** | | |
| `logic/__tests__/scoring.test.ts` | 85 | Testy scoringu |
| `logic/__tests__/routing.test.ts` | 82 | Testy routingu |
| `logic/__tests__/classification.test.ts` | 103 | Testy klasyfikacji |
| `logic/__tests__/edge-cases.test.ts` | 161 | Edge cases |
| **Dane** | | |
| `data/questionBank.ts` | 436 | 6 modulow + 29 pytan (hardcoded fallback) + mutable runtime store |
| **Hooks** | | |
| `hooks/useLoadQuestions.ts` | 53 | Loader pytan z API na starcie |
| **Store** | | |
| `store/useFormStore.ts` | 146 | Stan formularza (sesja, odpowiedzi, nawigacja) |
| `store/useAdminStore.ts` | 157 | Stan admina (auth, kandydaci, filtry, statystyki) |
| **Services** | | |
| `services/api.ts` | 147 | Warstwa API: 8 funkcji (fetch/submit/auth/refresh) |
| **Typy** | | |
| `types/questions.ts` | 52 | Module, Question, QuestionOption, LocalizedText |
| `types/assessment.ts` | 173 | Assessment, Classification, AIReport, etc. |
| `types/identity.ts` | 7 | CandidateIdentity |
| **i18n** | | |
| `i18n/index.ts` | 13 | Konfiguracja i18next |
| `i18n/pl.json` | 157 | Tlumaczenia polskie (157 kluczy) |
| `i18n/en.json` | 157 | Tlumaczenia angielskie (157 kluczy) |
| **Styles** | | |
| `styles/app.css` | 518 | Calosc stylowania (formularz + admin + responsive) |

### Backend (functions/)

| Plik | Linie | Opis |
|---|---|---|
| `src/index.js` | 727 | Express API: 9 endpointow, Sheets, Gemini, OAuth |
| `src/seed-sheets.js` | 424 | Jednorazowy skrypt seedujacy Sheets |
| `package.json` | 22 | Zaleznosci backendowe |

### Konfiguracja (root)

| Plik | Opis |
|---|---|
| `vite.config.ts` | Konfiguracja Vite (minimalna — brak SPA fallback!) |
| `vitest.config.ts` | Konfiguracja testow |
| `tsconfig.json` | TypeScript base |
| `tsconfig.app.json` | TypeScript frontend config |
| `tsconfig.node.json` | TypeScript node config |
| `eslint.config.js` | ESLint config |
| `package.json` | Zaleznosci frontend + scripts |
| `index.html` | HTML entry point |
| `.gitignore` | Git ignore (poprawny, wyklucza .env i SA key) |

### Laczna ilosc kodu: **~5,724 linii** (TS/TSX/JS/CSS, bez node_modules/dist)

---

## 4. Backend API — Reference

| # | Method | Path | Auth | Opis |
|---|---|---|---|---|
| 1 | `GET` | `/api/health` | - | Healthcheck: status Sheets/Gemini/OAuth |
| 2 | `GET` | `/api/questions` | - | Pobiera pytania i moduly (cached 5 min, z Sheets) |
| 3 | `POST` | `/api/questions/refresh` | @bitlife.pl | Czysci cache i pobiera swieże dane z Sheets |
| 4 | `POST` | `/api/submit` | - | Zapisuje odpowiedzi kandydata do Sheets + triggeruje AI raport |
| 5 | `POST` | `/api/auth/verify` | - | Weryfikuje Google OAuth token |
| 6 | `GET` | `/api/report/:sessionId` | @bitlife.pl | Pobiera raport AI dla sesji |
| 7 | `GET` | `/api/candidates` | @bitlife.pl | Lista wszystkich kandydatow (pelne dane) |
| 8 | `GET` | `/api/candidates/:sessionId` | @bitlife.pl | Szczegoly kandydata (odpowiedzi + assessment + AI raport) |
| 9 | `GET` | `/api/stats` | @bitlife.pl | Statystyki agregatowe (poziomy, wyniki, rekomendacje) |
| 10 | `POST` | `/api/setup-sheets` | **BRAK AUTH!** | Inicjalizacja naglowkow Sheets (do zabezpieczenia) |

---

## 5. Google Sheets — Schemat

**Sheets ID:** `18ZW2w2Vw41Q65fPeB1hxBdIz73AcodRLXzPveyfg8jI`

### Zakladka: Odpowiedzi

| Kolumna | Opis |
|---|---|
| `timestamp` | ISO 8601 data wyslania |
| `session_id` | Unikalny identyfikator sesji (`soc-{timestamp}-{random}`) |
| `first_name` | Imie kandydata |
| `last_name` | Nazwisko |
| `email` | E-mail |
| `continent` | Kontynent |
| `country` | Kraj |
| `public_level` | Poziom publiczny (preL1/l1/seniorL1/l2/seniorL2/l3/manager) |
| `base_level` | Poziom bazowy |
| `route` | Przebyta sciezka modulow (np. "M1 > M2 > M3 > M6") |
| `answers_json` | JSON ze wszystkimi odpowiedziami |
| `assessment_json` | JSON z pelna ocena (classification, moduleResults, gap, confidence, signals) |

### Zakladka: Raporty AI

| Kolumna | Opis |
|---|---|
| `session_id` | Klucz laczacy z Odpowiedzi |
| `timestamp` | Czas wygenerowania raportu |
| `model` | Model AI (gemini-2.5-flash) |
| `report_json` | Pelny JSON raportu (summary, strengths, weaknesses, recommendation, etc.) |
| `summary` | Podsumowanie tekstowe |
| `recommendation` | hire / consider / reject |

### Zakladka: Pytania

| Kolumna | Opis |
|---|---|
| `id` | Identyfikator pytania (P1.1, P2.1, etc.) |
| `module_id` | Modul (M1-M6) |
| `type` | single / multi / open |
| `question_pl` | Tresc pytania PL |
| `question_en` | Tresc pytania EN |
| `option_a_pl` - `option_e_pl` | Opcje odpowiedzi PL (A-E) |
| `option_a_en` - `option_e_en` | Opcje odpowiedzi EN (A-E) |
| `correct_answer` | Poprawna odpowiedz (A/B/C/D/E lub puste) |
| `points` | Punkty za poprawna odpowiedz |
| `has_confidence` | TRUE/FALSE — czy pytanie ma skale pewnosci |
| `order` | Kolejnosc w module |
| `active` | TRUE/FALSE — czy pytanie jest aktywne |

### Zakladka: Moduly

| Kolumna | Opis |
|---|---|
| `id` | Identyfikator modulu (M1-M6) |
| `name_pl` | Nazwa PL |
| `name_en` | Nazwa EN |
| `type` | profile / technical / selfAssessment |
| `gate_percent` | Prog przejscia (%) lub puste |
| `order` | Kolejnosc |

---

## 6. Przeplyw danych

### Pytania: Sheets -> App

```
Google Sheets (Pytania + Moduly)
    |
    | (GET /api/questions, cache 5 min)
    v
Backend: transformModule() + transformQuestion()
    |
    | JSON { modules: Module[], questions: Question[], source: "sheets" }
    v
Frontend: useLoadQuestions() hook
    |
    | setQuestionsFromSheets(_modules, _questions)
    v
questionBank.ts (runtime mutable arrays)
    |
    | getModuleById(), getQuestionsByModule(), getQuestionById()
    v
ModuleView / QuestionCard / scoring / routing / classification
```

**Fallback:** Jesli backend jest niedostepny, pytania z hardcoded `QUESTION_BANK[]` w `questionBank.ts` pozostaja aktywne.

### Kandydat: Formularz -> Sheets -> Admin

```
Kandydat wypelnia formularz
    |
    | finishForm() -> deriveAssessment()
    v
CandidateReport (natychmiast, lokalnie)
    |
    | POST /api/submit (fire-and-forget)
    v
Backend zapisuje do Sheets (Odpowiedzi)
    |
    | generateAIReport() (async)
    v
Gemini 2.5 Flash generuje raport JSON
    |
    | Zapisany do Sheets (Raporty AI)
    v
Admin Panel pobiera:
  GET /api/stats        -> Dashboard
  GET /api/candidates   -> CandidateList
  GET /api/candidates/X -> CandidateDetail (+ AI raport)
```

---

## 7. Srodowisko i konfiguracja

### Zmienne srodowiskowe

**Frontend (`.env`):**
```
VITE_API_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=<Google OAuth Client ID>
```

**Backend (`functions/.env`):**
```
GOOGLE_SHEETS_ID=18ZW2w2Vw41Q65fPeB1hxBdIz73AcodRLXzPveyfg8jI
GEMINI_API_KEY=<Gemini API key>
GOOGLE_CLIENT_ID=<Google OAuth Client ID>
GOOGLE_APPLICATION_CREDENTIALS=./soc-scout-hub-e9f052e8ca9b.json
ALLOWED_DOMAIN=bitlife.pl
PORT=8080
```

### Uruchomienie (dev)

```bash
# Terminal 1 — Backend
cd functions && npm run dev
# -> http://localhost:8080

# Terminal 2 — Frontend
npm run dev
# -> http://localhost:5173 (formularz)
# -> http://localhost:5173/admin (panel admina)
```

### Build (production)

```bash
npm run build
# -> dist/ (400 KB JS gzip: 127 KB, 22 KB CSS gzip: 4.2 KB)
```

### Testy

```bash
npx vitest run
# 4 pliki testowe, 26 testow, ~150ms
```

---

## 8. Tech Stack

| Warstwa | Technologia | Wersja |
|---|---|---|
| Frontend framework | React | 19.x |
| Language | TypeScript | 5.9 |
| Build tool | Vite | 8.0 |
| State management | Zustand | 5.x |
| Routing | react-router-dom | 7.x |
| i18n | react-i18next | 15.x |
| OAuth | @react-oauth/google | 0.12 |
| CSS | Vanilla CSS (custom properties) | — |
| Testing | Vitest + Testing Library | 4.1 |
| Backend | Express | 4.x |
| Runtime | Node.js | 25.x (ESM) |
| Database | Google Sheets API v4 | — |
| AI | Google Gemini 2.5 Flash | — |
| Auth | Google OAuth 2.0 | — |

---

## 9. Roadmap — co zostalo do zrobienia

### Priorytet 1: Szybkie poprawki (do zrobienia na start nastepnej sesji)

| # | Zadanie | Wplyw | Wysilek |
|---|---|---|---|
| 1 | **Usunac `RecruiterReport.tsx`** | Dead code (287 linii). Odwoluje sie do nieistniejacych pol w store — crashnalby przy renderowaniu. | 1 min |
| 2 | **Dodac `"test": "vitest run"` do `package.json`** | Infrastruktura testowa istnieje, ale nie ma komendy `npm test`. | 1 min |
| 3 | **Dodac komponent `ErrorBoundary`** | Kazdy uncaught React error = bialy ekran. Standardowa praktyka. | 15 min |
| 4 | **Skonfigurowac SPA fallback w `vite.config.ts`** | Odswiezenie `/admin` w przegladarce = 404 w produkcji. Dev server obsluguje to, ale zbudowana wersja nie. | 5 min |
| 5 | **Zabezpieczyc `POST /api/setup-sheets`** | Endpoint bez autentykacji — ktokolwiek moze go wywolac. Dodac `requireAuth`. | 2 min |

### Priorytet 2: Weryfikacja i testy

| # | Zadanie | Opis |
|---|---|---|
| 6 | **Testowac Google OAuth w przegladarce** | Flow logowania admina nigdy nie byl testowany end-to-end. Poprawiony `verifyGoogleToken` (fallback access token) wymaga weryfikacji. |
| 7 | **Usunac nieuzywana funkcje `verifyAuth` z `api.ts`** | `POST /api/auth/verify` istnieje w backendzie, ale frontend nigdy go nie wywoluje (admin panel weryfikuje bezposrednio przez Google userinfo). Mozna usunac lub zostawic jako utility. |
| 8 | **Dodac opisy modulow do Sheets** | `transformModule()` zwraca puste opisy (`{pl: '', en: ''}`) bo Sheets nie ma tych kolumn. Hardcoded fallback ma opisy. Mozna dodac kolumny `description_pl`/`description_en` do zakladki Moduly. |

### Priorytet 3: Deployment produkcyjny

| # | Zadanie | Opis |
|---|---|---|
| 9 | **Deploy frontendu** | Vercel, Netlify, lub Firebase Hosting. Wymaga konfiguracji SPA rewrites. |
| 10 | **Deploy backendu** | Google Cloud Run lub Firebase Functions. Wymaga Dockerfile. |
| 11 | **Skonfigurowac OAuth origins/redirects** | Dodac produkcyjne URL-e do Google Cloud Console (Authorized JavaScript origins + Authorized redirect URIs). |
| 12 | **Ustawic zmienne srodowiskowe w hostingu** | VITE_API_URL, GOOGLE_SHEETS_ID, GEMINI_API_KEY, etc. |

### Priorytet 4: Ulepszenia (nice-to-have)

| # | Zadanie | Opis |
|---|---|---|
| 13 | **Eksport kandydatow do CSV/PDF** | Admin panel ma dane, ale brak przycisku eksportu. |
| 14 | **Paginacja listy kandydatow** | Aktualnie pobiera wszystkie wiersze. OK dla <100, ale nie skaluje sie. |
| 15 | **Auto-refresh statystyk dashboardu** | Statystyki pobierane raz na mount. Brak pollingu. |
| 16 | **CORS lockdown** | Backend ma `origin: true` (akceptuje wszystko). Trzeba ograniczyc do produkcyjnego URL-a. |
| 17 | **Rate limiting na endpointach publicznych** | `/api/submit` i `/api/questions` nie maja rate limitingu. |

---

## 10. Znane problemy

| Problem | Opis | Wplyw |
|---|---|---|
| `RecruiterReport.tsx` is dead code | 287 linii nieuzywnego kodu z broken importami. Nie jest importowany nigdzie, ale zaciemnia codebase. | Niski — nie crashuje, ale myli |
| Brak SPA fallback | `/admin` refresh = 404 w production build. Dev server OK. | Wysoki dla deploymentu |
| Brak ErrorBoundary | Uncaught error = bialy ekran. | Sredni |
| `setup-sheets` bez auth | Endpoint publiczny — moze byc naduzywany. | Niski (jednorazowe uzycie) |
| Module descriptions puste z Sheets | Opisy modulow ladowane z Sheets sa puste. Hardcoded fallback ma opisy. Jesli Sheets jest zrodlem, opisy nie wyswietlaja sie. | Niski (estetyczny) |
| CORS szeroko otwarty | `origin: true` na Express serwerze. | Sredni (do naprawy przed produkcja) |

---

## 11. Klasyfikacja kandydatow — reference

System klasyfikuje kandydatow na 7 poziomow:

| Poziom | Opis | Kryteria |
|---|---|---|
| **preL1** | Ponizej L1 | Nie zdal M2 (< 60%) |
| **l1** | L1 Analyst | Zdal M2, nie zdal M3 |
| **seniorL1** | Senior L1 | Zdal M2 z wynikiem > 80%, nie zdal M3 |
| **l2** | L2 Analyst | Zdal M2 + M3, nie zdal M4 |
| **seniorL2** | Senior L2 | Zdal M2 + M3 z wynikami > 70%, nie zdal M4 |
| **l3** | L3 / Expert | Zdal M2 + M3 + M4 |
| **manager** | SOC Manager | Zdal M2 + M3 + M4 + M5 (prog 70%) |

Dodatkowe sygnaly:
- **Gap analysis**: porownuje deklarowany poziom (P1.5) z wynikiem
- **Confidence calibration**: pewnosc vs trafnosc (Dunning-Kruger detection)
- **Profile signals**: certyfikaty, doswiadczenie, aspiracje vs wynik techniczny

---

## 12. Kontakt i dostepy

| Zasob | Lokalizacja |
|---|---|
| Repo | https://github.com/benekhw/formularz_soc |
| Google Sheets | https://docs.google.com/spreadsheets/d/18ZW2w2Vw41Q65fPeB1hxBdIz73AcodRLXzPveyfg8jI |
| Google Cloud Console | Projekt: soc-scout-hub |
| Service Account | `soc-scout-hub@soc-scout-hub.iam.gserviceaccount.com` |
| OAuth Client | Ograniczony do `@bitlife.pl` |
| Klucz SA | `functions/soc-scout-hub-e9f052e8ca9b.json` (NIE w git) |
