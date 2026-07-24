import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Crown,
  Eye,
  GraduationCap,
  HelpCircle,
  Info,
  Shield,
  ShieldCheck,
  User,
  UserCheck,
} from 'lucide-react'
import type { PilotRank } from '../types/auth'
import type { DutyRole } from '../types/crew'
import type { SeverityLevel } from '../types/crmReport'

const CERT_WARNING_DAYS = 30

export type CertStatus = 'unknown' | 'valid' | 'expiringSoon' | 'expired'

export function certStatus(date: string | null): CertStatus {
  if (!date) return 'unknown'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(date)
  const diffDays = Math.floor((expiry.getTime() - today.getTime()) / 86_400_000)
  if (diffDays < 0) return 'expired'
  if (diffDays <= CERT_WARNING_DAYS) return 'expiringSoon'
  return 'valid'
}

export const certStatusTone: Record<CertStatus, 'neutral' | 'green' | 'amber' | 'red'> = {
  unknown: 'neutral',
  valid: 'green',
  expiringSoon: 'amber',
  expired: 'red',
}

export const certStatusIcon: Record<CertStatus, typeof CheckCircle2> = {
  unknown: HelpCircle,
  valid: CheckCircle2,
  expiringSoon: AlertTriangle,
  expired: AlertOctagon,
}

export const certStatusLabel: Record<CertStatus, string> = {
  unknown: 'Belirtilmemiş',
  valid: 'Geçerli',
  expiringSoon: 'Yakında Doluyor',
  expired: 'Süresi Doldu',
}

export const rankIcon: Record<PilotRank, typeof Shield> = {
  Trainee: GraduationCap,
  FirstOfficer: Shield,
  Captain: ShieldCheck,
  ChiefPilot: Crown,
}

export const dutyRoleIcon: Record<DutyRole, typeof Crown> = {
  PIC: Crown,
  SIC: UserCheck,
  Instructor: GraduationCap,
  Observer: Eye,
  Trainee: User,
}

export const severityTone: Record<SeverityLevel, 'neutral' | 'amber' | 'red' | 'green'> = {
  Low: 'green',
  Medium: 'amber',
  High: 'amber',
  Critical: 'red',
}

export const severityIcon: Record<SeverityLevel, typeof Info> = {
  Low: Info,
  Medium: AlertCircle,
  High: AlertTriangle,
  Critical: AlertOctagon,
}
