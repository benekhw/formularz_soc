/**
 * Seed script — populates Google Sheets "Pytania" and "Moduły" tabs
 * with the full question bank from the application.
 *
 * Usage:
 *   cd functions && node src/seed-sheets.js
 *
 * Prerequisites:
 *   - functions/.env with GOOGLE_SHEETS_ID
 *   - Service Account key file configured via GOOGLE_APPLICATION_CREDENTIALS
 */

import 'dotenv/config';
import { google } from 'googleapis';

const SHEETS_ID = process.env.GOOGLE_SHEETS_ID;
if (!SHEETS_ID) {
  console.error('ERROR: GOOGLE_SHEETS_ID not set in .env');
  process.exit(1);
}

// ── Module definitions (matches MODULES in questionBank.ts) ──
const MODULES = [
  { id: 'M1', name_pl: 'Moduł 1. Profil kandydata', name_en: 'Module 1. Candidate profile', type: 'profile', gate_percent: '', order: 1 },
  { id: 'M2', name_pl: 'Moduł 2. Fundamenty SOC (L1 baseline)', name_en: 'Module 2. SOC fundamentals (L1 baseline)', type: 'technical', gate_percent: '60', order: 2 },
  { id: 'M3', name_pl: 'Moduł 3. Analiza incydentów (L2 baseline)', name_en: 'Module 3. Incident analysis (L2 baseline)', type: 'technical', gate_percent: '50', order: 3 },
  { id: 'M4', name_pl: 'Moduł 4. Threat Hunting i Forensics (L3 baseline)', name_en: 'Module 4. Threat hunting and forensics (L3 baseline)', type: 'technical', gate_percent: '50', order: 4 },
  { id: 'M5', name_pl: 'Moduł 5. Strategia i zarządzanie (Manager baseline)', name_en: 'Module 5. Strategy and management (Manager baseline)', type: 'technical', gate_percent: '70', order: 5 },
  { id: 'M6', name_pl: 'Moduł 6. Samoocena i motywacja', name_en: 'Module 6. Self-assessment and motivation', type: 'selfAssessment', gate_percent: '', order: 6 },
];

// ── Question definitions (matches QUESTION_BANK in questionBank.ts) ──
const QUESTIONS = [
  // M1 — Candidate Profile
  {
    id: 'P1.1', module_id: 'M1', type: 'single',
    question_pl: 'Ile lat pracujesz w obszarze cyberbezpieczeństwa / IT Security?',
    question_en: 'How many years have you worked in cybersecurity / IT security?',
    option_a_pl: 'Nie mam doświadczenia (studia / kursy / samodzielna nauka)',
    option_a_en: 'I do not have professional experience yet (studies / courses / self-learning)',
    option_b_pl: 'Poniżej 2 lat', option_b_en: 'Less than 2 years',
    option_c_pl: '2-4 lata', option_c_en: '2-4 years',
    option_d_pl: '4-7 lat', option_d_en: '4-7 years',
    option_e_pl: 'Powyżej 7 lat', option_e_en: 'More than 7 years',
    correct_answer: '', points: '0', has_confidence: 'FALSE', order: 1, active: 'TRUE',
  },
  {
    id: 'P1.2', module_id: 'M1', type: 'single',
    question_pl: 'Czy pracowałeś/aś kiedykolwiek w strukturach SOC lub zespole Blue Team?',
    question_en: 'Have you ever worked in a SOC structure or a Blue Team environment?',
    option_a_pl: 'Nie, nigdy', option_a_en: 'No, never',
    option_b_pl: 'Tak, w SOC', option_b_en: 'Yes, in a SOC',
    option_c_pl: 'Tak, w Blue Team / CERT / CSIRT (ale nie w klasycznym SOC)', option_c_en: 'Yes, in Blue Team / CERT / CSIRT (but not in a classic SOC)',
    option_d_pl: 'Tak, ale w roli niezwiązanej z analizą (np. administracja, wsparcie)', option_d_en: 'Yes, but in a role not focused on analysis (for example administration or support)',
    option_e_pl: '', option_e_en: '',
    correct_answer: '', points: '0', has_confidence: 'FALSE', order: 2, active: 'TRUE',
  },
  {
    id: 'P1.3', module_id: 'M1', type: 'multi',
    question_pl: 'Jakie certyfikaty z zakresu cyberbezpieczeństwa posiadasz? (wielokrotny wybór)',
    question_en: 'Which cybersecurity certifications do you hold? (multiple choice)',
    option_a_pl: 'Nie posiadam certyfikatów', option_a_en: 'I do not hold any certifications',
    option_b_pl: 'CompTIA Security+ / Google Cybersec / SC-900 / CEH (entry-level)', option_b_en: 'CompTIA Security+ / Google Cybersec / SC-900 / CEH (entry level)',
    option_c_pl: 'CySA+ / GCIH / BTL1 / SC-200 (mid-level)', option_c_en: 'CySA+ / GCIH / BTL1 / SC-200 (mid level)',
    option_d_pl: 'GCFA / GREM / OSCP / eCIR (advanced)', option_d_en: 'GCFA / GREM / OSCP / eCIR (advanced)',
    option_e_pl: '', option_e_en: '',
    correct_answer: '', points: '0', has_confidence: 'FALSE', order: 3, active: 'TRUE',
  },
  {
    id: 'P1.4', module_id: 'M1', type: 'single',
    question_pl: 'Jakiego rodzaju rolę rozważasz?',
    question_en: 'Which type of role are you considering?',
    option_a_pl: 'Analityk / Operator SOC (praca techniczna z alertami i incydentami)', option_a_en: 'SOC analyst / operator (hands-on work with alerts and incidents)',
    option_b_pl: 'Senior Analyst / Team Lead (praca techniczna + mentoring)', option_b_en: 'Senior analyst / team lead (technical work plus mentoring)',
    option_c_pl: 'Management / Kierownik SOC (strategia, zarządzanie zespołem, procesy)', option_c_en: 'Management / SOC manager (strategy, team management, processes)',
    option_d_pl: '', option_d_en: '',
    option_e_pl: '', option_e_en: '',
    correct_answer: '', points: '0', has_confidence: 'FALSE', order: 4, active: 'TRUE',
  },
  {
    id: 'P1.5', module_id: 'M1', type: 'single',
    question_pl: 'Na jakim poziomie sam siebie oceniasz?',
    question_en: 'How do you rate your current level?',
    option_a_pl: 'Junior / Początkujący (L1) - uczę się podstaw, szukam pierwszej roli', option_a_en: 'Junior / beginner (L1) - I am learning the basics and looking for my first role',
    option_b_pl: 'Mid / Samodzielny (L2) - samodzielnie analizuję incydenty, znam MITRE ATT&CK', option_b_en: 'Mid / independent (L2) - I can analyze incidents on my own and I know MITRE ATT&CK',
    option_c_pl: 'Senior / Ekspert (L3) - prowadzę threat hunting, piszę reguły detekcji, prowadzę IR', option_c_en: 'Senior / expert (L3) - I run threat hunts, write detection rules, and lead incident response',
    option_d_pl: 'Manager / Lider - zarządzam zespołem SOC, odpowiadam za procesy i strategię', option_d_en: 'Manager / leader - I manage a SOC team and own processes and strategy',
    option_e_pl: '', option_e_en: '',
    correct_answer: '', points: '0', has_confidence: 'FALSE', order: 5, active: 'TRUE',
  },

  // M2 — SOC Fundamentals (L1)
  {
    id: 'P2.1', module_id: 'M2', type: 'single',
    question_pl: 'W kolejce SIEM pojawia się alert: \'Suspicious outbound connection to known C2 IP\'. Po wstępnej analizie ustalasz, że połączenie pochodzi z serwera aktualizacji oprogramowania antywirusowego. Jak klasyfikujesz to zdarzenie?',
    question_en: 'A SIEM queue shows an alert: \'Suspicious outbound connection to known C2 IP\'. After initial analysis you determine that the connection comes from an antivirus update server. How do you classify the event?',
    option_a_pl: 'True Positive - każde połączenie z adresem C2 to potwierdzona infekcja', option_a_en: 'True positive - every connection to a C2 address confirms an infection',
    option_b_pl: 'False Positive - po weryfikacji kontekstu alert jest fałszywy, bo źródłem jest legalny serwer aktualizacji', option_b_en: 'False positive - after context verification the alert is benign because the source is a legitimate update server',
    option_c_pl: 'Eskalować natychmiast do L2 bez dalszej analizy - to nie moja decyzja', option_c_en: 'Escalate immediately to L2 without further analysis - this is not my decision to make',
    option_d_pl: 'Zignorować alert - serwery aktualizacji zawsze generują fałszywe alarmy', option_d_en: 'Ignore the alert - update servers always generate false alarms',
    option_e_pl: '', option_e_en: '',
    correct_answer: 'B', points: '3', has_confidence: 'TRUE', order: 1, active: 'TRUE',
  },
  {
    id: 'P2.2', module_id: 'M2', type: 'single',
    question_pl: 'Która warstwa modelu OSI jest celem ataku DDoS typu HTTP Flood i dlaczego ataki na tej warstwie są trudniejsze do wykrycia?',
    question_en: 'Which OSI layer is targeted by an HTTP Flood DDoS attack, and why are attacks at that layer harder to detect?',
    option_a_pl: 'Warstwa 3 (Network) - bo ataki DDoS zawsze celują w routing', option_a_en: 'Layer 3 (Network) - because DDoS attacks always target routing',
    option_b_pl: 'Warstwa 4 (Transport) - bo SYN flood to główny typ DDoS', option_b_en: 'Layer 4 (Transport) - because SYN flood is the main DDoS type',
    option_c_pl: 'Warstwa 7 (Application) - bo ruch wygląda jak legalne zapytania HTTP i trudno go odfiltrować bez analizy wzorców', option_c_en: 'Layer 7 (Application) - because the traffic looks like legitimate HTTP requests and is hard to filter without pattern analysis',
    option_d_pl: 'Warstwa 2 (Data Link) - bo ataki DDoS celują w switch flooding', option_d_en: 'Layer 2 (Data Link) - because DDoS attacks target switch flooding',
    option_e_pl: '', option_e_en: '',
    correct_answer: 'C', points: '3', has_confidence: 'TRUE', order: 2, active: 'TRUE',
  },
  {
    id: 'P2.3', module_id: 'M2', type: 'single',
    question_pl: 'Dostajesz alert: \'Host 10.0.15.42 initiated connection to external IP 185.x.x.x on port 443 - not in baseline\'. Co robisz jako pierwsze?',
    question_en: 'You receive an alert: \'Host 10.0.15.42 initiated connection to external IP 185.x.x.x on port 443 - not in baseline\'. What is the first thing you do?',
    option_a_pl: 'Sprawdzam kontekst: jaki to host, kto na nim pracuje, czy IP jest znane w threat intelligence i czy połączenie jest jednorazowe czy cykliczne', option_a_en: 'Check the context: what host it is, who uses it, whether the IP appears in threat intelligence, and whether the connection is one-off or recurring',
    option_b_pl: 'Natychmiast izoluję host od sieci - każde nieznane połączenie wychodzące to potencjalny C2', option_b_en: 'Immediately isolate the host from the network - every unknown outbound connection is a potential C2',
    option_c_pl: 'Zamykam alert jako false positive - port 443 to HTTPS, więc to normalne', option_c_en: 'Close the alert as a false positive - port 443 means HTTPS, so it must be normal',
    option_d_pl: 'Czekam na kolejne alerty z tego hosta, żeby potwierdzić wzorzec', option_d_en: 'Wait for more alerts from the same host before doing anything',
    option_e_pl: '', option_e_en: '',
    correct_answer: 'A', points: '3', has_confidence: 'TRUE', order: 3, active: 'TRUE',
  },
  {
    id: 'P2.4', module_id: 'M2', type: 'single',
    question_pl: 'Jaka jest główna funkcja SIEM w centrum operacji bezpieczeństwa?',
    question_en: 'What is the main role of a SIEM in a security operations center?',
    option_a_pl: 'SIEM służy wyłącznie do przechowywania logów na potrzeby compliance', option_a_en: 'A SIEM exists only to store logs for compliance purposes',
    option_b_pl: 'SIEM automatycznie blokuje wszystkie ataki wykryte w logach', option_b_en: 'A SIEM automatically blocks every attack detected in logs',
    option_c_pl: 'SIEM agreguje logi z wielu źródeł, koreluje zdarzenia i generuje alerty, dając analitykom centralny widok na bezpieczeństwo organizacji', option_c_en: 'A SIEM aggregates logs from many sources, correlates events, and generates alerts to give analysts a central security view',
    option_d_pl: 'SIEM zastępuje firewalla i EDR - wystarczy jeden system do ochrony', option_d_en: 'A SIEM replaces the firewall and EDR - one system is enough for protection',
    option_e_pl: '', option_e_en: '',
    correct_answer: 'C', points: '3', has_confidence: 'TRUE', order: 4, active: 'TRUE',
  },
  {
    id: 'P2.5', module_id: 'M2', type: 'single',
    question_pl: 'W ciągu jednej godziny otrzymujesz trzy alerty. Który z nich powinien mieć najwyższy priorytet i dlaczego?\nAlert A: wielokrotne nieudane logowania SSH z zewnętrznego IP\nAlert B: EDR wykrył proces mimikatz.exe na stacji w dziale finansowym\nAlert C: użytkownik zgłasza pop-upy z reklamami',
    question_en: 'Within one hour you receive three alerts. Which one should have the highest priority and why?\nAlert A: multiple failed SSH logons from an external IP\nAlert B: EDR detected mimikatz.exe on a workstation in finance\nAlert C: a user reports ad pop-ups',
    option_a_pl: 'Alert A - brute-force SSH na serwer publiczny to najpoważniejsze zagrożenie', option_a_en: 'Alert A - brute-force SSH on a public server is the most serious threat',
    option_b_pl: 'Alert B - mimikatz to narzędzie do kradzieży poświadczeń; jego obecność w finansach sugeruje aktywny atak wewnętrzny', option_b_en: 'Alert B - mimikatz is a credential theft tool; seeing it in finance suggests an active internal attack',
    option_c_pl: 'Alert C - skoro użytkownik zgłasza problem, jego doświadczenie ma najwyższy priorytet', option_c_en: 'Alert C - because the user reported the issue, their experience should take top priority',
    option_d_pl: 'Wszystkie trzy mają identyczny priorytet - rozpatruję je chronologicznie', option_d_en: 'All three have the same priority - I handle them in chronological order',
    option_e_pl: '', option_e_en: '',
    correct_answer: 'B', points: '3', has_confidence: 'TRUE', order: 5, active: 'TRUE',
  },

  // M3 — Incident Analysis (L2)
  {
    id: 'P3.1', module_id: 'M3', type: 'single',
    question_pl: 'EDR zgłasza podejrzany proces na stacji roboczej: powershell.exe uruchomiony przez winword.exe z argumentami zawierającymi zakodowany Base64 string. Jakie kroki podejmujesz?',
    question_en: 'EDR reports a suspicious process on a workstation: powershell.exe launched by winword.exe with arguments containing a Base64-encoded string. What do you do?',
    option_a_pl: 'Blokuję PowerShell na wszystkich stacjach w organizacji', option_a_en: 'Block PowerShell on every workstation in the organization',
    option_b_pl: 'Sprawdzam treść dokumentu Word, ale dalej nie analizuję - to pewnie makro do formatowania', option_b_en: 'Check the Word document but stop there - it is probably just a formatting macro',
    option_c_pl: 'Dekoduję Base64, analizuję co PowerShell próbuje wykonać, sprawdzam parent-child process chain, weryfikuję kontakty z podejrzanymi IP i szukam podobnych zdarzeń', option_c_en: 'Decode the Base64, analyze what PowerShell is trying to execute, inspect the parent-child process chain, verify suspicious IP contacts, and hunt for similar events',
    option_d_pl: 'Eskalować do L3 tylko z opisem alertu i nie robić własnej analizy', option_d_en: 'Escalate to L3 with the alert description only and do no further analysis',
    option_e_pl: '', option_e_en: '',
    correct_answer: 'C', points: '5', has_confidence: 'TRUE', order: 1, active: 'TRUE',
  },
  {
    id: 'P3.2', module_id: 'M3', type: 'single',
    question_pl: 'Podczas analizy incydentu odkrywasz, że atakujący użył skradzionych hashy NTLM do uwierzytelnienia się na innym hoście bez znajomości hasła. Jak mapujesz tę technikę w MITRE ATT&CK?',
    question_en: 'During incident analysis you discover that the attacker used stolen NTLM hashes to authenticate to another host without knowing the password. How do you map this technique in MITRE ATT&CK?',
    option_a_pl: 'Taktyka: Lateral Movement (TA0008), technika: Pass-the-Hash (T1550.002) - Use Alternate Authentication Material', option_a_en: 'Tactic: Lateral Movement (TA0008), technique: Pass-the-Hash (T1550.002) - Use Alternate Authentication Material',
    option_b_pl: 'Taktyka: Credential Access (TA0006), technika: Brute Force (T1110)', option_b_en: 'Tactic: Credential Access (TA0006), technique: Brute Force (T1110)',
    option_c_pl: 'Taktyka: Initial Access (TA0001), technika: Valid Accounts (T1078)', option_c_en: 'Tactic: Initial Access (TA0001), technique: Valid Accounts (T1078)',
    option_d_pl: 'Taktyka: Persistence (TA0003), technika: Account Manipulation (T1098)', option_d_en: 'Tactic: Persistence (TA0003), technique: Account Manipulation (T1098)',
    option_e_pl: '', option_e_en: '',
    correct_answer: 'A', points: '5', has_confidence: 'TRUE', order: 2, active: 'TRUE',
  },
  {
    id: 'P3.3', module_id: 'M3', type: 'single',
    question_pl: 'Podejrzewasz lateral movement w sieci. Jakie zdarzenia (Event IDs) w logach Active Directory sprawdzasz w pierwszej kolejności i dlaczego?',
    question_en: 'You suspect lateral movement in the network. Which Active Directory event IDs do you check first, and why?',
    option_a_pl: 'Event ID 4720 i 4726 - atakujący zawsze tworzą konta backdoor', option_a_en: 'Event ID 4720 and 4726 - attackers always create backdoor accounts',
    option_b_pl: 'Event ID 1102 - jeśli ktoś czyści logi, to mamy dowód ataku', option_b_en: 'Event ID 1102 - if someone clears logs, that alone proves the attack',
    option_c_pl: 'Event ID 4624 (zwłaszcza logon type 3), 4648 i 4672 - szukam nietypowych logowań sieciowych i użycia uprawnień', option_c_en: 'Event ID 4624 (especially logon type 3), 4648, and 4672 - I look for unusual network logons and privilege use',
    option_d_pl: 'Event ID 4688 - to najważniejsze zdarzenie w każdej analizie', option_d_en: 'Event ID 4688 - it is always the most important event in every investigation',
    option_e_pl: '', option_e_en: '',
    correct_answer: 'C', points: '5', has_confidence: 'TRUE', order: 3, active: 'TRUE',
  },
  {
    id: 'P3.4', module_id: 'M3', type: 'single',
    question_pl: 'Chcesz stworzyć regułę korelacyjną w SIEM wykrywającą potencjalny brute-force na konta AD. Jakie elementy bierzesz pod uwagę?',
    question_en: 'You want to create a SIEM correlation rule to detect a potential brute-force attack on AD accounts. What do you include?',
    option_a_pl: 'Próg: 3 nieudane logowania w ciągu godziny - lepiej mieć za dużo alertów niż coś przegapić', option_a_en: 'Threshold: 3 failed logons in one hour - better to have too many alerts than miss something',
    option_b_pl: 'Definiuję próg (np. co najmniej 10 nieudanych logowań w 5 minut), wykluczam konta serwisowe, uwzględniam kontekst IP i dodaję warunek sukcesu po serii niepowodzeń', option_b_en: 'Define a threshold (for example at least 10 failed logons in 5 minutes), exclude service accounts, include source IP context, and add a success-after-failures condition',
    option_c_pl: 'Tworzę regułę 1:1 - jeden nieudany login oznacza jeden alert', option_c_en: 'Create a 1:1 rule - one failed login means one alert',
    option_d_pl: 'Korzystam tylko z wbudowanych reguł SIEM i niczego nie modyfikuję', option_d_en: 'Use only built-in SIEM rules and never tune them',
    option_e_pl: '', option_e_en: '',
    correct_answer: 'B', points: '5', has_confidence: 'TRUE', order: 4, active: 'TRUE',
  },
  {
    id: 'P3.5', module_id: 'M3', type: 'single',
    question_pl: 'Potwierdzasz, że stacja robocza w dziale HR jest zainfekowana i aktywnie komunikuje się z serwerem C2. Jakie wstępne działania containment podejmujesz?',
    question_en: 'You confirm that a workstation in HR is infected and actively communicating with a C2 server. What initial containment actions do you take?',
    option_a_pl: 'Wyłączam komputer przyciskiem power, żeby natychmiast przerwać komunikację', option_a_en: 'Power the machine off immediately to stop the communication',
    option_b_pl: 'Izoluję host przez EDR (network containment), zachowuję go włączonego dla forensics, blokuję C2 na firewallu/proxy i sprawdzam inne hosty kontaktujące się z tym IP', option_b_en: 'Isolate the host with EDR network containment, keep it powered on for forensics, block the C2 on firewall/proxy, and check for other hosts talking to the same IP',
    option_c_pl: 'Informuję użytkownika, żeby nie korzystał z komputera i czekam na decyzję managera', option_c_en: 'Tell the user not to use the workstation and wait for a manager decision',
    option_d_pl: 'Blokuję IP C2 na firewallu i zamykam incydent - problem rozwiązany', option_d_en: 'Block the C2 IP on the firewall and close the incident - problem solved',
    option_e_pl: '', option_e_en: '',
    correct_answer: 'B', points: '5', has_confidence: 'TRUE', order: 5, active: 'TRUE',
  },

  // M4 — Threat Hunting & Forensics (L3)
  {
    id: 'P4.1', module_id: 'M4', type: 'single',
    question_pl: 'Otrzymujesz raport CTI o grupie APT atakującej sektor finansowy za pomocą spear-phishingu z makrami Office. Jak budujesz hipotezę do threat huntingu?',
    question_en: 'You receive a CTI report about an APT group targeting finance through spear phishing with Office macros. How do you build a threat-hunting hypothesis?',
    option_a_pl: 'Szukam dokładnych IOC z raportu. Jeśli ich nie ma w logach, kończymy hunt', option_a_en: 'Search for the exact IOCs from the report. If they are not in the logs, the hunt is over',
    option_b_pl: 'Formułuję hipotezę o zachowaniach typu Office -> rundll32/regsvr32, nietypowych DLL i beaconingu, definiuję źródła danych i buduję zapytania pod anomalie', option_b_en: 'Form a behavior-based hypothesis around Office -> rundll32/regsvr32, unusual DLL paths, and beaconing, then define data sources and hunt queries for anomalies',
    option_c_pl: 'Proszę IT o przeskanowanie wszystkich stacji antywirusem z aktualnymi sygnaturami', option_c_en: 'Ask IT to scan every workstation with updated antivirus signatures',
    option_d_pl: 'Tworzę jedną regułę na IOC z raportu i czekam na alerty', option_d_en: 'Create one rule based on the report IOCs and wait for alerts',
    option_e_pl: '', option_e_en: '',
    correct_answer: 'B', points: '8', has_confidence: 'TRUE', order: 1, active: 'TRUE',
  },
  {
    id: 'P4.2', module_id: 'M4', type: 'single',
    question_pl: 'Otrzymujesz próbkę podejrzanego pliku DLL znalezionego na zainfekowanym hoście. Jak podchodzisz do analizy w sandboxie?',
    question_en: 'You receive a suspicious DLL sample found on an infected host. How do you approach sandbox analysis?',
    option_a_pl: 'Uruchamiam plik na swojej maszynie wirtualnej z dostępem do Internetu, żeby zobaczyć pełne zachowanie', option_a_en: 'Run the file on my own virtual machine with internet access to observe its full behavior',
    option_b_pl: 'Wrzucam plik do VirusTotal i czekam. Jeśli jest ponad 10 detekcji, to na pewno malware', option_b_en: 'Upload the file to VirusTotal and wait. If there are more than 10 detections, it is definitely malware',
    option_c_pl: 'Zaczynam od analizy statycznej: strings, imports, entropia sekcji, certyfikaty. Potem uruchamiam sandbox i dokumentuję procesy, rejestr, sieć, IOC i TTP', option_c_en: 'Start with static analysis: strings, imports, section entropy, certificates. Then run a sandbox and document processes, registry, network activity, IOCs, and TTPs',
    option_d_pl: 'Wysyłam plik do innego zespołu L3, bo to nie moja odpowiedzialność', option_d_en: 'Send the sample to another L3 team because it is not my responsibility',
    option_e_pl: '', option_e_en: '',
    correct_answer: 'C', points: '8', has_confidence: 'TRUE', order: 2, active: 'TRUE',
  },
  {
    id: 'P4.3', module_id: 'M4', type: 'single',
    question_pl: 'Potrzebujesz reguły SIGMA dla PowerShell uruchamianego z zakodowanym poleceniem Base64. Które elementy są kluczowe?',
    question_en: 'You need a SIGMA rule for PowerShell executed with a Base64-encoded command. Which elements are essential?',
    option_a_pl: 'Źródło: Sysmon Event ID 1 lub Windows 4688. Selekcja: powershell.exe z -enc / -EncodedCommand lub wzorcem Base64. Parent process = Office / wscript / cmd. Uwzględniam false positives', option_a_en: 'Source: Sysmon Event ID 1 or Windows 4688. Selection: powershell.exe with -enc / -EncodedCommand or a Base64 pattern. Parent process = Office / wscript / cmd. Include false positives',
    option_b_pl: 'Blokuję PowerShell na wszystkich stacjach - to najskuteczniejsza detekcja', option_b_en: 'Block PowerShell everywhere - that is the best detection strategy',
    option_c_pl: 'Szukam dowolnego użycia PowerShell. Każde uruchomienie jest podejrzane', option_c_en: 'Look for any use of PowerShell. Every execution is suspicious',
    option_d_pl: 'Tworzę regułę wyłącznie na Invoke-Mimikatz w command line', option_d_en: 'Create a rule only for Invoke-Mimikatz in the command line',
    option_e_pl: '', option_e_en: '',
    correct_answer: 'A', points: '8', has_confidence: 'TRUE', order: 3, active: 'TRUE',
  },
  {
    id: 'P4.4', module_id: 'M4', type: 'single',
    question_pl: 'Podejrzewasz fileless malware, którego nie wykrywa skan dysku. Jak podchodzisz do analizy memory dump?',
    question_en: 'You suspect fileless malware that is not visible in disk scans. How do you approach memory-dump analysis?',
    option_a_pl: 'Restartujemy host i skanujemy dysk ponownie lepszym antywirusem', option_a_en: 'Restart the host and scan the disk again with a better antivirus',
    option_b_pl: 'Sprawdzam listę procesów w Task Managerze i szukam dziwnych nazw', option_b_en: 'Check the process list in Task Manager and look for strange names',
    option_c_pl: 'Tworzę memory dump (np. WinPmem) i analizuję go w Volatility: pslist / psscan, malfind, dlllist / ldrmodules, netscan, anomalia w VAD', option_c_en: 'Capture a memory dump (for example with WinPmem) and analyze it in Volatility: pslist / psscan, malfind, dlllist / ldrmodules, netscan, and VAD anomalies',
    option_d_pl: 'Kopiuję podejrzane pliki z dysku i analizuję je offline', option_d_en: 'Copy suspicious files from disk and analyze them offline',
    option_e_pl: '', option_e_en: '',
    correct_answer: 'C', points: '8', has_confidence: 'TRUE', order: 4, active: 'TRUE',
  },
  {
    id: 'P4.5', module_id: 'M4', type: 'single',
    question_pl: 'Twoja reguła detekcji generuje 200 alertów dziennie, z czego 95% to false positives. Jak podchodzisz do optymalizacji?',
    question_en: 'Your detection rule generates 200 alerts per day and 95% of them are false positives. How do you optimize it?',
    option_a_pl: 'Wyłączam regułę - przy 95% FP nie ma sensu jej utrzymywać', option_a_en: 'Disable the rule - at 95% false positives it is not worth keeping',
    option_b_pl: 'Obniżam severity, żeby alerty mniej przeszkadzały', option_b_en: 'Lower the severity so the alerts bother analysts less',
    option_c_pl: 'Analizuję false positives, identyfikuję wzorce, buduję whitelisty oparte o kontekst, robię backtesting na danych historycznych i monitoruję FP rate po zmianach', option_c_en: 'Analyze false positives, identify patterns, create context-aware whitelists, backtest on historical data, and monitor the FP rate after changes',
    option_d_pl: 'Tworzę duplikat reguły z innymi parametrami i uruchamiam obie jednocześnie', option_d_en: 'Create a duplicate rule with different parameters and run both at the same time',
    option_e_pl: '', option_e_en: '',
    correct_answer: 'C', points: '8', has_confidence: 'TRUE', order: 5, active: 'TRUE',
  },

  // M5 — Strategy & Management (Manager)
  {
    id: 'P5.1', module_id: 'M5', type: 'single',
    question_pl: 'Zarząd prosi Cię o zdefiniowanie KPI dla zespołu SOC. Które metryki wybierasz jako kluczowe?',
    question_en: 'The board asks you to define KPIs for the SOC team. Which metrics do you consider essential?',
    option_a_pl: 'Liczba zamkniętych ticketów na analityka - im więcej, tym lepiej', option_a_en: 'Number of closed tickets per analyst - the more, the better',
    option_b_pl: 'MTTD, MTTR, false positive rate, coverage MITRE ATT&CK i dwell time - każda z metryk odpowiada na inne pytanie o skuteczność SOC', option_b_en: 'MTTD, MTTR, false positive rate, MITRE ATT&CK coverage, and dwell time - each metric answers a different question about SOC effectiveness',
    option_c_pl: 'Zero incydentów bezpieczeństwa w miesiącu - to najlepszy KPI', option_c_en: 'Zero security incidents per month - that is the best KPI',
    option_d_pl: 'Uptime SIEM - jeśli SIEM działa, to SOC działa', option_d_en: 'SIEM uptime - if the SIEM is online, the SOC is performing well',
    option_e_pl: '', option_e_en: '',
    correct_answer: 'B', points: '8', has_confidence: 'TRUE', order: 1, active: 'TRUE',
  },
  {
    id: 'P5.2', module_id: 'M5', type: 'single',
    question_pl: 'Dostajesz zadanie zbudowania procesu Incident Response w organizacji, która go nie ma. Od czego zaczynasz?',
    question_en: 'You are asked to build an incident-response process in an organization that does not have one. Where do you start?',
    option_a_pl: 'Kupuję narzędzie SOAR - automatyzacja rozwiąże problem braku procesu', option_a_en: 'Buy a SOAR platform - automation will solve the missing process',
    option_b_pl: 'Kopiuję procedury IR z innej organizacji bez dostosowania', option_b_en: 'Copy IR procedures from another organization without adaptation',
    option_c_pl: 'Zaczynam od zrozumienia środowiska: aktywa, źródła logów, stakeholderzy. Definiuję fazy IR, role, odpowiedzialności, playbooki dla top-5 scenariuszy i kanały komunikacji kryzysowej', option_c_en: 'Start by understanding the environment: assets, log sources, stakeholders. Define IR phases, roles, responsibilities, playbooks for the top five scenarios, and crisis-communication channels',
    option_d_pl: 'Zatrudniam więcej analityków - ludzie są ważniejsi niż procesy', option_d_en: 'Hire more analysts - people matter more than process',
    option_e_pl: '', option_e_en: '',
    correct_answer: 'C', points: '8', has_confidence: 'TRUE', order: 2, active: 'TRUE',
  },
  {
    id: 'P5.3', module_id: 'M5', type: 'single',
    question_pl: 'Zarządzasz zespołem SOC pracującym 24/7 na zmianach. Jakie wyzwania widzisz i jak sobie z nimi radzisz?',
    question_en: 'You manage a 24/7 shift-based SOC team. What challenges do you see and how do you handle them?',
    option_a_pl: 'Głównym wyzwaniem są koszty - zmianowość jest po prostu droga', option_a_en: 'The main challenge is cost - shift work is expensive',
    option_b_pl: 'Nie widzę szczególnych wyzwań - ludzie powinni być przyzwyczajeni do zmian', option_b_en: 'I do not see special challenges - people should already be used to shift work',
    option_c_pl: 'Widzę ryzyko burnoutu, utraty kontekstu przy handoffie, nierównego obciążenia i wolniejszego rozwoju. Odpowiadam strukturami handoff, rotacją zmian, ścieżką kariery, 1:1 i ćwiczeniami cross-shift', option_c_en: 'I see burnout risk, context loss during handoff, uneven workload, and slower growth. I respond with structured handoffs, shift rotation, career paths, 1:1s, and cross-shift exercises',
    option_d_pl: 'Na noce zatrudniam głównie mniej doświadczone osoby', option_d_en: 'I staff night shifts mainly with less experienced people',
    option_e_pl: '', option_e_en: '',
    correct_answer: 'C', points: '8', has_confidence: 'TRUE', order: 3, active: 'TRUE',
  },
  {
    id: 'P5.4', module_id: 'M5', type: 'single',
    question_pl: 'Jakie wymagania dyrektywy NIS2 lub regulacji DORA bezpośrednio wpływają na pracę SOC?',
    question_en: 'Which NIS2 or DORA requirements directly affect SOC operations?',
    option_a_pl: 'NIS2 dotyczy tylko infrastruktury krytycznej, więc większości SOC-ów nie dotyczy', option_a_en: 'NIS2 applies only to critical infrastructure, so it does not affect most SOCs',
    option_b_pl: 'NIS2: raportowanie incydentów i zarządzanie ryzykiem łańcucha dostaw. DORA: testy odporności, zarządzanie ICT i raportowanie. Dla SOC oznacza to procesy raportowania, współpracę z legal/compliance i monitoring third-party', option_b_en: 'NIS2: incident reporting and supply-chain risk management. DORA: resilience testing, ICT risk management, and reporting. For SOC this means reporting processes, legal/compliance coordination, and third-party monitoring',
    option_c_pl: 'To temat tylko dla prawników i compliance - SOC zajmuje się techniką', option_c_en: 'This is only for legal and compliance teams - SOC should focus on technical work',
    option_d_pl: 'Wystarczy wdrożyć ISO 27001 - to pokrywa wszystkie wymagania', option_d_en: 'Implementing ISO 27001 alone covers every requirement',
    option_e_pl: '', option_e_en: '',
    correct_answer: 'B', points: '8', has_confidence: 'TRUE', order: 4, active: 'TRUE',
  },
  {
    id: 'P5.5', module_id: 'M5', type: 'single',
    question_pl: 'Planujesz tabletop exercise dla swojego zespołu SOC. Jak projektujesz scenariusz i czego oczekujesz?',
    question_en: 'You are planning a tabletop exercise for your SOC team. How do you design the scenario and what outcomes do you expect?',
    option_a_pl: 'Scenariusz: \'haker atakuje sieć\'. Cel: sprawdzić, czy analitycy wiedzą co robić. Wynik: pass/fail', option_a_en: 'Scenario: \'a hacker attacks the network\'. Goal: check whether analysts know what to do. Outcome: pass/fail',
    option_b_pl: 'Biorę gotowy scenariusz z Internetu bez dostosowania do sektora i środowiska', option_b_en: 'Use a ready-made scenario from the internet without tailoring it to the organization',
    option_c_pl: 'Buduję scenariusz na realnym zagrożeniu dla sektora, planuję injecty czasowe i stakeholderów z różnych działów. Oczekuję wykrycia luk w procesie, walidacji kanałów i konkretnych action items', option_c_en: 'Build the scenario around a realistic sector threat, plan timed injects and cross-functional stakeholders. Expect process gaps, validation of communication channels, and actionable improvements',
    option_d_pl: 'Tabletop to strata czasu - lepiej zainwestować w automatyzację', option_d_en: 'Tabletops are a waste of time - automation is a better investment',
    option_e_pl: '', option_e_en: '',
    correct_answer: 'C', points: '8', has_confidence: 'TRUE', order: 5, active: 'TRUE',
  },

  // M6 — Self-assessment & Motivation
  {
    id: 'P6.1', module_id: 'M6', type: 'open',
    question_pl: 'Jaki obszar cyberbezpieczeństwa najbardziej Cię fascynuje i dlaczego?',
    question_en: 'Which area of cybersecurity fascinates you the most, and why?',
    option_a_pl: '', option_a_en: '', option_b_pl: '', option_b_en: '',
    option_c_pl: '', option_c_en: '', option_d_pl: '', option_d_en: '',
    option_e_pl: '', option_e_en: '',
    correct_answer: '', points: '0', has_confidence: 'FALSE', order: 1, active: 'TRUE',
  },
  {
    id: 'P6.2', module_id: 'M6', type: 'open',
    question_pl: 'Jakie masz luki kompetencyjne, nad którymi aktualnie pracujesz?',
    question_en: 'Which competency gaps are you actively working on right now?',
    option_a_pl: '', option_a_en: '', option_b_pl: '', option_b_en: '',
    option_c_pl: '', option_c_en: '', option_d_pl: '', option_d_en: '',
    option_e_pl: '', option_e_en: '',
    correct_answer: '', points: '0', has_confidence: 'FALSE', order: 2, active: 'TRUE',
  },
  {
    id: 'P6.3', module_id: 'M6', type: 'open',
    question_pl: 'Co chcesz osiągnąć zawodowo w ciągu najbliższych 2 lat?',
    question_en: 'What do you want to achieve professionally over the next 2 years?',
    option_a_pl: '', option_a_en: '', option_b_pl: '', option_b_en: '',
    option_c_pl: '', option_c_en: '', option_d_pl: '', option_d_en: '',
    option_e_pl: '', option_e_en: '',
    correct_answer: '', points: '0', has_confidence: 'FALSE', order: 3, active: 'TRUE',
  },
  {
    id: 'P6.4', module_id: 'M6', type: 'single',
    question_pl: 'Który model pracy w SOC jest dla Ciebie najbardziej atrakcyjny?',
    question_en: 'Which SOC work model is the most attractive to you?',
    option_a_pl: 'Praca zmianowa 24/7 - lubię dynamikę i różnorodność', option_a_en: '24/7 shift work - I enjoy dynamism and variety',
    option_b_pl: 'Praca w godzinach standardowych z on-call - wolę stabilność', option_b_en: 'Standard working hours with on-call - I prefer stability',
    option_c_pl: 'Praca projektowa (threat hunting, detection engineering) - wolę głębokie tematy', option_c_en: 'Project-oriented work (threat hunting, detection engineering) - I prefer deep focus topics',
    option_d_pl: 'Zarządzanie i budowanie zespołu - wolę perspektywę strategiczną', option_d_en: 'Management and team building - I prefer the strategic perspective',
    option_e_pl: '', option_e_en: '',
    correct_answer: '', points: '0', has_confidence: 'FALSE', order: 4, active: 'TRUE',
  },
];

// ── Sheets column headers ──
const MODULE_HEADERS = ['id', 'name_pl', 'name_en', 'type', 'gate_percent', 'order'];
const QUESTION_HEADERS = [
  'id', 'module_id', 'type', 'question_pl', 'question_en',
  'option_a_pl', 'option_a_en', 'option_b_pl', 'option_b_en',
  'option_c_pl', 'option_c_en', 'option_d_pl', 'option_d_en',
  'option_e_pl', 'option_e_en',
  'correct_answer', 'points', 'has_confidence', 'order', 'active',
];

async function main() {
  console.log('Seeding Google Sheets with question bank data...\n');

  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  // ── Write Modules ──
  const moduleRows = MODULES.map((m) =>
    MODULE_HEADERS.map((h) => String(m[h] ?? '')),
  );

  // Clear existing data first, then write headers + data
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEETS_ID,
    range: "'Moduły'!A1:Z100",
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEETS_ID,
    range: "'Moduły'!A1",
    valueInputOption: 'RAW',
    requestBody: { values: [MODULE_HEADERS, ...moduleRows] },
  });

  console.log(`  Moduły: ${moduleRows.length} rows written`);

  // ── Write Questions ──
  const questionRows = QUESTIONS.map((q) =>
    QUESTION_HEADERS.map((h) => String(q[h] ?? '')),
  );

  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEETS_ID,
    range: "'Pytania'!A1:Z200",
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEETS_ID,
    range: "'Pytania'!A1",
    valueInputOption: 'RAW',
    requestBody: { values: [QUESTION_HEADERS, ...questionRows] },
  });

  console.log(`  Pytania: ${questionRows.length} rows written`);
  console.log('\nDone! Check Google Sheets to verify.');
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
