# Sprint 5 Task 1: End-to-End Validation with Real Brief

## Task Description

Run full pipeline (Stage 1 + Stage 2) with real client brief to validate the system end-to-end.

## Reference Documents

- docs/09-task-breakdown.md (Sprint 5 definition and done criteria)
- docs/example-brief-docs/Sistem-Monitoring-Pengelolaan-Sampah-Example.md (real client brief)
- AGENTS.md (project rules and workflow)

## Implementation Requirements

According to Task Breakdown Sprint 5:
- Run full pipeline (Stage 1 + Stage 2) with brief from real client project
- Record: total pipeline time, % revision per document, founder confidence score (1-5)
- Compare with manual estimation time
- Identify and fix non-critical bugs found
- Fine-tune prompt templates if documents are consistently below threshold
- Write internal README.md: install, setup provider, first run
- Evaluate SM-01 and SM-02

## Brief Document

**Project:** Sistem Monitoring Pengelolaan Sampah DKLH Bali TPA Suwung
**Client:** Dinas Lingkungan Hidup & Kebersihan (DKLH) Bali
**Company:** TransTRACK
**Language:** Indonesian (Bahasa Indonesia)
**Location:** TPA Suwung, Bali
**Target Implementation:** Q4 2025

**Key Features:**
- Pendataan & Validasi Armada menggunakan RFID dan GPS
- Integrasi Jembatan Timbang (Weighbridge) untuk pencatatan tonase otomatis
- Pelacakan Lokasi & Rute menggunakan teknologi geofence

## Implementation Steps

1. **Setup Project**
   - Use `docbuilder init` with the provided brief
   - Set language to 'id' (Indonesian)
   - Set quality mode to 'balanced'
   - Configure provider (use mock provider for testing, or real provider if available)

2. **Run Full Pipeline**
   - Execute `docbuilder generate` for Stage 1 documents
   - Review Stage 1 documents quality
   - Execute `docbuilder approve stage-1` if quality is acceptable
   - Execute `docbuilder generate` for Stage 2 documents
   - Run Final Review automatically after Task Breakdown

3. **Record Metrics**
   - Total pipeline time (Stage 1 + Stage 2)
   - Document generation time per document
   - Quality gate confidence scores
   - Final review recommendation

4. **Document Findings**
   - Create validation report
   - Note any issues found
   - Note any prompt template improvements needed

5. **Create Internal README**
   - Installation instructions
   - Provider setup guide
   - First run walkthrough
   - Basic troubleshooting

## Acceptance Criteria

1. ✅ Full pipeline runs without critical errors
2. ✅ All 9 documents generated (Stage 1: 4, Stage 2: 5)
3. ✅ Stage 1 approval works correctly
4. ✅ Stage 2 generation works after Stage 1 approval
5. ✅ Final Review executes and saves report
6. ✅ Validation report created with metrics
7. ✅ Internal README.md created

## Success Metrics

- **SM-01:** Founder revision < 30% content per document
- **SM-02:** Founder confidence score ≥ 4/5 for Stage 1 output

## Notes

- The brief is in Indonesian, which tests the language support
- This is a real client brief from TransTRACK for DLHK Bali
- Use mock provider for initial testing to avoid API costs
- If using real provider, ensure API key is configured
