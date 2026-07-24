import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  certStatus,
  certStatusIcon,
  certStatusLabel,
  certStatusTone,
  dutyRoleIcon,
  rankIcon,
  severityIcon,
  severityTone,
} from './domainDisplay'

describe('certStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-24T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "unknown" when the date is null', () => {
    expect(certStatus(null)).toBe('unknown')
  })

  it('returns "expired" for a date in the past', () => {
    expect(certStatus('2026-01-01')).toBe('expired')
  })

  it('returns "expiringSoon" for a date within the warning window', () => {
    expect(certStatus('2026-08-10')).toBe('expiringSoon')
  })

  it('returns "valid" for a date well in the future', () => {
    expect(certStatus('2027-01-01')).toBe('valid')
  })
})

describe('display lookup tables', () => {
  it('has a tone/icon/label entry for every CertStatus', () => {
    const statuses = ['unknown', 'valid', 'expiringSoon', 'expired'] as const
    for (const status of statuses) {
      expect(certStatusTone[status]).toBeDefined()
      expect(certStatusIcon[status]).toBeDefined()
      expect(certStatusLabel[status]).toBeDefined()
    }
  })

  it('has an icon entry for every PilotRank', () => {
    for (const rank of ['Trainee', 'FirstOfficer', 'Captain', 'ChiefPilot'] as const) {
      expect(rankIcon[rank]).toBeDefined()
    }
  })

  it('has an icon entry for every DutyRole', () => {
    for (const role of ['PIC', 'SIC', 'Instructor', 'Observer', 'Trainee'] as const) {
      expect(dutyRoleIcon[role]).toBeDefined()
    }
  })

  it('has a tone/icon entry for every SeverityLevel', () => {
    for (const level of ['Low', 'Medium', 'High', 'Critical'] as const) {
      expect(severityTone[level]).toBeDefined()
      expect(severityIcon[level]).toBeDefined()
    }
  })
})
