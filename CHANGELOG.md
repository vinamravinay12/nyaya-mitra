# Changelog

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Scenario-first triage engine built on declarative Situation Playbooks
- Five situations: rental deposit, unpaid salary, defective purchase,
  unauthorised transaction, bounced cheque
- Deadline engine computing limitation periods in UTC, with per-rule
  applicability conditions
- Triage scoring across red flags, deadlines and amount at stake, always returned
  with reasons
- Route selection that keeps unavailable options visible with the reason
- Adaptive intake asking one decisive question at a time
- Explicit out-of-scope refusal for criminal, family, immigration and active
  litigation matters
- Gemini classification behind a server-side proxy, with retry on transient
  upstream failures
- Prompt-injection detection tuned not to fire on genuine contract language
- React client with `jsx-a11y` strict enforcement and axe assertions throughout

### Fixed

- Limitation rules applied to every case regardless of relevance; the s.6
  dispossession clock was shown to users who had not been locked out
- Red flag escalation used the playbook's generic lawyer specialisation instead
  of the specific one attached to the flag
- The Rent Authority route asserted a state had not adopted the Model Tenancy Act
  when adoption had never been determined
- Quota rejections (429) were retried, spending three times the daily allowance
  per user request
- Quota exhaustion was reported as a transient failure, inviting a retry that
  could not succeed
- An unsupported situation rendered as an application error rather than as a gap
  in coverage
- The stub client scanned the whole prompt, including our own out-of-scope
  keyword list, and classified every scenario as out of scope
