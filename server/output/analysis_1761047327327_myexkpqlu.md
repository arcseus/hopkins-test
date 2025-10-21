# VDR Lite — Diligence Summary
_Date: 2025-10-21_

## Summary

Financial: Key financial red flags include persistent negative operating cash flow, improving from -£450k in 2024Q1 to -£220k in 2025Q3, alongside a significant increase in Days Sales Outstanding (DSO) from 58 to 102 days, indicating collection delays. Deferred revenue is declining despite upfront recognition of multi-year fees, potentially affecting revenue stability. Debt covenant breaches are critical, with the Debt Service Coverage Ratio (DSCR) at 0.90x as of September 2025, below the required 1.20x, leading to a waiver request. VAT arrears of £185k are outstanding, with a HMRC Time-to-Pay plan active through January 2026. Additionally, incomplete documentation and an ongoing HMRC enquiry on R&D claims raise tax compliance risks.

Legal: Several legal concerns arise from intellectual property and contract terms. The UK trademark "Highland Analytics" expired without renewal, and a key patent was abandoned due to unpaid fees. Core machine learning model weights are pledged under an all-asset debenture. Contractual risks include exclusivity clauses limiting market opportunities, termination-for-convenience provisions with 30-day notice across multiple agreements, and restrictions on assignment without prior consent. Audit rights granted to resellers may expose operational scrutiny. IT security compliance is inadequate: SOC 2 certification has not started, the last penetration test in November 2022 revealed medium findings and was not fully re-tested, and a data breach in April 2025 exposed approximately 4,200 user emails without notification to the Information Commissioner’s Office. Three public-sector accounts remain on vendor-paper Data Protection Agreements, increasing regulatory risk.

Operations: Operational risks include a 12-month staff turnover rate of 18%, with Sales turnover notably high at 29%. Three key person risks are identified: CTO, Lead ML, and Head of Sales. Two employees depend on Skilled Worker visas, with a sponsor licence action plan due by June 2025. An open harassment claim is currently in early conciliation, potentially affecting workforce stability.

Commercial: Customer concentration is a major concern, with the top five customers representing 82% of revenue and the largest customer accounting for 42%. Several contracts allow termination for convenience with 30-day notice, posing revenue volatility. Price review clauses and thin margins with certain resellers add pricing pressure. Contractual provisions such as consent requirements for assignment and change-of-control clauses limit flexibility. The unsecured convertible note carries an 8% PIK interest and includes a Most Favored Nation clause, potentially complicating future private equity rounds. These factors collectively highlight significant risks to revenue stability, contract security, and financial health.

## Aggregate

| Category    | Facts | Red flags |
|-------------|------:|----------:|
| Financial   |    10 |         10 |
| Legal       |     20 |         15 |
| Operations  |     0 |         0 |
| Commercial  |     20 |         14 |
| Other       |     0 |         0 |

## Documents

### 1) 02_Financials_Quarterly_Extract.csv  _(financial)_
**Facts**
- Revenue increased from £1.8m in 2024Q1 to £3.2m in 2025Q3
- Gross margin declined from 78% in 2024Q1 to 70% in 2025Q3
- EBITDA improved from -£300k in 2024Q1 to +£180k in 2025Q3
- Operating cash flow remained negative, improving from -£450k in 2024Q1 to -£220k in 2025Q3
- DSO increased from 58 days in 2024Q1 to 102 days in 2025Q3

**Red flags**
- Negative operating cash flow throughout all quarters
- Increasing DSO indicating collections delays
- Deferred revenue decreasing despite multi-year fees recognized upfront
- Notes indicate accounts receivable stretch and enterprise deployment delays
- Revenue recognition change may affect comparability

### 2) 03_Customer_Concentration.csv  _(commercial)_
**Facts**
- Top 5 customers represent 82% of revenue share in the last twelve months
- Largest customer, Crown Digital Directorate, accounts for 42% revenue share with a 12-month contract term
- Contract termination terms vary: 30-day convenience for some, breach-only for others
- Credit terms range from 45 to 60 days
- Noted risks include single point-of-failure and thin margins with certain customers

**Red flags**
- Single point-of-failure risk with largest customer (Crown Digital Directorate)
- Several contracts allow termination for convenience with 30-day notice, posing revenue risk
- Some contracts require consent for termination or change of control, potentially limiting flexibility
- Price review clause every 6 months with EuroTel AG could lead to downward pricing pressure
- Thin margin noted with reseller Novarch Ltd

### 3) 04_Material_Contracts_Summary.txt  _(legal)_
**Facts**
- Master Services Agreement with Crown Digital Directorate has a 12-month term with renewal by mutual agreement
- Either party may terminate the Master Services Agreement with 30 days' notice for convenience
- Change of control allows either party to terminate the Master Services Agreement
- Framework Agreement with EuroTel AG includes exclusivity preventing HAL from serving EuroTel's top-5 competitors in DACH region during the term
- Reseller Agreement with Novarch Ltd specifies a 70%/30% revenue share and allows channel returns within 45 days

**Red flags**
- Exclusivity clause in Framework Agreement may limit HAL's market opportunities
- Termination for convenience with 30 days' notice may lead to contract instability
- Assignment prohibited without prior written consent may restrict flexibility
- Audit rights granted to reseller may expose HAL to operational scrutiny

### 4) 05_IP_Register.csv  _(legal)_
**Facts**
- Trademark 'Highland Analytics (word)' in UK expired on 2024-09-12 with no renewal filed
- Patent 'Data Normalization for Heterogeneous Streams' under PCT abandoned as of 2023-12-01 due to unpaid fees
- Trademark 'HAL Insight (logo)' registered with EUIPO, valid until 2028-05-06
- Copyright 'Model Weights v3.2' in UK is unregistered and pledged to lender
- All-asset debenture includes intellectual property

**Red flags**
- Expired trademark with no renewal filed
- Abandoned patent due to unpaid fees and rights lapsed
- Unregistered copyright pledged to lender

### 5) 06_HR_Schedule.csv  _(commercial)_
**Facts**
- 56 full-time employees across Engineering (28), Sales (12), Operations (9), and G&A (7)
- 12 contractors, split evenly between UK and remote locations (Poland, Ukraine), several with over 12 months continuous service
- 12-month staff turnover rate is 18%, with Sales turnover at 29%
- 7 open headcount positions: 3 Engineering, 2 Customer Service, 2 Sales
- 3 key person risks identified: CTO, Lead ML, Head of Sales

**Red flags**
- 2 employees dependent on Skilled Worker visas with sponsor licence action plan due by June 2025
- 1 open harassment claim currently in early conciliation

### 6) 07_IT_Security_Compliance.txt  _(legal)_
**Facts**
- ISO 27001 certification is in progress
- SOC 2 certification has not started
- Last penetration test conducted in November 2022 with medium findings and not fully re-tested
- Approximately 180,000 user emails and usage metadata are stored, subject to UK/EU GDPR
- Data Protection Agreements cover 61% of customers; three public-sector accounts remain on vendor-paper DPAs

**Red flags**
- Incident on 2025-04-14 exposed approximately 4,200 user emails due to credential stuffing
- Information Commissioner's Office (ICO) was not notified of the incident
- Last penetration test not fully re-tested after medium findings
- SOC 2 certification not started
- Three public-sector accounts still on vendor-paper DPAs

### 7) 08_Debt_Schedule.csv  _(commercial)_
**Facts**
- Term Loan A principal outstanding is GBP 4,500,000 with maturity on 2026-03-31
- Term Loan A interest rate is SONIA + 5.25% with all-asset debenture security including IP
- Term Loan A covenants include DSCR >= 1.20x and Net Leverage <= 3.5x
- DSCR was 0.90x as of 2025-09, and a waiver was requested in 2025-10
- Revolving Credit Facility (RCF) principal outstanding is GBP 1,000,000 with maturity on 2026-03-31 and interest rate SONIA + 4.75%

**Red flags**
- DSCR covenant breach with DSCR at 0.90x below required 1.20x as of 2025-09
- Waiver requested for covenant breach indicating potential financial distress
- Convertible Note is unsecured with 8% PIK interest and includes MFN clause that may affect private equity round

### 8) 09_Tax_Compliance_Summary.txt  _(commercial)_
**Facts**
- VAT arrears of £185k covering Q4 2024 to Q1 2025
- HMRC Time-to-Pay plan in place through January 2026
- R&D Expenditure Credit claims for FY2023–FY2024 under HMRC enquiry opened August 2025
- Documentation for R&D claims is incomplete
- Intercompany management fees to Founder HoldCo: £420k for FY2024 and £280k YTD 2025 with limited benchmarking

**Red flags**
- VAT arrears indicate overdue tax payments
- Incomplete documentation for R&D claims may risk HMRC disallowance
- HMRC enquiry on R&D claims suggests potential tax compliance issues
- Limited benchmarking on intercompany fees may raise transfer pricing risks

### 9) 10_QA_Log_Excerpt.txt  _(legal)_
**Facts**
- SOC 2 Type II report has not yet been initiated
- Pen-test re-test scheduled for first half of 2026
- Some key customer contracts require consent for assignment on change of control
- Largest public-sector contract allows termination for convenience
- 2025 Q2 revenue step-up due to upfront recognition of multi-year fees aligned to industry norms

**Red flags**
- Absence of SOC 2 Type II report as of document date
- Key customer contracts may restrict assignment without consent
- Largest public-sector contract includes unilateral termination for convenience

### 10) 01_Executive_Summary.txt  _(financial)_
**Facts**
- TTM revenue to 2025-09-30 is £11.2m with 37% YoY growth
- Gross margin declined from 78% to 70%
- EBITDA positive since 2025-Q1 but operating cash flow remains negative
- DSO stretched to 102 days and deferred revenue is falling
- Largest customer accounts for 42% of TTM revenue with 30-day termination-for-convenience clause

**Red flags**
- High customer concentration with termination and change-of-control risks
- Several contracts have consent, MFN, and exclusivity provisions limiting pricing flexibility
- UK trademark lapsed and PCT application abandoned; core ML model weights pledged under debenture
- No SOC 2 compliance; last penetration test in 2022; April 2025 data breach exposing ~4,200 emails not reported to ICO
- DSCR at 0.90x below 1.20x covenant with waiver requested; VAT arrears on HMRC Time-to-Pay plan

## Needs review

_All documents processed successfully._