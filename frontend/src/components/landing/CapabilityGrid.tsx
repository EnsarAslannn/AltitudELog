import {
  CloudSun,
  FileDown,
  ShieldCheck,
  Siren,
  Users,
  CalendarClock,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { Reveal } from './Reveal'
import { toneClass, type SectionTone } from './tones'

const capabilities = [
  {
    icon: CloudSun,
    title: 'Otomatik METAR',
    body: 'Uçuş kaydedilir kaydedilmez kalkış meydanının METAR verisi arka plan görevinde çekilir — kimse elle girmez.',
  },
  {
    icon: ShieldCheck,
    title: 'Rütbeye bağlı yetki',
    body: 'Trainee’den ChiefPilot’a dört rütbe. Uçuş ve mürettebat kaydı açmak komuta rütbesi ister; okuma herkese açıktır.',
  },
  {
    icon: Users,
    title: 'Mürettebat ataması',
    body: 'Her pilot bir uçuşa kendi görev rolüyle atanır. Aynı pilot aynı uçuşa iki kez eklenemez.',
  },
  {
    icon: Siren,
    title: 'Anonim CRM raporu',
    body: 'Güvenlik raporları önem derecesiyle kaydedilir; raporu anonim bırakma seçeneği her zaman durur.',
  },
  {
    icon: CalendarClock,
    title: 'Sertifika takibi',
    body: 'Lisans ve sağlık sertifikası geçerlilik tarihleri profilde izlenir, süresi yaklaşanlar öne çıkar.',
  },
  {
    icon: FileDown,
    title: 'CSV ve PDF çıktı',
    body: 'Logbook’unuzu tek tıkla dışa aktarın — denetim, başvuru ya da kendi arşiviniz için.',
  },
]

export function CapabilityGrid({ tone }: { tone: SectionTone }) {
  return (
    <section
      id="yetenekler"
      data-nav-tone={tone}
      className={cn(toneClass[tone], 'air-ground scroll-mt-24 py-20 sm:py-28')}
    >
      <div className="relative z-30 mx-auto max-w-[1150px] px-5 sm:px-8">
        <Reveal className="max-w-2xl">
          <p className="eyebrow mb-5 text-xs font-medium text-[color:var(--air-accent)]">
            Operasyon yetenekleri
          </p>
          <h2 className="text-[clamp(1.75rem,3.4vw,3.25rem)] font-medium leading-[1.08] tracking-[-0.02em] text-[color:var(--air-fg)]">
            Kaydın etrafındaki her şey
          </h2>
        </Reveal>

        {/*
          Hairline-divided cells rather than six filled cards: the ground is already
          a light tone, so panels only a shade lighter would read as noise. The grid
          gap is the rule — one 1px lattice, no borders doubling up at the seams.
        */}
        <ul className="mt-14 grid gap-px overflow-hidden rounded-xl border border-[color:var(--air-rule)] bg-[color:var(--air-rule)] sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map(({ icon: Icon, title, body }, index) => (
            <Reveal
              as="li"
              key={title}
              delay={index * 0.05}
              className="bg-[color:var(--air-bg)] p-6 sm:p-7"
            >
              <Icon className="h-5 w-5 text-[color:var(--air-accent)]" strokeWidth={1.75} aria-hidden="true" />
              <h3 className="mt-5 text-lg font-medium text-[color:var(--air-fg)]">{title}</h3>
              <p className="mt-2.5 text-[15px] leading-relaxed text-[color:var(--air-fg-muted)]">{body}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
