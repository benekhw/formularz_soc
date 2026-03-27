import type { Module, Question } from '../types/questions';

export const MODULES: Module[] = [
  {
    id: 'M1',
    thresholdPercent: null,
    technical: false,
    title: { pl: 'Moduł 1. Profil kandydata', en: 'Module 1. Candidate profile' },
    shortTitle: { pl: 'Profil', en: 'Profile' },
    description: {
      pl: 'Kontekst do interpretacji wyniku: doświadczenie, tło SOC/Blue Team, certyfikaty, preferowana ścieżka i samoocena.',
      en: 'Context for interpreting the result: experience, SOC/Blue Team background, certifications, preferred path, and self-assessment.',
    },
  },
  {
    id: 'M2',
    thresholdPercent: 60,
    technical: true,
    title: { pl: 'Moduł 2. Fundamenty SOC (L1 baseline)', en: 'Module 2. SOC fundamentals (L1 baseline)' },
    shortTitle: { pl: 'L1', en: 'L1' },
    description: {
      pl: 'Pytania bazowe dla kandydatów wchodzących do SOC. Wynik poniżej progu kończy ścieżkę techniczną na poziomie poniżej L1.',
      en: 'Baseline questions for candidates entering SOC. A score below threshold ends the technical path below L1.',
    },
  },
  {
    id: 'M3',
    thresholdPercent: 50,
    technical: true,
    title: { pl: 'Moduł 3. Analiza incydentów (L2 baseline)', en: 'Module 3. Incident analysis (L2 baseline)' },
    shortTitle: { pl: 'L2', en: 'L2' },
    description: {
      pl: 'Sprawdza praktyczne podejście do triage, MITRE ATT&CK, korelacji logów i containmentu.',
      en: 'Assesses practical triage, MITRE ATT&CK mapping, log correlation, and containment thinking.',
    },
  },
  {
    id: 'M4',
    thresholdPercent: 50,
    technical: true,
    title: { pl: 'Moduł 4. Threat Hunting i Forensics (L3 baseline)', en: 'Module 4. Threat hunting and forensics (L3 baseline)' },
    shortTitle: { pl: 'L3', en: 'L3' },
    description: {
      pl: 'Weryfikuje hypothesis-driven hunting, sandboxing, SIGMA, memory forensics i tuning detekcji.',
      en: 'Validates hypothesis-driven hunting, sandboxing, SIGMA, memory forensics, and detection tuning.',
    },
  },
  {
    id: 'M5',
    thresholdPercent: 70,
    technical: true,
    title: { pl: 'Moduł 5. Strategia i zarządzanie (Manager baseline)', en: 'Module 5. Strategy and management (Manager baseline)' },
    shortTitle: { pl: 'MGR', en: 'MGR' },
    description: {
      pl: 'Moduł leadershipowy uruchamiany dla ścieżki managementu i dla kandydatów, którzy dotarli do poziomu L3.',
      en: 'Leadership module activated for the management path and for candidates who reached the L3 level.',
    },
  },
  {
    id: 'M6',
    thresholdPercent: null,
    technical: false,
    title: { pl: 'Moduł 6. Samoocena i motywacja', en: 'Module 6. Self-assessment and motivation' },
    shortTitle: { pl: 'Refleksja', en: 'Reflection' },
    description: {
      pl: 'Pytania otwarte budujące kontekst motywacyjny i pozwalające porównać deklaracje z rzeczywistym wynikiem.',
      en: 'Open questions that build motivational context and compare declared level with the actual result.',
    },
  },
];

export const QUESTION_BANK: Question[] = [
  {
    id: 'P1.1', moduleId: 'M1', type: 'single', points: 0, confidenceEnabled: false,
    sourceRef: 'SOC_Scout_Hub_Pytania.xlsx / P1.1',
    prompt: { pl: 'Ile lat pracujesz w obszarze cyberbezpieczeństwa / IT Security?', en: 'How many years have you worked in cybersecurity / IT security?' },
    options: [
      { id: 'A', text: { pl: 'Nie mam doświadczenia (studia / kursy / samodzielna nauka)', en: 'I do not have professional experience yet (studies / courses / self-learning)' } },
      { id: 'B', text: { pl: 'Poniżej 2 lat', en: 'Less than 2 years' } },
      { id: 'C', text: { pl: '2-4 lata', en: '2-4 years' } },
      { id: 'D', text: { pl: '4-7 lat', en: '4-7 years' } },
      { id: 'E', text: { pl: 'Powyżej 7 lat', en: 'More than 7 years' } },
    ],
  },
  {
    id: 'P1.2', moduleId: 'M1', type: 'single', points: 0, confidenceEnabled: false,
    sourceRef: 'SOC_Scout_Hub_Pytania.xlsx / P1.2',
    prompt: { pl: 'Czy pracowałeś/aś kiedykolwiek w strukturach SOC lub zespole Blue Team?', en: 'Have you ever worked in a SOC structure or a Blue Team environment?' },
    options: [
      { id: 'A', text: { pl: 'Nie, nigdy', en: 'No, never' } },
      { id: 'B', text: { pl: 'Tak, w SOC', en: 'Yes, in a SOC' } },
      { id: 'C', text: { pl: 'Tak, w Blue Team / CERT / CSIRT (ale nie w klasycznym SOC)', en: 'Yes, in Blue Team / CERT / CSIRT (but not in a classic SOC)' } },
      { id: 'D', text: { pl: 'Tak, ale w roli niezwiązanej z analizą (np. administracja, wsparcie)', en: 'Yes, but in a role not focused on analysis (for example administration or support)' } },
    ],
  },
  {
    id: 'P1.3', moduleId: 'M1', type: 'multi', points: 0, confidenceEnabled: false,
    sourceRef: 'SOC_Scout_Hub_Pytania.xlsx / P1.3',
    prompt: { pl: 'Jakie certyfikaty z zakresu cyberbezpieczeństwa posiadasz? (wielokrotny wybór)', en: 'Which cybersecurity certifications do you hold? (multiple choice)' },
    options: [
      { id: 'A', text: { pl: 'Nie posiadam certyfikatów', en: 'I do not hold any certifications' } },
      { id: 'B', text: { pl: 'CompTIA Security+ / Google Cybersec / SC-900 / CEH (entry-level)', en: 'CompTIA Security+ / Google Cybersec / SC-900 / CEH (entry level)' } },
      { id: 'C', text: { pl: 'CySA+ / GCIH / BTL1 / SC-200 (mid-level)', en: 'CySA+ / GCIH / BTL1 / SC-200 (mid level)' } },
      { id: 'D', text: { pl: 'GCFA / GREM / OSCP / eCIR (advanced)', en: 'GCFA / GREM / OSCP / eCIR (advanced)' } },
    ],
  },
  {
    id: 'P1.4', moduleId: 'M1', type: 'single', points: 0, confidenceEnabled: false,
    sourceRef: 'SOC_Scout_Hub_Pytania.xlsx / P1.4',
    prompt: { pl: 'Jakiego rodzaju rolę rozważasz?', en: 'Which type of role are you considering?' },
    options: [
      { id: 'A', text: { pl: 'Analityk / Operator SOC (praca techniczna z alertami i incydentami)', en: 'SOC analyst / operator (hands-on work with alerts and incidents)' } },
      { id: 'B', text: { pl: 'Senior Analyst / Team Lead (praca techniczna + mentoring)', en: 'Senior analyst / team lead (technical work plus mentoring)' } },
      { id: 'C', text: { pl: 'Management / Kierownik SOC (strategia, zarządzanie zespołem, procesy)', en: 'Management / SOC manager (strategy, team management, processes)' } },
    ],
  },
  {
    id: 'P1.5', moduleId: 'M1', type: 'single', points: 0, confidenceEnabled: false,
    sourceRef: 'SOC_Scout_Hub_Pytania.xlsx / P1.5',
    prompt: { pl: 'Na jakim poziomie sam siebie oceniasz?', en: 'How do you rate your current level?' },
    options: [
      { id: 'A', text: { pl: 'Junior / Początkujący (L1) - uczę się podstaw, szukam pierwszej roli', en: 'Junior / beginner (L1) - I am learning the basics and looking for my first role' } },
      { id: 'B', text: { pl: 'Mid / Samodzielny (L2) - samodzielnie analizuję incydenty, znam MITRE ATT&CK', en: 'Mid / independent (L2) - I can analyze incidents on my own and I know MITRE ATT&CK' } },
      { id: 'C', text: { pl: 'Senior / Ekspert (L3) - prowadzę threat hunting, piszę reguły detekcji, prowadzę IR', en: 'Senior / expert (L3) - I run threat hunts, write detection rules, and lead incident response' } },
      { id: 'D', text: { pl: 'Manager / Lider - zarządzam zespołem SOC, odpowiadam za procesy i strategię', en: 'Manager / leader - I manage a SOC team and own processes and strategy' } },
    ],
  },
  // M2 - SOC Fundamentals (L1)
  {
    id: 'P2.1', moduleId: 'M2', type: 'single', points: 3, correctAnswer: 'B', confidenceEnabled: true,
    sourceRef: 'SOC_Scout_Hub_Pytania.xlsx / P2.1',
    prompt: { pl: 'W kolejce SIEM pojawia się alert: \'Suspicious outbound connection to known C2 IP\'. Po wstępnej analizie ustalasz, że połączenie pochodzi z serwera aktualizacji oprogramowania antywirusowego. Jak klasyfikujesz to zdarzenie?', en: 'A SIEM queue shows an alert: \'Suspicious outbound connection to known C2 IP\'. After initial analysis you determine that the connection comes from an antivirus update server. How do you classify the event?' },
    options: [
      { id: 'A', text: { pl: 'True Positive - każde połączenie z adresem C2 to potwierdzona infekcja', en: 'True positive - every connection to a C2 address confirms an infection' } },
      { id: 'B', text: { pl: 'False Positive - po weryfikacji kontekstu alert jest fałszywy, bo źródłem jest legalny serwer aktualizacji', en: 'False positive - after context verification the alert is benign because the source is a legitimate update server' } },
      { id: 'C', text: { pl: 'Eskalować natychmiast do L2 bez dalszej analizy - to nie moja decyzja', en: 'Escalate immediately to L2 without further analysis - this is not my decision to make' } },
      { id: 'D', text: { pl: 'Zignorować alert - serwery aktualizacji zawsze generują fałszywe alarmy', en: 'Ignore the alert - update servers always generate false alarms' } },
    ],
  },
  {
    id: 'P2.2', moduleId: 'M2', type: 'single', points: 3, correctAnswer: 'C', confidenceEnabled: true,
    sourceRef: 'SOC_Scout_Hub_Pytania.xlsx / P2.2',
    prompt: { pl: 'Która warstwa modelu OSI jest celem ataku DDoS typu HTTP Flood i dlaczego ataki na tej warstwie są trudniejsze do wykrycia?', en: 'Which OSI layer is targeted by an HTTP Flood DDoS attack, and why are attacks at that layer harder to detect?' },
    options: [
      { id: 'A', text: { pl: 'Warstwa 3 (Network) - bo ataki DDoS zawsze celują w routing', en: 'Layer 3 (Network) - because DDoS attacks always target routing' } },
      { id: 'B', text: { pl: 'Warstwa 4 (Transport) - bo SYN flood to główny typ DDoS', en: 'Layer 4 (Transport) - because SYN flood is the main DDoS type' } },
      { id: 'C', text: { pl: 'Warstwa 7 (Application) - bo ruch wygląda jak legalne zapytania HTTP i trudno go odfiltrować bez analizy wzorców', en: 'Layer 7 (Application) - because the traffic looks like legitimate HTTP requests and is hard to filter without pattern analysis' } },
      { id: 'D', text: { pl: 'Warstwa 2 (Data Link) - bo ataki DDoS celują w switch flooding', en: 'Layer 2 (Data Link) - because DDoS attacks target switch flooding' } },
    ],
  },
  {
    id: 'P2.3', moduleId: 'M2', type: 'single', points: 3, correctAnswer: 'A', confidenceEnabled: true,
    sourceRef: 'SOC_Scout_Hub_Pytania.xlsx / P2.3',
    prompt: { pl: 'Dostajesz alert: \'Host 10.0.15.42 initiated connection to external IP 185.x.x.x on port 443 - not in baseline\'. Co robisz jako pierwsze?', en: 'You receive an alert: \'Host 10.0.15.42 initiated connection to external IP 185.x.x.x on port 443 - not in baseline\'. What is the first thing you do?' },
    options: [
      { id: 'A', text: { pl: 'Sprawdzam kontekst: jaki to host, kto na nim pracuje, czy IP jest znane w threat intelligence i czy połączenie jest jednorazowe czy cykliczne', en: 'Check the context: what host it is, who uses it, whether the IP appears in threat intelligence, and whether the connection is one-off or recurring' } },
      { id: 'B', text: { pl: 'Natychmiast izoluję host od sieci - każde nieznane połączenie wychodzące to potencjalny C2', en: 'Immediately isolate the host from the network - every unknown outbound connection is a potential C2' } },
      { id: 'C', text: { pl: 'Zamykam alert jako false positive - port 443 to HTTPS, więc to normalne', en: 'Close the alert as a false positive - port 443 means HTTPS, so it must be normal' } },
      { id: 'D', text: { pl: 'Czekam na kolejne alerty z tego hosta, żeby potwierdzić wzorzec', en: 'Wait for more alerts from the same host before doing anything' } },
    ],
  },
  {
    id: 'P2.4', moduleId: 'M2', type: 'single', points: 3, correctAnswer: 'C', confidenceEnabled: true,
    sourceRef: 'SOC_Scout_Hub_Pytania.xlsx / P2.4',
    prompt: { pl: 'Jaka jest główna funkcja SIEM w centrum operacji bezpieczeństwa?', en: 'What is the main role of a SIEM in a security operations center?' },
    options: [
      { id: 'A', text: { pl: 'SIEM służy wyłącznie do przechowywania logów na potrzeby compliance', en: 'A SIEM exists only to store logs for compliance purposes' } },
      { id: 'B', text: { pl: 'SIEM automatycznie blokuje wszystkie ataki wykryte w logach', en: 'A SIEM automatically blocks every attack detected in logs' } },
      { id: 'C', text: { pl: 'SIEM agreguje logi z wielu źródeł, koreluje zdarzenia i generuje alerty, dając analitykom centralny widok na bezpieczeństwo organizacji', en: 'A SIEM aggregates logs from many sources, correlates events, and generates alerts to give analysts a central security view' } },
      { id: 'D', text: { pl: 'SIEM zastępuje firewalla i EDR - wystarczy jeden system do ochrony', en: 'A SIEM replaces the firewall and EDR - one system is enough for protection' } },
    ],
  },
  {
    id: 'P2.5', moduleId: 'M2', type: 'single', points: 3, correctAnswer: 'B', confidenceEnabled: true,
    sourceRef: 'SOC_Scout_Hub_Pytania.xlsx / P2.5',
    prompt: { pl: 'W ciągu jednej godziny otrzymujesz trzy alerty. Który z nich powinien mieć najwyższy priorytet i dlaczego?\nAlert A: wielokrotne nieudane logowania SSH z zewnętrznego IP\nAlert B: EDR wykrył proces mimikatz.exe na stacji w dziale finansowym\nAlert C: użytkownik zgłasza pop-upy z reklamami', en: 'Within one hour you receive three alerts. Which one should have the highest priority and why?\nAlert A: multiple failed SSH logons from an external IP\nAlert B: EDR detected mimikatz.exe on a workstation in finance\nAlert C: a user reports ad pop-ups' },
    options: [
      { id: 'A', text: { pl: 'Alert A - brute-force SSH na serwer publiczny to najpoważniejsze zagrożenie', en: 'Alert A - brute-force SSH on a public server is the most serious threat' } },
      { id: 'B', text: { pl: 'Alert B - mimikatz to narzędzie do kradzieży poświadczeń; jego obecność w finansach sugeruje aktywny atak wewnętrzny', en: 'Alert B - mimikatz is a credential theft tool; seeing it in finance suggests an active internal attack' } },
      { id: 'C', text: { pl: 'Alert C - skoro użytkownik zgłasza problem, jego doświadczenie ma najwyższy priorytet', en: 'Alert C - because the user reported the issue, their experience should take top priority' } },
      { id: 'D', text: { pl: 'Wszystkie trzy mają identyczny priorytet - rozpatruję je chronologicznie', en: 'All three have the same priority - I handle them in chronological order' } },
    ],
  },
  // M3 - Incident Analysis (L2)
  {
    id: 'P3.1', moduleId: 'M3', type: 'single', points: 5, correctAnswer: 'C', confidenceEnabled: true,
    sourceRef: 'SOC_Scout_Hub_Pytania.xlsx / P3.1',
    prompt: { pl: 'EDR zgłasza podejrzany proces na stacji roboczej: powershell.exe uruchomiony przez winword.exe z argumentami zawierającymi zakodowany Base64 string. Jakie kroki podejmujesz?', en: 'EDR reports a suspicious process on a workstation: powershell.exe launched by winword.exe with arguments containing a Base64-encoded string. What do you do?' },
    options: [
      { id: 'A', text: { pl: 'Blokuję PowerShell na wszystkich stacjach w organizacji', en: 'Block PowerShell on every workstation in the organization' } },
      { id: 'B', text: { pl: 'Sprawdzam treść dokumentu Word, ale dalej nie analizuję - to pewnie makro do formatowania', en: 'Check the Word document but stop there - it is probably just a formatting macro' } },
      { id: 'C', text: { pl: 'Dekoduję Base64, analizuję co PowerShell próbuje wykonać, sprawdzam parent-child process chain, weryfikuję kontakty z podejrzanymi IP i szukam podobnych zdarzeń', en: 'Decode the Base64, analyze what PowerShell is trying to execute, inspect the parent-child process chain, verify suspicious IP contacts, and hunt for similar events' } },
      { id: 'D', text: { pl: 'Eskalować do L3 tylko z opisem alertu i nie robić własnej analizy', en: 'Escalate to L3 with the alert description only and do no further analysis' } },
    ],
  },
  {
    id: 'P3.2', moduleId: 'M3', type: 'single', points: 5, correctAnswer: 'A', confidenceEnabled: true,
    sourceRef: 'SOC_Scout_Hub_Pytania.xlsx / P3.2',
    prompt: { pl: 'Podczas analizy incydentu odkrywasz, że atakujący użył skradzionych hashy NTLM do uwierzytelnienia się na innym hoście bez znajomości hasła. Jak mapujesz tę technikę w MITRE ATT&CK?', en: 'During incident analysis you discover that the attacker used stolen NTLM hashes to authenticate to another host without knowing the password. How do you map this technique in MITRE ATT&CK?' },
    options: [
      { id: 'A', text: { pl: 'Taktyka: Lateral Movement (TA0008), technika: Pass-the-Hash (T1550.002) - Use Alternate Authentication Material', en: 'Tactic: Lateral Movement (TA0008), technique: Pass-the-Hash (T1550.002) - Use Alternate Authentication Material' } },
      { id: 'B', text: { pl: 'Taktyka: Credential Access (TA0006), technika: Brute Force (T1110)', en: 'Tactic: Credential Access (TA0006), technique: Brute Force (T1110)' } },
      { id: 'C', text: { pl: 'Taktyka: Initial Access (TA0001), technika: Valid Accounts (T1078)', en: 'Tactic: Initial Access (TA0001), technique: Valid Accounts (T1078)' } },
      { id: 'D', text: { pl: 'Taktyka: Persistence (TA0003), technika: Account Manipulation (T1098)', en: 'Tactic: Persistence (TA0003), technique: Account Manipulation (T1098)' } },
    ],
  },
  {
    id: 'P3.3', moduleId: 'M3', type: 'single', points: 5, correctAnswer: 'C', confidenceEnabled: true,
    sourceRef: 'SOC_Scout_Hub_Pytania.xlsx / P3.3',
    prompt: { pl: 'Podejrzewasz lateral movement w sieci. Jakie zdarzenia (Event IDs) w logach Active Directory sprawdzasz w pierwszej kolejności i dlaczego?', en: 'You suspect lateral movement in the network. Which Active Directory event IDs do you check first, and why?' },
    options: [
      { id: 'A', text: { pl: 'Event ID 4720 i 4726 - atakujący zawsze tworzą konta backdoor', en: 'Event ID 4720 and 4726 - attackers always create backdoor accounts' } },
      { id: 'B', text: { pl: 'Event ID 1102 - jeśli ktoś czyści logi, to mamy dowód ataku', en: 'Event ID 1102 - if someone clears logs, that alone proves the attack' } },
      { id: 'C', text: { pl: 'Event ID 4624 (zwłaszcza logon type 3), 4648 i 4672 - szukam nietypowych logowań sieciowych i użycia uprawnień', en: 'Event ID 4624 (especially logon type 3), 4648, and 4672 - I look for unusual network logons and privilege use' } },
      { id: 'D', text: { pl: 'Event ID 4688 - to najważniejsze zdarzenie w każdej analizie', en: 'Event ID 4688 - it is always the most important event in every investigation' } },
    ],
  },
  {
    id: 'P3.4', moduleId: 'M3', type: 'single', points: 5, correctAnswer: 'B', confidenceEnabled: true,
    sourceRef: 'SOC_Scout_Hub_Pytania.xlsx / P3.4',
    prompt: { pl: 'Chcesz stworzyć regułę korelacyjną w SIEM wykrywającą potencjalny brute-force na konta AD. Jakie elementy bierzesz pod uwagę?', en: 'You want to create a SIEM correlation rule to detect a potential brute-force attack on AD accounts. What do you include?' },
    options: [
      { id: 'A', text: { pl: 'Próg: 3 nieudane logowania w ciągu godziny - lepiej mieć za dużo alertów niż coś przegapić', en: 'Threshold: 3 failed logons in one hour - better to have too many alerts than miss something' } },
      { id: 'B', text: { pl: 'Definiuję próg (np. co najmniej 10 nieudanych logowań w 5 minut), wykluczam konta serwisowe, uwzględniam kontekst IP i dodaję warunek sukcesu po serii niepowodzeń', en: 'Define a threshold (for example at least 10 failed logons in 5 minutes), exclude service accounts, include source IP context, and add a success-after-failures condition' } },
      { id: 'C', text: { pl: 'Tworzę regułę 1:1 - jeden nieudany login oznacza jeden alert', en: 'Create a 1:1 rule - one failed login means one alert' } },
      { id: 'D', text: { pl: 'Korzystam tylko z wbudowanych reguł SIEM i niczego nie modyfikuję', en: 'Use only built-in SIEM rules and never tune them' } },
    ],
  },
  {
    id: 'P3.5', moduleId: 'M3', type: 'single', points: 5, correctAnswer: 'B', confidenceEnabled: true,
    sourceRef: 'SOC_Scout_Hub_Pytania.xlsx / P3.5',
    prompt: { pl: 'Potwierdzasz, że stacja robocza w dziale HR jest zainfekowana i aktywnie komunikuje się z serwerem C2. Jakie wstępne działania containment podejmujesz?', en: 'You confirm that a workstation in HR is infected and actively communicating with a C2 server. What initial containment actions do you take?' },
    options: [
      { id: 'A', text: { pl: 'Wyłączam komputer przyciskiem power, żeby natychmiast przerwać komunikację', en: 'Power the machine off immediately to stop the communication' } },
      { id: 'B', text: { pl: 'Izoluję host przez EDR (network containment), zachowuję go włączonego dla forensics, blokuję C2 na firewallu/proxy i sprawdzam inne hosty kontaktujące się z tym IP', en: 'Isolate the host with EDR network containment, keep it powered on for forensics, block the C2 on firewall/proxy, and check for other hosts talking to the same IP' } },
      { id: 'C', text: { pl: 'Informuję użytkownika, żeby nie korzystał z komputera i czekam na decyzję managera', en: 'Tell the user not to use the workstation and wait for a manager decision' } },
      { id: 'D', text: { pl: 'Blokuję IP C2 na firewallu i zamykam incydent - problem rozwiązany', en: 'Block the C2 IP on the firewall and close the incident - problem solved' } },
    ],
  },
  // M4 - Threat Hunting & Forensics (L3)
  {
    id: 'P4.1', moduleId: 'M4', type: 'single', points: 8, correctAnswer: 'B', confidenceEnabled: true,
    sourceRef: 'SOC_Scout_Hub_Pytania.xlsx / P4.1',
    prompt: { pl: 'Otrzymujesz raport CTI o grupie APT atakującej sektor finansowy za pomocą spear-phishingu z makrami Office. Jak budujesz hipotezę do threat huntingu?', en: 'You receive a CTI report about an APT group targeting finance through spear phishing with Office macros. How do you build a threat-hunting hypothesis?' },
    options: [
      { id: 'A', text: { pl: 'Szukam dokładnych IOC z raportu. Jeśli ich nie ma w logach, kończymy hunt', en: 'Search for the exact IOCs from the report. If they are not in the logs, the hunt is over' } },
      { id: 'B', text: { pl: 'Formułuję hipotezę o zachowaniach typu Office -> rundll32/regsvr32, nietypowych DLL i beaconingu, definiuję źródła danych i buduję zapytania pod anomalie', en: 'Form a behavior-based hypothesis around Office -> rundll32/regsvr32, unusual DLL paths, and beaconing, then define data sources and hunt queries for anomalies' } },
      { id: 'C', text: { pl: 'Proszę IT o przeskanowanie wszystkich stacji antywirusem z aktualnymi sygnaturami', en: 'Ask IT to scan every workstation with updated antivirus signatures' } },
      { id: 'D', text: { pl: 'Tworzę jedną regułę na IOC z raportu i czekam na alerty', en: 'Create one rule based on the report IOCs and wait for alerts' } },
    ],
  },
  {
    id: 'P4.2', moduleId: 'M4', type: 'single', points: 8, correctAnswer: 'C', confidenceEnabled: true,
    sourceRef: 'SOC_Scout_Hub_Pytania.xlsx / P4.2',
    prompt: { pl: 'Otrzymujesz próbkę podejrzanego pliku DLL znalezionego na zainfekowanym hoście. Jak podchodzisz do analizy w sandboxie?', en: 'You receive a suspicious DLL sample found on an infected host. How do you approach sandbox analysis?' },
    options: [
      { id: 'A', text: { pl: 'Uruchamiam plik na swojej maszynie wirtualnej z dostępem do Internetu, żeby zobaczyć pełne zachowanie', en: 'Run the file on my own virtual machine with internet access to observe its full behavior' } },
      { id: 'B', text: { pl: 'Wrzucam plik do VirusTotal i czekam. Jeśli jest ponad 10 detekcji, to na pewno malware', en: 'Upload the file to VirusTotal and wait. If there are more than 10 detections, it is definitely malware' } },
      { id: 'C', text: { pl: 'Zaczynam od analizy statycznej: strings, imports, entropia sekcji, certyfikaty. Potem uruchamiam sandbox i dokumentuję procesy, rejestr, sieć, IOC i TTP', en: 'Start with static analysis: strings, imports, section entropy, certificates. Then run a sandbox and document processes, registry, network activity, IOCs, and TTPs' } },
      { id: 'D', text: { pl: 'Wysyłam plik do innego zespołu L3, bo to nie moja odpowiedzialność', en: 'Send the sample to another L3 team because it is not my responsibility' } },
    ],
  },
  {
    id: 'P4.3', moduleId: 'M4', type: 'single', points: 8, correctAnswer: 'A', confidenceEnabled: true,
    sourceRef: 'SOC_Scout_Hub_Pytania.xlsx / P4.3',
    prompt: { pl: 'Potrzebujesz reguły SIGMA dla PowerShell uruchamianego z zakodowanym poleceniem Base64. Które elementy są kluczowe?', en: 'You need a SIGMA rule for PowerShell executed with a Base64-encoded command. Which elements are essential?' },
    options: [
      { id: 'A', text: { pl: 'Źródło: Sysmon Event ID 1 lub Windows 4688. Selekcja: powershell.exe z -enc / -EncodedCommand lub wzorcem Base64. Parent process = Office / wscript / cmd. Uwzględniam false positives', en: 'Source: Sysmon Event ID 1 or Windows 4688. Selection: powershell.exe with -enc / -EncodedCommand or a Base64 pattern. Parent process = Office / wscript / cmd. Include false positives' } },
      { id: 'B', text: { pl: 'Blokuję PowerShell na wszystkich stacjach - to najskuteczniejsza detekcja', en: 'Block PowerShell everywhere - that is the best detection strategy' } },
      { id: 'C', text: { pl: 'Szukam dowolnego użycia PowerShell. Każde uruchomienie jest podejrzane', en: 'Look for any use of PowerShell. Every execution is suspicious' } },
      { id: 'D', text: { pl: 'Tworzę regułę wyłącznie na Invoke-Mimikatz w command line', en: 'Create a rule only for Invoke-Mimikatz in the command line' } },
    ],
  },
  {
    id: 'P4.4', moduleId: 'M4', type: 'single', points: 8, correctAnswer: 'C', confidenceEnabled: true,
    sourceRef: 'SOC_Scout_Hub_Pytania.xlsx / P4.4',
    prompt: { pl: 'Podejrzewasz fileless malware, którego nie wykrywa skan dysku. Jak podchodzisz do analizy memory dump?', en: 'You suspect fileless malware that is not visible in disk scans. How do you approach memory-dump analysis?' },
    options: [
      { id: 'A', text: { pl: 'Restartujemy host i skanujemy dysk ponownie lepszym antywirusem', en: 'Restart the host and scan the disk again with a better antivirus' } },
      { id: 'B', text: { pl: 'Sprawdzam listę procesów w Task Managerze i szukam dziwnych nazw', en: 'Check the process list in Task Manager and look for strange names' } },
      { id: 'C', text: { pl: 'Tworzę memory dump (np. WinPmem) i analizuję go w Volatility: pslist / psscan, malfind, dlllist / ldrmodules, netscan, anomalia w VAD', en: 'Capture a memory dump (for example with WinPmem) and analyze it in Volatility: pslist / psscan, malfind, dlllist / ldrmodules, netscan, and VAD anomalies' } },
      { id: 'D', text: { pl: 'Kopiuję podejrzane pliki z dysku i analizuję je offline', en: 'Copy suspicious files from disk and analyze them offline' } },
    ],
  },
  {
    id: 'P4.5', moduleId: 'M4', type: 'single', points: 8, correctAnswer: 'C', confidenceEnabled: true,
    sourceRef: 'SOC_Scout_Hub_Pytania.xlsx / P4.5',
    prompt: { pl: 'Twoja reguła detekcji generuje 200 alertów dziennie, z czego 95% to false positives. Jak podchodzisz do optymalizacji?', en: 'Your detection rule generates 200 alerts per day and 95% of them are false positives. How do you optimize it?' },
    options: [
      { id: 'A', text: { pl: 'Wyłączam regułę - przy 95% FP nie ma sensu jej utrzymywać', en: 'Disable the rule - at 95% false positives it is not worth keeping' } },
      { id: 'B', text: { pl: 'Obniżam severity, żeby alerty mniej przeszkadzały', en: 'Lower the severity so the alerts bother analysts less' } },
      { id: 'C', text: { pl: 'Analizuję false positives, identyfikuję wzorce, buduję whitelisty oparte o kontekst, robię backtesting na danych historycznych i monitoruję FP rate po zmianach', en: 'Analyze false positives, identify patterns, create context-aware whitelists, backtest on historical data, and monitor the FP rate after changes' } },
      { id: 'D', text: { pl: 'Tworzę duplikat reguły z innymi parametrami i uruchamiam obie jednocześnie', en: 'Create a duplicate rule with different parameters and run both at the same time' } },
    ],
  },
  // M5 - Strategy & Management (Manager)
  {
    id: 'P5.1', moduleId: 'M5', type: 'single', points: 8, correctAnswer: 'B', confidenceEnabled: true,
    sourceRef: 'SOC_Scout_Hub_Pytania.xlsx / P5.1',
    prompt: { pl: 'Zarząd prosi Cię o zdefiniowanie KPI dla zespołu SOC. Które metryki wybierasz jako kluczowe?', en: 'The board asks you to define KPIs for the SOC team. Which metrics do you consider essential?' },
    options: [
      { id: 'A', text: { pl: 'Liczba zamkniętych ticketów na analityka - im więcej, tym lepiej', en: 'Number of closed tickets per analyst - the more, the better' } },
      { id: 'B', text: { pl: 'MTTD, MTTR, false positive rate, coverage MITRE ATT&CK i dwell time - każda z metryk odpowiada na inne pytanie o skuteczność SOC', en: 'MTTD, MTTR, false positive rate, MITRE ATT&CK coverage, and dwell time - each metric answers a different question about SOC effectiveness' } },
      { id: 'C', text: { pl: 'Zero incydentów bezpieczeństwa w miesiącu - to najlepszy KPI', en: 'Zero security incidents per month - that is the best KPI' } },
      { id: 'D', text: { pl: 'Uptime SIEM - jeśli SIEM działa, to SOC działa', en: 'SIEM uptime - if the SIEM is online, the SOC is performing well' } },
    ],
  },
  {
    id: 'P5.2', moduleId: 'M5', type: 'single', points: 8, correctAnswer: 'C', confidenceEnabled: true,
    sourceRef: 'SOC_Scout_Hub_Pytania.xlsx / P5.2',
    prompt: { pl: 'Dostajesz zadanie zbudowania procesu Incident Response w organizacji, która go nie ma. Od czego zaczynasz?', en: 'You are asked to build an incident-response process in an organization that does not have one. Where do you start?' },
    options: [
      { id: 'A', text: { pl: 'Kupuję narzędzie SOAR - automatyzacja rozwiąże problem braku procesu', en: 'Buy a SOAR platform - automation will solve the missing process' } },
      { id: 'B', text: { pl: 'Kopiuję procedury IR z innej organizacji bez dostosowania', en: 'Copy IR procedures from another organization without adaptation' } },
      { id: 'C', text: { pl: 'Zaczynam od zrozumienia środowiska: aktywa, źródła logów, stakeholderzy. Definiuję fazy IR, role, odpowiedzialności, playbooki dla top-5 scenariuszy i kanały komunikacji kryzysowej', en: 'Start by understanding the environment: assets, log sources, stakeholders. Define IR phases, roles, responsibilities, playbooks for the top five scenarios, and crisis-communication channels' } },
      { id: 'D', text: { pl: 'Zatrudniam więcej analityków - ludzie są ważniejsi niż procesy', en: 'Hire more analysts - people matter more than process' } },
    ],
  },
  {
    id: 'P5.3', moduleId: 'M5', type: 'single', points: 8, correctAnswer: 'C', confidenceEnabled: true,
    sourceRef: 'SOC_Scout_Hub_Pytania.xlsx / P5.3',
    prompt: { pl: 'Zarządzasz zespołem SOC pracującym 24/7 na zmianach. Jakie wyzwania widzisz i jak sobie z nimi radzisz?', en: 'You manage a 24/7 shift-based SOC team. What challenges do you see and how do you handle them?' },
    options: [
      { id: 'A', text: { pl: 'Głównym wyzwaniem są koszty - zmianowość jest po prostu droga', en: 'The main challenge is cost - shift work is expensive' } },
      { id: 'B', text: { pl: 'Nie widzę szczególnych wyzwań - ludzie powinni być przyzwyczajeni do zmian', en: 'I do not see special challenges - people should already be used to shift work' } },
      { id: 'C', text: { pl: 'Widzę ryzyko burnoutu, utraty kontekstu przy handoffie, nierównego obciążenia i wolniejszego rozwoju. Odpowiadam strukturami handoff, rotacją zmian, ścieżką kariery, 1:1 i ćwiczeniami cross-shift', en: 'I see burnout risk, context loss during handoff, uneven workload, and slower growth. I respond with structured handoffs, shift rotation, career paths, 1:1s, and cross-shift exercises' } },
      { id: 'D', text: { pl: 'Na noce zatrudniam głównie mniej doświadczone osoby', en: 'I staff night shifts mainly with less experienced people' } },
    ],
  },
  {
    id: 'P5.4', moduleId: 'M5', type: 'single', points: 8, correctAnswer: 'B', confidenceEnabled: true,
    sourceRef: 'SOC_Scout_Hub_Pytania.xlsx / P5.4',
    prompt: { pl: 'Jakie wymagania dyrektywy NIS2 lub regulacji DORA bezpośrednio wpływają na pracę SOC?', en: 'Which NIS2 or DORA requirements directly affect SOC operations?' },
    options: [
      { id: 'A', text: { pl: 'NIS2 dotyczy tylko infrastruktury krytycznej, więc większości SOC-ów nie dotyczy', en: 'NIS2 applies only to critical infrastructure, so it does not affect most SOCs' } },
      { id: 'B', text: { pl: 'NIS2: raportowanie incydentów i zarządzanie ryzykiem łańcucha dostaw. DORA: testy odporności, zarządzanie ICT i raportowanie. Dla SOC oznacza to procesy raportowania, współpracę z legal/compliance i monitoring third-party', en: 'NIS2: incident reporting and supply-chain risk management. DORA: resilience testing, ICT risk management, and reporting. For SOC this means reporting processes, legal/compliance coordination, and third-party monitoring' } },
      { id: 'C', text: { pl: 'To temat tylko dla prawników i compliance - SOC zajmuje się techniką', en: 'This is only for legal and compliance teams - SOC should focus on technical work' } },
      { id: 'D', text: { pl: 'Wystarczy wdrożyć ISO 27001 - to pokrywa wszystkie wymagania', en: 'Implementing ISO 27001 alone covers every requirement' } },
    ],
  },
  {
    id: 'P5.5', moduleId: 'M5', type: 'single', points: 8, correctAnswer: 'C', confidenceEnabled: true,
    sourceRef: 'SOC_Scout_Hub_Pytania.xlsx / P5.5',
    prompt: { pl: 'Planujesz tabletop exercise dla swojego zespołu SOC. Jak projektujesz scenariusz i czego oczekujesz?', en: 'You are planning a tabletop exercise for your SOC team. How do you design the scenario and what outcomes do you expect?' },
    options: [
      { id: 'A', text: { pl: 'Scenariusz: \'haker atakuje sieć\'. Cel: sprawdzić, czy analitycy wiedzą co robić. Wynik: pass/fail', en: 'Scenario: \'a hacker attacks the network\'. Goal: check whether analysts know what to do. Outcome: pass/fail' } },
      { id: 'B', text: { pl: 'Biorę gotowy scenariusz z Internetu bez dostosowania do sektora i środowiska', en: 'Use a ready-made scenario from the internet without tailoring it to the organization' } },
      { id: 'C', text: { pl: 'Buduję scenariusz na realnym zagrożeniu dla sektora, planuję injecty czasowe i stakeholderów z różnych działów. Oczekuję wykrycia luk w procesie, walidacji kanałów i konkretnych action items', en: 'Build the scenario around a realistic sector threat, plan timed injects and cross-functional stakeholders. Expect process gaps, validation of communication channels, and actionable improvements' } },
      { id: 'D', text: { pl: 'Tabletop to strata czasu - lepiej zainwestować w automatyzację', en: 'Tabletops are a waste of time - automation is a better investment' } },
    ],
  },
  // M6 - Self-assessment & Motivation
  {
    id: 'P6.1', moduleId: 'M6', type: 'open', points: 0, confidenceEnabled: false,
    sourceRef: 'SOC_Scout_Hub_Pytania.xlsx / P6.1',
    prompt: { pl: 'Jaki obszar cyberbezpieczeństwa najbardziej Cię fascynuje i dlaczego?', en: 'Which area of cybersecurity fascinates you the most, and why?' },
    placeholder: { pl: 'Opisz obszar, który najbardziej Cię wciąga, i co Ci w nim daje energię do rozwoju.', en: 'Describe the area that excites you most and what gives you momentum to grow in it.' },
  },
  {
    id: 'P6.2', moduleId: 'M6', type: 'open', points: 0, confidenceEnabled: false,
    sourceRef: 'SOC_Scout_Hub_Pytania.xlsx / P6.2',
    prompt: { pl: 'Jakie masz luki kompetencyjne, nad którymi aktualnie pracujesz?', en: 'Which competency gaps are you actively working on right now?' },
    placeholder: { pl: 'Wskaż obszary, które dzisiaj są dla Ciebie najtrudniejsze, i jak chcesz je nadrobić.', en: 'Point to the areas that are hardest for you today and how you plan to close them.' },
  },
  {
    id: 'P6.3', moduleId: 'M6', type: 'open', points: 0, confidenceEnabled: false,
    sourceRef: 'SOC_Scout_Hub_Pytania.xlsx / P6.3',
    prompt: { pl: 'Co chcesz osiągnąć zawodowo w ciągu najbliższych 2 lat?', en: 'What do you want to achieve professionally over the next 2 years?' },
    placeholder: { pl: 'Opisz swój najbliższy cel zawodowy i kierunek, w którym chcesz iść.', en: 'Describe your near-term career goal and the direction you want to grow toward.' },
  },
  {
    id: 'P6.4', moduleId: 'M6', type: 'single', points: 0, confidenceEnabled: false,
    sourceRef: 'SOC_Scout_Hub_Pytania.xlsx / P6.4',
    prompt: { pl: 'Który model pracy w SOC jest dla Ciebie najbardziej atrakcyjny?', en: 'Which SOC work model is the most attractive to you?' },
    options: [
      { id: 'A', text: { pl: 'Praca zmianowa 24/7 - lubię dynamikę i różnorodność', en: '24/7 shift work - I enjoy dynamism and variety' } },
      { id: 'B', text: { pl: 'Praca w godzinach standardowych z on-call - wolę stabilność', en: 'Standard working hours with on-call - I prefer stability' } },
      { id: 'C', text: { pl: 'Praca projektowa (threat hunting, detection engineering) - wolę głębokie tematy', en: 'Project-oriented work (threat hunting, detection engineering) - I prefer deep focus topics' } },
      { id: 'D', text: { pl: 'Zarządzanie i budowanie zespołu - wolę perspektywę strategiczną', en: 'Management and team building - I prefer the strategic perspective' } },
    ],
  },
];

// ── Mutable runtime data (can be replaced with Sheets data) ──

let _modules: Module[] = MODULES;
let _questions: Question[] = QUESTION_BANK;
let _source: 'hardcoded' | 'sheets' = 'hardcoded';

/**
 * Replace the active question bank with data loaded from Google Sheets.
 * Falls back silently if the data is empty (keeps hardcoded defaults).
 */
export function setQuestionsFromSheets(modules: Module[], questions: Question[]): void {
  if (modules.length > 0) _modules = modules;
  if (questions.length > 0) _questions = questions;
  if (modules.length > 0 || questions.length > 0) _source = 'sheets';
}

export function getQuestionSource(): string {
  return _source;
}

// ── Derived accessors (always read from current _modules / _questions) ──

export function getModules(): Module[] {
  return _modules;
}

export function getQuestionBank(): Question[] {
  return _questions;
}

export function getModuleIds(): string[] {
  return _modules.map((m) => m.id);
}

export function getTechnicalModuleIds(): string[] {
  return _modules.filter((m) => m.technical).map((m) => m.id);
}

// Keep static exports for backwards compatibility with tests & imports
export const MODULE_IDS = MODULES.map((m) => m.id);
export const TECHNICAL_MODULE_IDS = MODULES.filter((m) => m.technical).map((m) => m.id);

export function getModuleById(moduleId: string): Module | undefined {
  return _modules.find((m) => m.id === moduleId);
}

export function getQuestionsByModule(moduleId: string): Question[] {
  return _questions.filter((q) => q.moduleId === moduleId);
}

export function getQuestionById(questionId: string): Question | undefined {
  return _questions.find((q) => q.id === questionId);
}
