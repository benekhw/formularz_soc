/**
 * SOC Scout Hub — Backend API (Google Cloud Functions compatible)
 *
 * Endpoints:
 *   GET  /api/questions      — Returns question bank (cached from Sheets)
 *   POST /api/submit         — Saves candidate answers to Sheets + triggers AI report
 *   GET  /api/report/:id     — Returns AI report for a session (auth required)
 *   GET  /api/candidates     — Returns candidate list (auth required)
 *   POST /api/auth/verify    — Verifies Google OAuth token
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { OAuth2Client } from 'google-auth-library';

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

// ── Configuration ──
const SHEETS_ID = process.env.GOOGLE_SHEETS_ID || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const ALLOWED_DOMAIN = process.env.ALLOWED_DOMAIN || 'bitlife.pl';
const PORT = process.env.PORT || 8080;

// ── Google Auth (Service Account for Sheets) ──
let sheetsClient = null;

async function getSheetsClient() {
  if (sheetsClient) return sheetsClient;
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const client = await auth.getClient();
  sheetsClient = google.sheets({ version: 'v4', auth: client });
  return sheetsClient;
}

// ── Question Cache ──
let questionCache = null;
let questionCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ── OAuth verification ──
const oauthClient = new OAuth2Client(GOOGLE_CLIENT_ID);

async function verifyGoogleToken(token) {
  // Try ID token verification first (authorization code flow)
  try {
    const ticket = await oauthClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload.email.endsWith(`@${ALLOWED_DOMAIN}`)) {
      return null;
    }
    return {
      email: payload.email,
      name: payload.name || payload.email,
      sub: payload.sub,
    };
  } catch {
    // Not an ID token — try as access token (implicit flow)
  }

  // Verify access token via Google's userinfo endpoint
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const userInfo = await res.json();
    if (!userInfo.email?.endsWith(`@${ALLOWED_DOMAIN}`)) {
      return null;
    }
    return {
      email: userInfo.email,
      name: userInfo.name || userInfo.email,
      sub: userInfo.sub || userInfo.email,
    };
  } catch {
    return null;
  }
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }
  const token = authHeader.split(' ')[1];
  verifyGoogleToken(token).then((user) => {
    if (!user) return res.status(403).json({ error: 'Access denied. Requires @' + ALLOWED_DOMAIN });
    req.user = user;
    next();
  });
}

// ── Transform Sheets rows into app-compatible format ──

function transformModule(row) {
  return {
    id: row.id,
    thresholdPercent: row.gate_percent ? Number(row.gate_percent) : null,
    technical: row.type === 'technical',
    title: { pl: row.name_pl || '', en: row.name_en || '' },
    shortTitle: { pl: deriveShortTitle(row.id, 'pl'), en: deriveShortTitle(row.id, 'en') },
    description: { pl: '', en: '' }, // Sheets does not store descriptions; frontend fallback handles it
  };
}

function deriveShortTitle(moduleId, _lang) {
  const map = { M1: 'Profil', M2: 'L1', M3: 'L2', M4: 'L3', M5: 'MGR', M6: 'Refleksja' };
  const mapEn = { M1: 'Profile', M2: 'L1', M3: 'L2', M4: 'L3', M5: 'MGR', M6: 'Reflection' };
  return _lang === 'en' ? (mapEn[moduleId] || moduleId) : (map[moduleId] || moduleId);
}

function transformQuestion(row) {
  const base = {
    id: row.id,
    moduleId: row.module_id,
    type: row.type, // 'single' | 'multi' | 'open'
    points: Number(row.points) || 0,
    confidenceEnabled: row.has_confidence === 'TRUE',
    sourceRef: `Google Sheets / ${row.id}`,
    prompt: { pl: row.question_pl || '', en: row.question_en || '' },
  };

  if (row.type === 'open') {
    return { ...base, placeholder: { pl: '', en: '' } };
  }

  // Build options array from columns
  const options = [];
  const optionIds = ['a', 'b', 'c', 'd', 'e'];
  for (const letter of optionIds) {
    const pl = row[`option_${letter}_pl`];
    const en = row[`option_${letter}_en`];
    if (pl || en) {
      options.push({ id: letter.toUpperCase(), text: { pl: pl || '', en: en || '' } });
    }
  }

  const question = { ...base, options };

  if (row.type === 'single' && row.correct_answer) {
    question.correctAnswer = row.correct_answer;
  }

  return question;
}

async function fetchQuestionsFromSheets() {
  const sheets = await getSheetsClient();

  const [modulesRes, questionsRes] = await Promise.all([
    sheets.spreadsheets.values.get({
      spreadsheetId: SHEETS_ID,
      range: "'Moduły'!A1:Z100",
    }),
    sheets.spreadsheets.values.get({
      spreadsheetId: SHEETS_ID,
      range: "'Pytania'!A1:Z200",
    }),
  ]);

  const rawModules = parseSheetToObjects(modulesRes.data.values);
  const rawQuestions = parseSheetToObjects(questionsRes.data.values)
    .filter((q) => q.active !== 'FALSE');

  const modules = rawModules.map(transformModule);
  const questions = rawQuestions.map(transformQuestion);

  return { modules, questions };
}

// ── GET /api/questions ──
app.get('/api/questions', async (req, res) => {
  try {
    const now = Date.now();
    if (questionCache && now - questionCacheTime < CACHE_TTL) {
      return res.json(questionCache);
    }

    if (!SHEETS_ID) {
      return res.json({ modules: [], questions: [], source: 'fallback' });
    }

    const { modules, questions } = await fetchQuestionsFromSheets();

    questionCache = { modules, questions, source: 'sheets', timestamp: now };
    questionCacheTime = now;

    res.json(questionCache);
  } catch (err) {
    console.error('Error fetching questions:', err.message);
    res.status(500).json({ error: 'Failed to fetch questions', details: err.message });
  }
});

// ── POST /api/questions/refresh (admin only) ──
app.post('/api/questions/refresh', requireAuth, async (req, res) => {
  try {
    if (!SHEETS_ID) {
      return res.status(400).json({ error: 'GOOGLE_SHEETS_ID not configured' });
    }

    // Clear cache
    questionCache = null;
    questionCacheTime = 0;

    // Fetch fresh data
    const { modules, questions } = await fetchQuestionsFromSheets();
    const now = Date.now();

    questionCache = { modules, questions, source: 'sheets', timestamp: now };
    questionCacheTime = now;

    res.json({
      success: true,
      modulesCount: modules.length,
      questionsCount: questions.length,
      timestamp: new Date(now).toISOString(),
    });
  } catch (err) {
    console.error('Error refreshing questions:', err.message);
    res.status(500).json({ error: 'Failed to refresh questions', details: err.message });
  }
});

// ── POST /api/submit ──
app.post('/api/submit', async (req, res) => {
  try {
    const { sessionId, identity, answers, assessment, timestamp } = req.body;

    if (!sessionId || !identity || !answers) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (SHEETS_ID) {
      const sheets = await getSheetsClient();

      // Build row for Odpowiedzi sheet
      const row = [
        timestamp || new Date().toISOString(),
        sessionId,
        identity.firstName,
        identity.lastName,
        identity.email,
        identity.continent,
        identity.country,
        assessment?.classification?.publicLevel || '',
        assessment?.classification?.baseLevel || '',
        assessment?.visitedModules?.join(' > ') || '',
        JSON.stringify(answers),
        JSON.stringify(assessment),
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEETS_ID,
        range: 'Odpowiedzi!A1',
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [row] },
      });
    }

    // Trigger AI report generation asynchronously
    generateAIReport(sessionId, identity, answers, assessment).catch((err) =>
      console.error('AI report generation failed:', err.message),
    );

    res.json({ success: true, sessionId });
  } catch (err) {
    console.error('Error submitting answers:', err.message);
    res.status(500).json({ error: 'Failed to submit answers', details: err.message });
  }
});

// ── POST /api/auth/verify ──
app.post('/api/auth/verify', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Missing token' });

  const user = await verifyGoogleToken(token);
  if (!user) {
    return res.status(403).json({ error: `Access denied. Requires @${ALLOWED_DOMAIN}` });
  }
  res.json({ success: true, user });
});

// ── GET /api/report/:sessionId ──
app.get('/api/report/:sessionId', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!SHEETS_ID) {
      return res.status(404).json({ error: 'No report available' });
    }

    const sheets = await getSheetsClient();
    const reportRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEETS_ID,
      range: 'Raporty AI!A1:Z1000',
    });

    const reports = parseSheetToObjects(reportRes.data.values || []);
    const report = reports.find((r) => r.session_id === sessionId);

    if (!report) {
      return res.status(404).json({ error: 'Report not found', sessionId });
    }

    res.json({
      sessionId: report.session_id,
      timestamp: report.timestamp,
      model: report.model,
      ...JSON.parse(report.report_json || '{}'),
    });
  } catch (err) {
    console.error('Error fetching report:', err.message);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// ── GET /api/candidates ──
app.get('/api/candidates', requireAuth, async (req, res) => {
  try {
    if (!SHEETS_ID) {
      return res.json({ candidates: [] });
    }

    const sheets = await getSheetsClient();
    const answersRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEETS_ID,
      range: 'Odpowiedzi!A1:Z1000',
    });

    const candidates = parseSheetToObjects(answersRes.data.values || []).map((row) => ({
      timestamp: row.timestamp,
      sessionId: row.session_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      continent: row.continent || '',
      country: row.country || '',
      classification: row.public_level,
      baseLevel: row.base_level,
      route: row.route || '',
      answersJson: row.answers_json || '',
      assessmentJson: row.assessment_json || '',
    }));

    res.json({ candidates });
  } catch (err) {
    console.error('Error fetching candidates:', err.message);
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

// ── GET /api/candidates/:sessionId ──
app.get('/api/candidates/:sessionId', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!SHEETS_ID) {
      return res.status(404).json({ error: 'No data available' });
    }

    const sheets = await getSheetsClient();

    // Fetch answers and AI report in parallel
    const [answersRes, reportRes] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: SHEETS_ID,
        range: 'Odpowiedzi!A1:Z1000',
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: SHEETS_ID,
        range: "'Raporty AI'!A1:Z1000",
      }),
    ]);

    const candidates = parseSheetToObjects(answersRes.data.values || []);
    const candidate = candidates.find((r) => r.session_id === sessionId);

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found', sessionId });
    }

    const reports = parseSheetToObjects(reportRes.data.values || []);
    const report = reports.find((r) => r.session_id === sessionId);

    let aiReport = null;
    if (report && report.report_json) {
      try {
        aiReport = JSON.parse(report.report_json);
      } catch { /* ignore parse errors */ }
    }

    let answers = {};
    try {
      answers = JSON.parse(candidate.answers_json || '{}');
    } catch { /* ignore */ }

    let assessment = {};
    try {
      assessment = JSON.parse(candidate.assessment_json || '{}');
    } catch { /* ignore */ }

    res.json({
      timestamp: candidate.timestamp,
      sessionId: candidate.session_id,
      firstName: candidate.first_name,
      lastName: candidate.last_name,
      email: candidate.email,
      continent: candidate.continent || '',
      country: candidate.country || '',
      classification: candidate.public_level,
      baseLevel: candidate.base_level,
      route: candidate.route || '',
      answers,
      assessment,
      aiReport,
    });
  } catch (err) {
    console.error('Error fetching candidate detail:', err.message);
    res.status(500).json({ error: 'Failed to fetch candidate detail' });
  }
});

// ── GET /api/stats ──
app.get('/api/stats', requireAuth, async (req, res) => {
  try {
    if (!SHEETS_ID) {
      return res.json({ totalCandidates: 0 });
    }

    const sheets = await getSheetsClient();

    const [answersRes, reportsRes] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: SHEETS_ID,
        range: 'Odpowiedzi!A1:Z1000',
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: SHEETS_ID,
        range: "'Raporty AI'!A1:Z1000",
      }),
    ]);

    const candidates = parseSheetToObjects(answersRes.data.values || []);
    const reports = parseSheetToObjects(reportsRes.data.values || []);

    // Level breakdown
    const levelBreakdown = {};
    for (const c of candidates) {
      const lvl = c.public_level || 'unknown';
      levelBreakdown[lvl] = (levelBreakdown[lvl] || 0) + 1;
    }

    // Module score averages and pass rates
    const moduleScores = {}; // moduleId -> { totalPercent, totalCount, passCount }
    for (const c of candidates) {
      try {
        const assessment = JSON.parse(c.assessment_json || '{}');
        const moduleResults = assessment.moduleResults || {};
        for (const [mid, mr] of Object.entries(moduleResults)) {
          if (!mr || !mr.technical) continue;
          if (!moduleScores[mid]) moduleScores[mid] = { totalPercent: 0, count: 0, passCount: 0 };
          moduleScores[mid].totalPercent += mr.percent || 0;
          moduleScores[mid].count += 1;
          if (mr.thresholdMet) moduleScores[mid].passCount += 1;
        }
      } catch { /* ignore parse errors */ }
    }

    const avgScoresByModule = {};
    const passRatesByModule = {};
    for (const [mid, data] of Object.entries(moduleScores)) {
      avgScoresByModule[mid] = data.count > 0 ? Math.round(data.totalPercent / data.count) : 0;
      passRatesByModule[mid] = data.count > 0 ? Math.round((data.passCount / data.count) * 100) : 0;
    }

    // Recommendation breakdown
    const recommendationBreakdown = {};
    for (const r of reports) {
      const rec = r.recommendation || 'unknown';
      recommendationBreakdown[rec] = (recommendationBreakdown[rec] || 0) + 1;
    }

    // Recent candidates (last 10)
    const recentCandidates = candidates
      .slice(-10)
      .reverse()
      .map((c) => ({
        timestamp: c.timestamp,
        sessionId: c.session_id,
        firstName: c.first_name,
        lastName: c.last_name,
        email: c.email,
        classification: c.public_level,
        baseLevel: c.base_level,
        route: c.route || '',
      }));

    res.json({
      totalCandidates: candidates.length,
      levelBreakdown,
      avgScoresByModule,
      passRatesByModule,
      recommendationBreakdown,
      recentCandidates,
    });
  } catch (err) {
    console.error('Error fetching stats:', err.message);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ── AI Report Generation ──
async function generateAIReport(sessionId, identity, answers, assessment) {
  if (!GEMINI_API_KEY) {
    console.log('GEMINI_API_KEY not set, skipping AI report');
    return;
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = buildGeminiPrompt(identity, answers, assessment);

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // Parse JSON from response
  let reportJson;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    reportJson = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: text, recommendation: 'consider' };
  } catch {
    reportJson = { summary: text, recommendation: 'consider', strengths: [], weaknesses: [], interviewFocus: [], riskFlags: [] };
  }

  // Save to Sheets
  if (SHEETS_ID) {
    const sheets = await getSheetsClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEETS_ID,
      range: 'Raporty AI!A1',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [[
          sessionId,
          new Date().toISOString(),
          'gemini-2.5-flash',
          JSON.stringify(reportJson),
          reportJson.summary || '',
          reportJson.recommendation || 'consider',
        ]],
      },
    });
  }

  return reportJson;
}

function buildGeminiPrompt(identity, answers, assessment) {
  const classification = assessment?.classification;
  const moduleResults = assessment?.moduleResults || {};
  const gapAnalysis = assessment?.gapAnalysis;
  const confidenceAnalysis = assessment?.confidenceAnalysis;
  const profileSignals = assessment?.profileSignals;

  return `Jesteś ekspertem ds. rekrutacji w cyberbezpieczeństwie, specjalizującym się w ocenie kandydatów na stanowiska SOC (Security Operations Center).
Analizujesz wyniki formularza diagnostycznego i sporządzasz szczegółowy raport dla rekrutera.

## Kandydat
- Imię: ${identity.firstName} ${identity.lastName}
- Email: ${identity.email}
- Lokalizacja: ${identity.continent}, ${identity.country}

## Wyniki
- Klasyfikacja systemu: ${classification?.publicLevel || 'unknown'}
- Poziom bazowy: ${classification?.baseLevel || 'unknown'}
- Trasa modułów: ${assessment?.visitedModules?.join(' → ') || 'unknown'}

## Wynik per moduł:
${Object.entries(moduleResults).map(([mid, mr]) =>
  `- ${mid}: ${mr.technical ? `${mr.score}/${mr.maxScore} (${mr.percent}%) — ${mr.thresholdMet ? 'PASS' : 'FAIL'}` : 'non-technical'}`
).join('\n')}

## Analiza systemowa
- Gap analysis: ${gapAnalysis?.key || 'N/A'} (declared: ${gapAnalysis?.declaredLevel}, achieved: ${gapAnalysis?.achievedLevel})
- Kalibracja pewności: ${confidenceAnalysis?.key || 'N/A'} (avg confidence: ${confidenceAnalysis?.averageConfidence}, accuracy: ${confidenceAnalysis?.accuracy})
- Sygnały profilu: ${profileSignals?.status || 'N/A'} (${profileSignals?.matchedSignals}/${profileSignals?.totalSignals})
${profileSignals?.flags?.length ? `- Flagi: ${profileSignals.flags.join(', ')}` : ''}

## Szczegółowe odpowiedzi
${JSON.stringify(answers, null, 2).slice(0, 3000)}

## Polecenie
Sporządź raport rekrutacyjny w formacie JSON:
{
  "summary": "3-5 zdań podsumowania kandydata",
  "strengths": ["mocne strony - max 5"],
  "weaknesses": ["słabe strony - max 5"],
  "competencyProfile": {
    "networking": "low/medium/high",
    "siem": "low/medium/high",
    "incidentResponse": "low/medium/high",
    "threatHunting": "low/medium/high",
    "forensics": "low/medium/high",
    "management": "low/medium/high/notApplicable"
  },
  "confidenceAssessment": "Ocena kalibracji pewności kandydata",
  "interviewFocus": ["3-5 obszarów do pogłębienia na rozmowie"],
  "recommendation": "hire / consider / reject",
  "recommendationRationale": "Uzasadnienie rekomendacji w 2-3 zdaniach",
  "developmentPlan": "Sugerowany plan rozwoju jeśli zatrudniony",
  "riskFlags": ["potencjalne ryzyka - jeśli są"]
}

Odpowiedz TYLKO poprawnym JSON-em, bez komentarzy ani markdown.`;
}

// ── Utility: Parse sheet rows to objects ──
function parseSheetToObjects(rows) {
  if (!rows || rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));
  return rows.slice(1).map((row) => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] ?? '';
    });
    return obj;
  });
}

// ── POST /api/setup-sheets — Initialize sheet headers ──
app.post('/api/setup-sheets', async (req, res) => {
  try {
    if (!SHEETS_ID) {
      return res.status(400).json({ error: 'GOOGLE_SHEETS_ID not configured' });
    }

    const sheets = await getSheetsClient();

    // Check if sheets exist, create headers if needed
    const sheetConfigs = [
      {
        name: 'Odpowiedzi',
        headers: ['timestamp', 'session_id', 'first_name', 'last_name', 'email', 'continent', 'country', 'public_level', 'base_level', 'route', 'answers_json', 'assessment_json'],
      },
      {
        name: 'Raporty AI',
        headers: ['session_id', 'timestamp', 'model', 'report_json', 'summary', 'recommendation'],
      },
      {
        name: 'Pytania',
        headers: ['id', 'module_id', 'type', 'question_pl', 'question_en', 'option_a_pl', 'option_a_en', 'option_b_pl', 'option_b_en', 'option_c_pl', 'option_c_en', 'option_d_pl', 'option_d_en', 'option_e_pl', 'option_e_en', 'correct_answer', 'points', 'has_confidence', 'order', 'active'],
      },
      {
        name: 'Moduły',
        headers: ['id', 'name_pl', 'name_en', 'type', 'gate_percent', 'order'],
      },
    ];

    const results = [];

    for (const config of sheetConfigs) {
      try {
        // Try to read the first row
        const existing = await sheets.spreadsheets.values.get({
          spreadsheetId: SHEETS_ID,
          range: `'${config.name}'!A1:Z1`,
        });

        if (!existing.data.values || !existing.data.values[0] || existing.data.values[0].length === 0) {
          // Sheet exists but is empty — write headers
          await sheets.spreadsheets.values.update({
            spreadsheetId: SHEETS_ID,
            range: `'${config.name}'!A1`,
            valueInputOption: 'RAW',
            requestBody: { values: [config.headers] },
          });
          results.push({ sheet: config.name, status: 'headers_written' });
        } else {
          results.push({ sheet: config.name, status: 'already_has_data', firstRow: existing.data.values[0].slice(0, 3) });
        }
      } catch (sheetErr) {
        results.push({ sheet: config.name, status: 'error', message: sheetErr.message });
      }
    }

    res.json({ success: true, results });
  } catch (err) {
    console.error('Error setting up sheets:', err.message);
    res.status(500).json({ error: 'Failed to setup sheets', details: err.message });
  }
});

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    sheets: SHEETS_ID ? 'configured' : 'not configured',
    gemini: GEMINI_API_KEY ? 'configured' : 'not configured',
    oauth: GOOGLE_CLIENT_ID ? 'configured' : 'not configured',
  });
});

// ── Start server ──
app.listen(PORT, () => {
  console.log(`SOC Scout Hub API running on port ${PORT}`);
  console.log(`  Sheets ID: ${SHEETS_ID ? SHEETS_ID.slice(0, 10) + '...' : 'NOT SET'}`);
  console.log(`  Gemini:    ${GEMINI_API_KEY ? 'configured' : 'NOT SET'}`);
  console.log(`  OAuth:     ${GOOGLE_CLIENT_ID ? 'configured' : 'NOT SET'}`);
  console.log(`  Domain:    ${ALLOWED_DOMAIN}`);
});

export default app;
