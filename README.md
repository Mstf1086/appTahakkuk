# Tahakkuk

Angular 22 ve Firebase Authentication ile geliştirilen **Tahakkuk** tek sayfa uygulaması.
Kullanıcılar e-posta/şifre ile giriş yaparak korumalı panoya ulaşır; **Damga Vergisi
Hesaplama** modülü ise misafirler tarafından da giriş yapılmadan kullanılabilir.

## İçindekiler

- [Özellikler](#özellikler)
- [Teknoloji](#teknoloji)
- [Kurulum](#kurulum)
- [Firebase yapılandırması](#firebase-yapılandırması)
- [Çalıştırma](#çalıştırma)
- [Test ve derleme](#test-ve-derleme)
- [Proje yapısı](#proje-yapısı)
- [Modüller](#modüller)
- [SEO](#seo)
- [MCP araçları](#mcp-araçları)
- [Sorun giderme](#sorun-giderme)

## Özellikler

- **Firebase Authentication**: e-posta/şifre ile giriş, hesap oluşturma ve çıkış.
- **Korumalı alan**: `/profile` rotası `authGuard` ile korunur ve menülerde yalnızca giriş yapmış
  kullanıcılara gösterilir; oturum yoksa `/login?returnUrl=...` adresine yönlendirilir.
- **Misafir erişimi**: `/` (varsayılan sayfa) ve `/dashboard` misafirlere açıktır; dashboard’da
  modül kartları görünür, giriş bağlantısı üst menüde bulunur. `/modules/stamp-tax` de herkese
  açıktır; modül, shell içinde açıldığı için üst menü ve footer misafirler için de görünür.
- **Damga Vergisi Hesaplama modülü**: KDV hariç fatura bedelinden damga vergisi kesintisi,
  KDV dahil fatura bedeli, tevkifat kesintisi ve ödenecek tutar hesaplanır. Modül yalnızca
  dashboard’daki kart üzerinden açılır; menülerde ve giriş ekranında listelenmez.
- **Google Drive bağlantısı**: giriş yapmış kullanıcı Google hesabıyla yetki verir; Drive'ında
  `tahakkuk.web.app` klasörü otomatik oluşturulur. Durum ve bağlı hesap bilgileri profil
  sayfasındaki "Bağlı hesaplar" panelinde görünür.
- **Responsive shell**: 900px üzerinde üst menü, altında açılır panel (hamburger).
- **Footer ve sürüm**: footer pencerenin en altında durur, içerik uzadıkça aşağı itilir; yalnızca
  uygulama adı, telif ve güncel sürüm (`package.json`) görünür; footer'da gezinme bağlantısı yoktur.
- **SEO**: sayfa başlıkları, meta description/keywords, Open Graph, Twitter Card, canonical
  bağlantısı ve `WebApplication` yapısal verisi.

## Teknoloji

| Katman | Teknoloji |
| --- | --- |
| Framework | Angular 22.2.5 (standalone, signals, `@angular/build`) |
| Test | Vitest 5 + jsdom (`@angular/build:unit-test`) |
| Backend SDK | Firebase 13 (Auth, Firestore, Storage) |
| Node | 24.22.2 LTS (`.nvmrc`) |
| Paket yöneticisi | npm 11 |

## Kurulum

### 1. Gereksinimler

- Node.js 24 LTS (`nvm install 24 && nvm use 24`)
- npm 11
- Firebase projesi: `tahakkuk-bc03b`

### 2. Bağımlılıkları kurun

```bash
npm install
```

### 3. Ortam dosyasını hazırlayın

```bash
npm run env:init          # .env.example dosyasını .env olarak kopyalar
```

`.env` dosyasını düzenleyip Firebase konsolundaki web uygulaması değerlerini girin:

```dotenv
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=tahakkuk-bc03b.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tahakkuk-bc03b
VITE_FIREBASE_STORAGE_BUCKET=tahakkuk-bc03b.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_GOOGLE_CLIENT_ID=....apps.googleusercontent.com
```

`.env` dosyası git-ignored’dır ve **asla commit edilmemelidir**.

### 4. Ortam dosyasını üretin

```bash
npm run env:generate
```

Bu komut `.env` içeriğinden `src/environments/environment.ts` dosyasını üretir. Angular `.env`
dosyasını doğrudan okumaz; bu yüzden `npm start`, `npm run build` ve `npm run test:ci`
komutlarından önce otomatik çalışır (`pre*` scriptleri).

## Firebase yapılandırması

1. [Firebase Console](https://console.firebase.google.com/) → proje `tahakkuk-bc03b`.
2. **Authentication → Sign-in method** → **Email/Password** → etkinleştirin.
3. **Authentication → Settings → Authorized domains** → yayın alan adınızı ekleyin (`localhost`
   geliştirme için varsayılan olarak izinlidir).
4. **Project settings → Your apps → Web** uygulamasından yapılandırma değerlerini `.env`
   dosyasına kopyalayın.

## Google Drive yapılandırması

Profil sayfasındaki **Google Drive’a bağlan** düğmesi Google Identity Services (GIS) ile OAuth 2.0
erişim token'ı alır ve Drive API v3 ile `tahakkuk.web.app` klasörünü oluşturur.

1. [Google Cloud Console](https://console.cloud.google.com/) → yeni veya mevcut bir proje seçin.
2. **APIs & Services → Library** → **Google Drive API** etkinleştirin.
3. **APIs & Services → OAuth consent screen** → External (test kullanıcısı olarak kendi Google
   hesabınızı **Test users** listesine ekleyin).
4. **APIs & Services → Credentials → Create credentials → OAuth client ID → Web application**:
   - **Authorized JavaScript origins**: `http://localhost:4200` ve yayın alan adınız
     (ör. `https://tahakkuk.web.app`).
5. İstemci kimliğini `.env` dosyasına `VITE_GOOGLE_CLIENT_ID=...` olarak yazın ve
   `npm run env:generate` çalıştırın.

Kapsam (`scope`): `https://www.googleapis.com/auth/drive.file`, `email`, `profile`. `drive.file`
kapsamı yalnızca uygulamanın oluşturduğu dosyalara erişir; kullanıcının mevcut Drive içeriği
okunmaz. Bağlantı bilgisi (hesap e-postası, klasör kimliği, bağlantı tarihi) oturum bazında
`sessionStorage` üzerinde tutulur; tarayıcı kapanınca silinir.

Profil sayfasında bağlantı durumu, bağlı Google hesabı ve klasör bilgisi "Bağlı hesaplar"
panelinde gösterilir.

## Çalıştırma

```bash
npm start          # http://localhost:4200 (Vite tabanlı geliştirme sunucusu)
npm run watch      # geliştirme derlemesi, watch modunda
```

Uygulamada:

- `/` ve `/dashboard` → misafirler için de açık.
- `/login` → giriş ve hesap oluşturma ekranı.
- `/modules/stamp-tax` → giriş gerektirmeyen damga vergisi hesaplama modülü (üst menü ve footer
  görünür, menülerde listelenmez).
- `/profile` → giriş yapmış kullanıcıların profil bilgileri (korumalı; menüde yalnızca giriş
  yapmışlara görünür).

## Sürümleme

- Uygulama sürümü `package.json` içindeki `version` alanından okunur ve footer’da gösterilir
  (`src/app/core/app-info.ts` → `src/app/layout/footer.component.*`).
- **Her kod değişikliğinde sürümün son bileşeni bir artırılır**: `0.0.1` → `0.0.2` → `0.0.3`.
- `0.0` (major.minor) kısmı **yalnızca proje sahibi istediğinde** değiştirilir (`0.1.0`, `1.0.0`).
- Her sürüm için `CHANGELOG.md` dosyasına `## [x.y.z] - YYYY-MM-DD` başlığı eklenir.

## Test ve derleme

```bash
npm run test:ci                              # tüm birim testleri (Vitest + jsdom)
npm test -- --include='src/app/app.routes.spec.ts'   # tek dosya
npm run build                                # üretim derlemesi -> dist/tahakkuk/
```

Testler kaynak kodunun yanında `*.spec.ts` dosyalarında yaşar ve render edilen çıktıyı doğrular.

## Proje yapısı

```text
src/
├── app/
│   ├── core/
│   │   ├── auth.service.ts        # Firebase Authentication sarmalayıcı
│   │   ├── auth.guard.ts          # Korumalı rota guard'ı
│   │   ├── auth-errors.ts         # Firebase hata kodları -> Türkçe mesaj
│   │   ├── google-drive.service.ts # Google Drive yetkilendirme ve klasör oluşturma
│   │   ├── seo.service.ts         # Başlık, meta, Open Graph, canonical
│   │   ├── app-info.ts            # package.json'dan sürüm bilgisi
│   │   └── firebase.ts            # Firebase başlatma (tek nokta)
│   ├── layout/
│   │   ├── shell.component.*      # Üst menü / mobil panel (flex kolon, footer en altta)
│   │   └── footer.component.*     # Altbilgi ve sürüm bilgisi
│   ├── features/
│   │   ├── login/*                # Giriş ve hesap oluşturma
│   │   ├── dashboard/*            # Pano ve modül kartları
│   │   ├── profile/*              # Profil düzenleme + bağlı hesaplar (Google Drive)
│   │   └── modules/stamp-tax/*    # Damga vergisi hesaplama (herkese açık)
│   ├── app.routes.ts              # Rotalar (public + korumalı)
│   └── app.config.ts              # Provider'lar, Türkçe locale
├── environments/environment.ts    # .env'den üretilir (commit edilmez)
└── index.html                     # SEO meta etiketleri, JSON-LD
```

## Modüller

### Damga Vergisi Hesaplama (`/modules/stamp-tax`)

| Sıra | Alan | Nasıl hesaplanır |
| --- | --- | --- |
| 1 | KDV hariç fatura bedeli | Manuel giriş |
| 2 | KDV bedeli | Manuel giriş |
| 3 | KDV dahil fatura bedeli | `KDV hariç bedel + KDV bedeli` (sistemsel) |
| 4 | Damga vergisi kesintisi | `KDV hariç fatura bedeli × 9,48/1000` (sistemsel) |
| 5 | Tevkifat kesintisi | Manuel giriş |
| 6 | Ödenecek tutar | `KDV dahil fatura bedeli − damga vergisi kesintisi − tevkifat kesintisi` (sistemsel) |

Tutarlar kuruş hassasiyetinde yuvarlanır ve Türkçe para birimi biçiminde (`₺1.000,00`)
gösterilir. Modül giriş gerektirmez; yalnızca dashboard'daki modül kartı üzerinden erişilir
(menülerde ve giriş ekranında listelenmez).

## SEO

- `src/index.html`: `lang="tr"`, description, keywords, robots, Open Graph, Twitter Card,
  `WebApplication` JSON-LD ve canonical etiketi.
- `src/app/core/seo.service.ts`: her sayfa kendi başlığını, açıklamasını ve paylaşım
  meta etiketlerini `SeoService.setPage()` ile günceller.
- `public/robots.txt`: arama motorlarına açık izin.
- Rotalar `title` alanıyla tanımlanır (`app.routes.ts`).

## MCP araçları

Bu proje için iki MCP sunucusu kullanılabilir:

- **Angular CLI MCP**: proje keşfi (`list_projects`), en iyi pratikalar
  (`get_best_practices`), dokümantasyon araması (`search_documentation`), hedef çalıştırma
  (`run_target`) ve geliştirme sunucusu (`devserver_start` / `devserver_wait_for_build`).
- **Firebase MCP**: proje ve uygulama bilgisi, SDK yapılandırması, güvenlik kuralları, dağıtım ve
  Firebase dokümantasyonu (`developerknowledge_*`).

Ayrıntılı kullanım kuralları için [AGENTS.md](AGENTS.md) dosyasındaki “MCP kullanım kuralları”
bölümüne bakın.

## Sorun giderme

| Belirti | Çözüm |
| --- | --- |
| “Firebase yapılandırması eksik” uyarısı | `.env` dosyasını oluşturup `npm run env:generate` çalıştırın. |
| Giriş yapılamıyor | Firebase Console → Authentication → Email/Password etkin mi? |
| `auth/operation-not-allowed` | Aynı ayar: Email/Password sağlayıcısı açık olmalı. |
| `auth/domain-not-authorized` | Authorized domains listesine alan adınızı ekleyin. |
| Değişiklikler görünmüyor | `npm start` çalışıyor mu? `npm run env:generate` sonrası yeniden başlatın. |
| “Google OAuth istemci kimliği yapılandırılmamış” | `.env` içine `VITE_GOOGLE_CLIENT_ID` ekleyip `npm run env:generate` çalıştırın. |
| Google ile yetkilendirme penceresi açılmıyor | Cloud Console → Credentials → Web client → **Authorized JavaScript origins** içine `http://localhost:4200` ekleyin; Drive API etkin olmalı. |
| Yetkilendirme 45 sn sonra “pencere yanıt vermedi” hatası veriyor | Pencere pop-up engelleyicide açıldıysa izne basın; yoksa bulundüğunuz adresin (ör. `http://localhost:4200`) **Authorized JavaScript origins** listesinde olduğunu ve OAuth consent ekranında hesabınızın **Test users** listesinde olduğunu kontrol edin. |
| Drive klasörü oluşmuyor | OAuth consent screen → Test users listesinde hesabınız olsun; `drive.file` kapsamı için ek izin gerekmez. |

## İlgili belgeler

- [CHANGELOG.md](CHANGELOG.md) — sürüm bazlı değişiklik kayıtları
- [AGENTS.md](AGENTS.md) — geliştirme kuralları, token verimliliği ve MCP kullanım kuralları
