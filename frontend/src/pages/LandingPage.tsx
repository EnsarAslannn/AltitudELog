import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { cn } from '../lib/cn'
import { VideoBackdrop } from '../components/common/VideoBackdrop'
import { LandingNav } from '../components/landing/LandingNav'
import { SculptureLayer } from '../components/landing/SculptureLayer'
import { HeroSection } from '../components/landing/HeroSection'
import { FeatureBlock } from '../components/landing/FeatureBlock'
import { CapabilityGrid } from '../components/landing/CapabilityGrid'
import { LandingFooter } from '../components/landing/LandingFooter'
import { ghostCta, solidCta } from '../components/landing/ctas'
import { Reveal } from '../components/landing/Reveal'

const marks = [
  { value: 'ICAO', label: 'Rota bazlı uçuş kaydı' },
  { value: 'METAR', label: 'Otomatik hava durumu' },
  { value: 'CRM', label: 'Anonim güvenlik raporu' },
  { value: 'CSV · PDF', label: 'Logbook dışa aktarım' },
]

export function LandingPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    const previous = document.body.style.backgroundColor
    document.body.style.backgroundColor = '#dce8f2'
    return () => {
      document.body.style.backgroundColor = previous
    }
  }, [])

  return (
    <div className="air-page relative min-h-screen">
      <VideoBackdrop />
      <SculptureLayer />
      <LandingNav />

      <main className="relative">
        <HeroSection />

        <section aria-label="Öne çıkanlar" className="relative z-30">
          <ul className="mx-auto grid max-w-[1150px] grid-cols-2 px-5 sm:grid-cols-4 sm:px-8">
            {marks.map(({ value, label }) => (
              <li key={value} className="border-t border-[color:var(--air-rule)] py-8 pr-5 sm:pr-8">
                <p className="data text-xl font-medium tracking-tight text-[color:var(--air-fg)] sm:text-2xl">
                  {value}
                </p>
                <p className="mt-2 text-[13px] leading-snug text-[color:var(--air-fg-muted)]">{label}</p>
              </li>
            ))}
          </ul>
        </section>

        <FeatureBlock
          id="ucus-kaydi"
          eyebrow="Uçuş kaydı"
          title={
            <>
              Kayıtlı tüm uçuşlar,
              <br />
              <span className="air-cursive mr-2 text-[1.14em] text-[color:var(--air-accent)]">tek</span>{' '}
              bakışta.
            </>
          }
          body="Rota, uçak tipi ve tarih aralığına göre filtreleyin; toplam uçuş, bu ay ve uçak tipi sayıları listedeki filtreyle birlikte güncellenir."
          points={[
            'Meydan kodu ve uçak tipinde serbest metin arama',
            'Tarih aralığı, uçak tipi ve iptal durumu filtreleri',
            'Sayfalı liste — her sayfa kendi içinde tutarlı sıralanır',
            'Her uçuşun METAR bilgisi kayıttan sonra otomatik düşer',
          ]}
          image="/images/report2.png"
          imageAlt="Havalimanı terminalinde, apronda bekleyen uçağın önünde asılı duran rota ve uçuş verisi panelleri"
        />

        <FeatureBlock
          id="crm"
          eyebrow="CRM raporları"
          title={
            <>
              Güvenlik verisi,
              <br />
              <span className="air-cursive mr-2 text-[1.14em] text-[color:var(--air-accent)]">görünür</span>{' '}
              olduğunda işe yarar.
            </>
          }
          body="Ekip kaynak yönetimi raporları uçuşa bağlı olarak kaydedilir, önem derecesine göre ayrışır ve yönetim panelinde altı aylık trend olarak toplanır."
          points={[
            'Uçuş bazlı raporlama, önem derecesi seçimiyle',
            'İsteğe bağlı anonim gönderim',
            'Rütbe dağılımı ve toplam rapor sayıları',
            'Son altı ayın CRM trendi tek grafikte',
          ]}
          image="/images/report1.png"
          imageAlt="Pisti gören bir ofis masasında duran basılı uçuş raporu ve grafik gösteren tablet"
          reverse
        />

        <FeatureBlock
          id="logbook"
          eyebrow="Pilot logbook"
          title={
            <>
              Uçuş saatiniz
              <br />
              <span className="air-cursive mr-2 text-[1.14em] text-[color:var(--air-accent)]">her zaman</span>{' '}
              elinizin altında.
            </>
          }
          body="Profiliniz uçuş saatlerinizi, son uçuşlarınızı ve sertifika geçerlilik tarihlerinizi bir arada tutar. Logbook çıktısını CSV veya PDF olarak alabilirsiniz."
          points={[
            'Atandığınız uçuşlardan türeyen toplam saat ve güncellik',
            'Lisans ve sağlık sertifikası son geçerlilik takibi',
            'Son uçuşlar listesi ve görev rolleri',
            'Tek tıkla CSV veya PDF logbook çıktısı',
          ]}
          image="/images/report3.png"
          imageAlt="Kokpitte, bulutların üzerinde uçarken elindeki tablette uçuş verilerini inceleyen pilot"
        />

        <CapabilityGrid />

        <section className="py-24 sm:py-32">
          <Reveal className="relative z-30 mx-auto max-w-[1150px] px-5 text-center sm:px-8">
            <h2 className="mx-auto max-w-3xl text-[clamp(2rem,5vw,4rem)] font-medium leading-[1.05] tracking-[-0.025em] text-[color:var(--air-fg)]">
              Bir sonraki uçuşunuz
              <br />
              <span className="air-cursive mr-2 text-[1.14em] text-[color:var(--air-accent)]">kayıtlı</span>{' '}
              başlasın.
            </h2>
            <p className="mx-auto mt-7 max-w-lg text-base leading-relaxed text-[color:var(--air-fg-muted)]">
              Rütbenizi seçin, hesabınızı açın ve ilk uçuşunuzu dakikalar içinde kaydedin.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              {isAuthenticated ? (
                <Link to="/dashboard" className={cn('inline-flex', solidCta)}>
                  Panele Git
                </Link>
              ) : (
                <>
                  <Link to="/register" className={cn('inline-flex', solidCta)}>
                    Hesap Oluştur
                  </Link>
                  <Link to="/login" className={cn('inline-flex', ghostCta)}>
                    Giriş Yap
                  </Link>
                </>
              )}
            </div>
          </Reveal>
        </section>
      </main>

      <LandingFooter />
    </div>
  )
}
