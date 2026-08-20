# ✈️ AltitudELog

[![CI](https://github.com/EnsarAslannn/AltitudELog/actions/workflows/ci.yml/badge.svg)](https://github.com/EnsarAslannn/AltitudELog/actions/workflows/ci.yml)

.NET tabanlı, pilotların uçuş kaydı tuttuğu, mürettebat atadığı ve CRM (Crew Resource
Management) güvenlik raporu doldurabildiği modern bir uçuş günlükleme sistemi

**🔗 Canlı demo:** [altitudelog.vercel.app](https://altitudelog.vercel.app) — herhangi bir
rütbeyle (Kaptan dahil) kayıt olup uçuş oluşturma özelliklerini deneyebilirsiniz.

## 📌 Proje Hakkında

AltitudELog, pilotların rütbeleriyle sisteme kayıt olabildiği, uçuş kaydı oluşturabildiği,
her uçuşa mürettebat üyelerini görev rolleriyle atayabildiği ve isteğe bağlı olarak anonim
CRM güvenlik raporu doldurabildiği bir uçuş & mürettebat yönetim platformudur.

Bir uçuş oluşturulduğunda, kalkış havalimanına ait METAR hava durumu raporu arka planda
otomatik olarak çekilir ve uçuşa eklenir.

Amaç yalnızca basit bir kayıt ekranı değil; rol tabanlı yetkilendirme, arka plan işleri,
cache mekanizması ve gerçek bir CI/CD & deployment sürecini bir araya getiren uçtan uca
bir uygulama ortaya koymaktır.

## ⚙️ Öne Çıkan Özellikler

### ✈️ Uçuş Kaydı Yönetimi
- Kalkış ve varış havalimanı bilgisiyle uçuş oluşturma
- Uçuş listeleme ve detay görüntüleme
- Uçuş oluşturma yetkisi komuta rütbeleriyle sınırlı (Kaptan, Filo Amiri)

### 👥 Mürettebat & Görev Atama
- Her uçuşa birden fazla mürettebat üyesi atanabilir
- Mürettebat üyeleri uçuş bazında görev rolü alır
- Pilotun rütbesi aynı zamanda sistemdeki yetki seviyesini belirler

### 📝 CRM Güvenlik Raporlama
- Belirli bir uçuşa bağlı CRM (Crew Resource Management) güvenlik raporu doldurma
- Raporlar isteğe bağlı olarak anonim gönderilebilir
- Güvenlik kültürünü destekleyen, cezalandırmayan bir raporlama akışı

### 🌦️ Otomatik Hava Durumu Zenginleştirme
- Uçuş oluşturulduğunda arka planda tetiklenen bir iş kuyruğu (Hangfire) devreye girer
- Kalkış havalimanının METAR raporu dış servisten çekilir ve uçuşa işlenir
- Dış API çağrısı yazma işleminden ayrıştırılır, kullanıcı beklemeden devam eder

### 🔐 Rol Tabanlı Yetkilendirme
- Pilotun rütbesi JWT üzerinde rol bilgisi olarak taşınır
- Uçuş/mürettebat oluşturma gibi yazma işlemleri komuta rütbeleriyle sınırlıdır
- Aynı kurallar arayüzde route koruması olarak da uygulanır

### ⚡ Cache & Arka Plan İşleri
- Sık sorgulanan veriler Redis üzerinde cache’lenir
- Cache güncelliğini kaybettiğinde ilgili kayıtlar otomatik geçersiz kılınır
- Cache servisi çökse dahi sistem çalışmaya devam eder (fail-open yaklaşım)

### 🩺 Operasyonel Uç Noktalar
- `/health` — veritabanı ve cache servislerinin canlılık durumu
- `/hangfire` — parola korumalı arka plan iş kuyruğu paneli
- Scalar üzerinden gezilebilir API dokümantasyonu

## 🏗️ Proje Mimarisi

Proje, Temiz Mimari (Clean Architecture) prensipleriyle katmanlı olarak geliştirilmiştir:

```
Domain          → Pilot, Flight, Crew, CRMReport gibi çekirdek varlıklar (dış bağımlılık yok)
Application     → CQRS komut/sorguları, doğrulama kuralları, cache soyutlamaları
Infrastructure  → Veritabanı erişimi, JWT üretimi, Redis, Hangfire, METAR servisi
API             → Controller’lar, uygulama giriş noktası
```

Frontend, backend’den bağımsız ayrı bir React + TypeScript projesi olarak geliştirilmiştir.

Bu mimari sayesinde proje daha okunabilir, test edilebilir ve genişletilebilir hale
getirilmiştir.

## 🛠️ Kullanılan Teknolojiler

**Backend**
- .NET 10, ASP.NET Core Web API
- PostgreSQL (Entity Framework Core)
- Redis
- Hangfire
- FluentValidation, Serilog, JWT tabanlı kimlik doğrulama

**Frontend**
- React 19 + TypeScript
- Vite
- Tailwind CSS
- Zustand, Axios, React Router

**Test**
- xUnit, NSubstitute
- Testcontainers (Postgres & Redis ile gerçek entegrasyon testleri)

**Dağıtım**
- API: Docker ile Railway üzerinde
- Frontend: Vercel üzerinde

## 🚀 Kurulum

### Gereksinimler
- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/) 22+
- Docker (Postgres ve Redis servisleri için)

### Backend

```bash
docker compose up -d

dotnet user-secrets set "Jwt:Key" "<en az 32 karakterlik bir anahtar>" \
  --project src/AltitudELog.API

dotnet restore
dotnet build AltitudELog.slnx

dotnet ef database update --project src/AltitudELog.Infrastructure --startup-project src/AltitudELog.API

dotnet run --project src/AltitudELog.API --launch-profile http   # http://localhost:5264
```

### Frontend

```bash
cd frontend
npm install
npm run dev      # http://localhost:5180
```

### Testler

```bash
dotnet test AltitudELog.slnx
```

> Entegrasyon testleri için Docker’ın çalışıyor olması gerekir.

## 📸 Proje Görselleri

**Anasayfa**

<p align="center">
<img src="frontend/public/screenshots/homePage.png" width="800"/>
<img src="frontend/public/screenshots/homePage2.png" width="800"/>
</p>

**Dashboard**

<p align="center">
<img src="frontend/public/screenshots/dashboard.png" width="800"/>
</p>

**Yeni Uçuş Oluşturma**

<p align="center">
<img src="frontend/public/screenshots/newFlight.png" width="800"/>
</p>

**Profil**

<p align="center">
<img src="frontend/public/screenshots/profile.png" width="800"/>
</p>

**İstatistikler**

<p align="center">
<img src="frontend/public/screenshots/statistics.png" width="800"/>
</p>

## 📄 Lisans

MIT — bkz. [LICENSE](./LICENSE).
