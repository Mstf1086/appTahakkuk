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

- **Firebase Authentication**: e-posta/şifre ile giriş, **Google ile giriş**, hesap oluşturma ve çıkış.
- **Korumalı alan**: `/profile` rotası `authGuard` ile korunur ve menülerde yalnızca giriş yapmış
  kullanıcılara gösterilir; oturum yoksa `/login?returnUrl=...` adresine yönlendirilir.
- **Misafir erişimi**: `/` (varsayılan sayfa) ve `/anasayfa` misafirlere açıktır; anasayfada
  modül kartları görünür, giriş bağlantısı üst menüde bulunur. `/modules/damga-vergisi-modulu`,
  `/modules/dosya` ve `/modules/sozlesme/:recordNumber` de herkese açıktır; modüller shell içinde
  açıldığı için üst menü ve footer
  misafirler için de görünür.
- **Modül kategorileri**: anasayfada **Ana Modüller** (Dosya Modülü, altında Sözleşme Modülü
  tanıtımı) ve **Yardımcı Modüller** (Damga Vergisi Hesaplama) ayrı kartlarda listelenir.
- **Damga Vergisi Hesaplama modülü**: KDV hariç fatura bedelinden damga vergisi kesintisi,
  KDV dahil fatura bedeli, tevkifat kesintisi ve ödenecek tutar hesaplanır. Modül yalnızca
  anasayfadaki yardımcı modül kartı üzerinden açılır; menülerde ve giriş ekranında listelenmez.
- **Google Drive bağlantısı**: kullanıcı **giriş yaptığında bağlantı kendiliğinden kurulur** —
  daha önce izin verilmişse pencere açılmadan (sessiz yenileme), ilk kezse tek seferlik onay
  penceresiyle. Drive'ında `tahakkuk.web.app` klasörü otomatik oluşturulur. Bağlantı bilgisi
  (token hariç) tarayıcınızda kalıcıdır; sayfa yenildiğinde veya yeni sekme açıldığında
  bağlantı korunur, çıkışta durum sıfırlanır (kayıt silinmez). Durum ve bağlı hesap bilgileri
  profil sayfasındaki "Bağlı hesaplar" panelinde görünür.
- **Oturum güvenliği**: 30 dakika boyunca işlem yapılmazsa oturum güvenliğiniz için otomatik
  kapatılır; fare/klavye/dokunma etkileşimi süreyi baştan başlatır.
- **Hukuki sayfalar**: `/policy` (gizlilik politikası) ve `/terms` (kullanım koşulları) misafirler
  dahil herkese açıktır; OAuth consent screen doğrulamasında istenen herkese açık adresler
  uygulama içinde yayınlanır.
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
| Node | 24.22.3 LTS (`.nvmrc`) |
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

## Google ile giriş

Login ekranındaki **Google ile giriş yap** düğmesi `signInWithPopup` ile Firebase'in kendi
OAuth akışını kullanır; Drive bağlantısından bağımsızdır. Gereken tek yapılandırma:

1. [Firebase Console](https://console.firebase.google.com/) → **Authentication → Sign-in method** →
   **Google**'ı etkinleştirin (e-posta adresinizi "developer e-postası" olarak seçebilirsiniz).
2. Firebase Authentication → **Settings → Authorized domains** içinde yayın alan adınız
   (ör. `tahakkuk.web.app`) bulunmalı; `localhost` geliştirme için varsayılan olarak içerindedir.

Google ile giriş yapan kullanıcının Firebase hesabı otomatik oluşturulur; bu hesap ile
profil sayfasından Google Drive'a bağlanılabilir.

## Google Drive yapılandırması

Kullanıcı **giriş yaptığında** uygulama Google Identity Services (GIS) ile OAuth 2.0 erişim
token'ı alır ve Drive API v3 ile `tahakkuk.web.app` klasörünü oluşturur. Daha önce izin
verilmişse pencere açılmadan sessiz yenileme yapılır; ilk kezte tek seferlik onay penceresi
açılır. Profil sayfasındaki **Google Drive'a bağlan** düğmesi de aynı akışı kurar.

1. [Google Cloud Console](https://console.cloud.google.com/) → yeni veya mevcut bir proje seçin.
2. **APIs & Services → Library** → **Google Drive API** ve **Google Sheets API**
   etkinleştirin (Drive dosyası oluşturma ve tabloya satır ekleme için ikisi de gerekir).
3. **APIs & Services → OAuth consent screen** → External. Publishing status **Testing**
   (varsayılan) iken Drive'a bağlanmaya çalışan **her Google hesabının Test users
   listesinde olması gerekir**; listede olmayan hesap "Error 403: access_denied" ile
   reddedilir. Kendi hesabınızı (ve bağlanacak diğer hesapları) **Test users** listesine
   ekleyin. Kalıcı çözüm için **Publish app** ile yayın durumunu Production yapın; ancak
   `drive.file` "sensitive" kapsamı olduğu için Google doğrulama (verification) ister.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID → Web application**:
   - **Authorized JavaScript origins**: `http://localhost:4200` ve yayın alan adınız
     (ör. `https://tahakkuk.web.app`).
5. İstemci kimliğini `.env` dosyasına `VITE_GOOGLE_CLIENT_ID=...` olarak yazın ve
   `npm run env:generate` çalıştırın.

Kapsam (`scope`): `https://www.googleapis.com/auth/drive.file`, `email`, `profile`. `drive.file`
kapsamı yalnızca uygulamanın oluşturduğu dosyalara erişir; kullanıcının mevcut Drive içeriği
okunmaz. Bağlantı bilgisi (hesap e-postası, klasör kimliği, bağlantı tarihi; token değil)
kullanıcı çıkış yapana kadar `localStorage` üzerinde tutulur — sayfa yenilemede ve yeni
sekmede bağlantı korunur. Çıkışta (elle veya 30 dakika işlem yapılmaması sonrası otomatik)
uygulamaya ait tüm tarayıcı kayıtları (`tahakkuk.` anahtarları) ve Drive bağlantı durumu
temizlenir; erişim token'ı hiçbir zaman saklanmaz.

Uygulama Drive'ında iki Google Sheets tablosu tutulur: Dosya Modülü için **dosyalar**,
Sözleşme Modülü için **sözleşmeler**. Her ikisi de değişiklikte başlık satırıyla baştan
yazılır (`GoogleDriveService.writeSheet`), okuma `loadSheetRows` ile yapılır.

Consent screen doğrulamasında istenen bağlantılar uygulama içinde yayınlanır:
`https://tahakkuk.web.app/policy` (gizlilik politikası) ve
`https://tahakkuk.web.app/terms` (kullanım koşulları).

Profil sayfasında bağlantı durumu, bağlı Google hesabı ve klasör bilgisi "Bağlı hesaplar"
panelinde gösterilir.

Google penceresinde hangi hesap seçilirse bağlantı o hesaba yapılır; Firebase e-postasıyla
aynı olması gerekmez ve pencerede hesap oluşturmak da mümkündür.

> Not: Google penceresinde **"Erişim engellendi: ... Google doğrulama sürecini tamamlamadı.
> Uygulama şu anda test edilmektedir. Yalnızca geliştirici tarafından onaylanan test
> kullanıcıları uygulamaya erişebilir. (Error 403: access_denied)"** görürseniz: OAuth consent
> screen yayın durumu Testing'dir ve izin veren Google hesabı Test users listesinde değildir.
> Cloud Console → APIs & Services → OAuth consent screen → **Test users** bölümüne ilgili
> hesabı ekleyin (anında etkili, dağıtım gerekmez) veya uygulamayı Production olarak yayınlayın.

> Not: `src/index.html` içindeki `accounts.google.com/gsi/client` scripti sayfa yüklenirken
> çalışır. Butona basıldığında scriptin hazırlanmadığı görülürse uygulama, ölü scripti
> sayfadan sökerek toplam 2 kez (her biri 20 sn) yeniden yüklemeyi dener. Google'a erişimin
> engellendiği ağlarda (bazı VPN/ISP yapılandırmaları) bağlantı kurulamaz; bu durumda hata
> mesajı ağ erişimini kontrol etmenizi önerir.

## Çalıştırma

```bash
npm start          # http://localhost:4200 (Vite tabanlı geliştirme sunucusu)
npm run watch      # geliştirme derlemesi, watch modunda
```

Uygulamada:

- `/` ve `/anasayfa` → misafirler için de açık anasayfa (ana ve yardımcı modül kartları).
- `/login` → giriş (e-posta/şifre veya Google) ve hesap oluşturma ekranı.
- `/modules/damga-vergisi-modulu` → giriş gerektirmeyen damga vergisi hesaplama modülü (üst menü
  ve footer görünür, menülerde listelenmez).
- `/modules/dosya` → giriş gerektirmeyen dosya modülü (üst menü ve footer görünür, menülerde
  listelenmez).
- `/modules/sozlesme/:recordNumber` → dosya kaydına bağlı sözleşme modülü; erişim Dosya
  Modülü'ndeki "Sözleşme Aç" düğmesiyledir (menülerde listelenmez).
- `/profile` → giriş yapmış kullanıcıların profil bilgileri (korumalı; menüde yalnızca giriş
  yapmışlara görünür).
- `/policy` → gizlilik politikası (herkese açık; OAuth doğrulamasında kullanılan adres).
- `/terms` → kullanım koşulları (herkese açık; OAuth doğrulamasında kullanılan adres).

## Sürümleme

- Uygulama sürümü `package.json` içindeki `version` alanından okunur ve footer’da gösterilir
  (`src/app/core/app-info.ts` → `src/app/layout/footer.component.*`).
- **Her kod değişikliğinde sürümün son bileşeni bir artırılır**: `0.0.1` → `0.0.2` → `0.0.3`.
- `0.0` (major.minor) kısmı **yalnızca proje sahibi istediğinde** değiştirilir (`0.1.0`, `1.0.0`).
- Her sürüm için `CHANGELOG.md` dosyasına `## [x.y.z] - YYYY-MM-DD` başlığı eklenir.

## Dağıtım (Firebase Hosting)

Uygulama `tahakkuk-bc03b` Firebase projesinin **`tahakkuk`** hosting sitesine dağıtılır; yayın
adresinin birincil adresi `https://tahakkuk.web.app` olur (ikinci site
`https://tahakkuk-bc03b.web.app` aynı projede kalır).

```bash
npm run build            # çıktı: dist/tahakkuk/browser
firebase deploy --only hosting
```

- `firebase.json` → `hosting.target`: `tahakkuk` (deploy hedefi; `firebase target:apply hosting
  tahakkuk tahakkuk` ile `.firebaserc` içine kaydedilir). `hosting.public`:
  `dist/tahakkuk/browser` (Angular `application` builder çıktısı). Yanlış dizin (ör. `dist`)
  dağıtılırsa Firebase'in hazır "Welcome to Firebase Hosting" sayfası görünür.
- `rewrites` tüm yolları `index.html`'e yönlendirir (SPA router); yeni rotalarda 404 alınmaz.
- Firebase Console → Authentication → **Authorized domains** ve Google Cloud Console →
  **Authorized JavaScript origins** listesine `tahakkuk.web.app` eklenmelidir.

## Test ve derleme

```bash
npm run test:ci                              # tüm birim testleri (Vitest + jsdom)
npm test -- --include='src/app/app.routes.spec.ts'   # tek dosya
npm run build                                # üretim derlemesi -> dist/tahakkuk/
```

Testler kaynak kodunun yanında `*.spec.ts` dosyalarında yaşar ve render edilen çıktıyı doğrular.

## Hata denetimi

Uygulamada tüm hatalar tek bir merkezden (`src/app/core/error-logger.ts`) konsola yazılır.
Çıktı biçimi her yerde aynıdır:

```text
[Tahakkuk] [HATA] Drive bağlantısı kurulamadı | 2026-11-24T09:00:00.000Z | Error: TOKEN_WAIT_TIMEOUT
```

- `[HATA]` / `[UYARI]` — kayıt seviyesi; ardından hata bağlamı, ISO zaman damgası ve hata adı/mesajı gelir.
- Kayıtların ardından hatanın kendisi (yığın iziyle) ve varsa ek ayrıntılar (Firebase hata kodu,
  kaynak dosya/satır, rota) konsola ayrı argüman olarak yazılır.

Hangi durumların kaydedildiği:

| Kaynak | Kapsam |
| --- | --- |
| `GlobalErrorHandler` (`core/error-handler.ts`) | Angular'ın yakaladığı tüm yakalanmamış hatalar |
| `global-error-listeners.ts` | `window.onerror` (çalışma zamanı hataları, yüklenemeyen kaynaklar) ve `unhandledrejection` (yakalanmamış Promise reddi) |
| `app.config.ts` → `withNavigationErrorHandler(...)` | Sayfa yönlendirme hataları |
| `ErrorLogger` (`core/error-logger.ts`) | Servis ve bileşenlerdeki `catch` blokları (her `catch` bir hata günlüğü yazar) |

`catch` bloğu hatayı yutmuyorsa bile kaydedilir; kullanıcıya gösterilen Türkçe mesaj ile konsol
kaydı birlikte çalışır. Tanılamak için geliştirici araçları → Console sekmesinde `[Tahakkuk]`
önekiyle filtreleme yapın.

## Proje yapısı

```text
src/
├── app/
│   ├── core/
│   │   ├── auth.service.ts        # Firebase Authentication sarmalayıcı
│   │   ├── auth.guard.ts          # Korumalı rota guard'ı
│   │   ├── auth-errors.ts         # Firebase hata kodları -> Türkçe mesaj
│   │   ├── error-handler.ts       # Global hata yakalayıcı (Angular ErrorHandler)
│   │   ├── error-logger.ts        # Merkezi hata günlüğü: [Tahakkuk] önekiyle konsola yazar
│   │   ├── global-error-listeners.ts # window.onerror / unhandledrejection dinleyicileri
│   │   ├── google-drive.service.ts # Google Drive yetkilendirme ve klasör oluşturma
│   │   ├── seo.service.ts         # Başlık, meta, Open Graph, canonical
│   │   ├── app-info.ts            # package.json'dan sürüm bilgisi
│   │   └── firebase.ts            # Firebase başlatma (tek nokta)
│   ├── layout/
│   │   ├── shell.component.*      # Üst menü / mobil panel (flex kolon, footer en altta)
│   │   └── footer.component.*     # Altbilgi ve sürüm bilgisi
│   ├── features/
│   │   ├── login/*                # Giriş ve hesap oluşturma
│   │   ├── home/*                 # Anasayfa: ana ve yardımcı modül kartları
│   │   ├── profile/*              # Profil düzenleme + bağlı hesaplar (Google Drive)
│   │   ├── legal/*                 # Gizlilik politikasi (/policy) ve kullanim koşullari (/terms)
│   │   ├── modules/stamp-tax/*    # Damga vergisi hesaplama (herkese açık)
│   │   ├── modules/documents/*    # Dosya modülü: kayıt listesi, popup menüler, Drive sheet
│   │   └── modules/contracts/*    # Sözleşme modülü: kayda bağlı sözleşmeler, Drive sheet
│   ├── app.routes.ts              # Rotalar (public + korumalı)
│   └── app.config.ts              # Provider'lar, Türkçe locale
├── environments/environment.ts    # .env'den üretilir (commit edilmez)
└── index.html                     # SEO meta etiketleri, JSON-LD
```

## Modüller

### Dosya Modülü (`/modules/dosya`)

İş kayıtlarını yönetmek ve Google Drive'a aktarmak için:

- **Kayıt listesi**: kayıtlar tablo halinde listelenir (işin adı, türü, usulü, usul detayı, alım
  tarihi, durum, DOSYA ID). Her kayıt, `DOS-000001` biçiminde benzersiz bir kimlik alır; her
  satırda **"Sözleşme Aç"** düğmesi o kaydın sözleşme listesini açar.
- **Menu**: `Yeni kayıt`, `Düzenle`, `Sil` ve gerektiğinde `Google Drive'a bağlan` düğmeleri
  (bağlan düğmesi yalnızca oturum izni tazelenemediğinde görünür).
- **Popup akışı**: `Düzenle` ve `Sil` bir seçim penceresi açar; listeden kayıt seçilip onay
  verdiğinizde işlem uygulanır. `Yeni kayıt` ve düzenleme formu doğrulama şemasına
  (`src/app/features/modules/documents/document.schema.json`) göre kontrol edilir; hatalı alanlar
  form altında Türkçe olarak gösterilir.
- **Alanlar**: işin adı, türü (Mal/Hizmet/Yapım), usulü (İhale/Doğrudan Temin/Diğer) ve usule
  bağlı alt seçenekler (ihale: Açık İhale, Pazarlık 21-A/21-B/21-D; doğrudan temin:
  22A/22B/22C), alım tarihi ve isteğe bağlı açıklama.
- **Otomatik Drive senkronizasyonu**: Bağlantı kurulduğunda Drive'daki **dosyalar** tablosunun
  veri satırları otomatik yüklenir (aynı kayıt iki kez eklenmez; erişim token'ı sayfa
  yenilemesiyle kaybolduğu için servis izni sessizce yeniler, `prompt: 'none'`). Kayıt
  eklendiğinde, düzenlendiğinde veya silindiğinde tablo **baştan yazılır**: `tahakkuk.web.app`
  klasöründe (yoksa oluşturulur) tablo içeriği temizlenir, başlık satırı ve tüm kayıtlar
  güncel haliyle yazılır — böylece silinen kayıtlar tabloda geride kalmaz. Sessiz yenileme
  olmazsa yazım atlanır ve bağlantı kurulup yüklenir.
- **Depolama**: kayıtlar cihazdaki `localStorage` alanında (`tahakkuk.documents.v1`) tutulur ve
  hesaptan çıkış yapıldığında silinir.

### Sözleşme Modülü (`/modules/sozlesme/:recordNumber`)

Dosya Modülü'ndeki bir kayda bağlı sözleşmeleri yönetmek için; **herkese açıktır** fakat
listeye girmek için dosya kaydına ihtiyaç duyduğunuzdan erişim Dosya Modülü'ndeki
**"Sözleşme Aç"** düğmesiyledir:

- **Kayıt paneli**: adresdeki DOSYA ID ile eşleşen dosya kaydının özeti (işin adı, türü, usulü,
  alım tarihi) gösterilir; adres bir kayda işaret etmiyorsa yönlendirme notu görünür.
- **Sözleşme listesi**: kayda bağlı sözleşmeler tablo halinde listelenir (Sözleşme ID, firma
  adı, vergi no, tutar, tarih). Sözleşmeler `SOZ-000001` biçiminde benzersiz kimlik alır ve
  DOSYA ID'ye göre artan sıralanır.
- **Menu**: `Yeni sözleşme`, `Sil` ve gerektiğinde `Google Drive'a bağlan` düğmeleri.
- **Sözleşme formu**: firma adı, vergi no (10-11 haneli rakam), sözleşme tutarı (Türkçe sayı
  biçimi, örn. `12.500,75`) ve sözleşme tarihi (`YYYY-AA-GG`); hatalı alanlar form altında
  Türkçe gösterilir.
- **Otomatik Drive senkronizasyonu**: Modül açıldığında Drive'daki **sözleşmeler** tablosunun
  veri satırları (başlık satırı atlanarak) otomatik yüklenir; sözleşme eklendiğinde veya
  silindiğinde tablo, Dosya Modülü'ndeki gibi başlık satırıyla **baştan yazılır**.
- **Depolama**: sözleşmeler tarayıcıda kalıcı olarak tutulmaz; tablo okuması Drive
  üzerinden yapılır, yerel liste sayfa yenilemesinde Drive'dan yeniden kurulur.

### Damga Vergisi Hesaplama (`/modules/damga-vergisi-modulu`)

| Sıra | Alan | Nasıl hesaplanır |
| --- | --- | --- |
| 1 | KDV hariç fatura bedeli | Manuel giriş |
| 2 | KDV bedeli | Manuel giriş |
| 3 | KDV dahil fatura bedeli | `KDV hariç bedel + KDV bedeli` (sistemsel) |
| 4 | Damga vergisi kesintisi | `KDV hariç fatura bedeli × 9,48/1000` (sistemsel) |
| 5 | Tevkifat kesintisi | Manuel giriş |
| 6 | Ödenecek tutar | `KDV dahil fatura bedeli − damga vergisi kesintisi − tevkifat kesintisi` (sistemsel) |

Tutarlar kuruş hassasiyetinde yuvarlanır ve Türkçe para birimi biçiminde (`₺1.000,00`)
gösterilir. Modül giriş gerektirmez; yalnızca anasayfadaki yardımcı modül kartı üzerinden erişilir
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
| Yayında “Firebase Hosting Setup Complete / Welcome to Firebase Hosting” sayfası görünüyor | `firebase.json` → `hosting.public` değeri `dist/tahakkuk/browser` olmalı; `npm run build` sonrası yeniden `firebase deploy --only hosting` çalıştırın. |
| Yayında Google Drive bağlantısı başarısız | Cloud Console → Web client → **Authorized JavaScript origins** içine `https://tahakkuk.web.app` ekleyin. |
| Giriş yapılamıyor | Firebase Console → Authentication → Email/Password etkin mi? |
| `auth/operation-not-allowed` | Aynı ayar: Email/Password sağlayıcısı açık olmalı. |
| `auth/domain-not-authorized` | Authorized domains listesine alan adınızı ekleyin. |
| Değişiklikler görünmüyor | `npm start` çalışıyor mu? `npm run env:generate` sonrası yeniden başlatın. |
| “Google OAuth istemci kimliği yapılandırılmamış” | `.env` içine `VITE_GOOGLE_CLIENT_ID` ekleyip `npm run env:generate` çalıştırın. |
| Google ile yetkilendirme penceresi açılmıyor | Cloud Console → Credentials → Web client → **Authorized JavaScript origins** içine `http://localhost:4200` ekleyin; Drive API etkin olmalı. |
| Yetkilendirme 45 sn sonra “pencere yanıt vermedi” hatası veriyor | Pencere pop-up engelleyicide açıldıysa izne basın; yoksa bulundüğunuz adresin (ör. `http://localhost:4200`) **Authorized JavaScript origins** listesinde olduğunu ve OAuth consent ekranında hesabınızın **Test users** listesinde olduğunu kontrol edin. |
| Drive klasörü oluşmuyor | OAuth consent screen → Test users listesinde hesabınız olsun; `drive.file` kapsamı için ek izin gerekmez. |
| Bir işlem hata veriyor ama sebebi belli değil | Tüm hatalar tarayıcı konsoluna `[Tahakkuk] [HATA] <bağlam> | <zaman> \| <hata>` biçiminde yazılır (hata ayrıntısı ve yığın iziyle birlikte); geliştirici araçları → Console sekmesinde `[Tahakkuk]` ile filtreleyin. |

## İlgili belgeler

- [CHANGELOG.md](CHANGELOG.md) — sürüm bazlı değişiklik kayıtları
- [AGENTS.md](AGENTS.md) — geliştirme kuralları, token verimliliği ve MCP kullanım kuralları
