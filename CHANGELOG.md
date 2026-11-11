# Changelog

Bu dosya [Keep a Changelog](https://keepachangelog.com/tr/1.1.0/) biçimine göre tutulur ve
sürümler [Semantic Versioning](https://semver.org/lang/tr/) kurallarına uyar.

**Sürüm kuralı:** uygulama sürümü `package.json` içinde tutulur. Her kod değişikliğinde sürümün
son bileşeni bir artırılır (`0.0.1` → `0.0.2`); `0.0` (major.minor) kısmı yalnızca proje sahibi
istediğinde değiştirilir.

## [0.0.3] - 2026-11-11

### Eklenen

- Sürüm bilgisi `package.json` içinden okunarak footer'da gösteriliyor (`src/app/core/app-info.ts`).

### Değiştirilen

- **Profil bağlantısı yalnızca giriş yapmış kullanıcılara gösteriliyor.** Giriş yapmamış kullanıcılar
  üst menüde ve mobil menüde "Profil" bağlantısını görmez; `/profile` rotası `authGuard` ile
  korunmaya devam eder.
- **Footer sadeleştirildi:** yalnızca uygulama adı, telif bilgisi ve sürüm gösteriliyor; Dashboard,
  Profil ve Giriş bağlantıları kaldırıldı.
- Dashboard başlığındaki misafir "Giriş yap" butonu kaldırıldı; giriş bağlantısı artık yalnızca
  üst menüde bulunuyor.

### Düzeltilen

- Giriş yapmamış kullanıcının profil sayfasına erişmesi engellendi (rota koruması + menü
  gizleme).

## [0.0.2] - 2026-11-11

### Eklenen

- Misafirler için dashboard başlangıç sayfası: `/` ve `/dashboard` artık giriş gerektirmiyor,
  misafirler modül kartlarını ve “Giriş yap” butonunu görerek uygulamayı kullanabiliyor.
- Dashboard başlığında misafirler için **“Giriş yap”** butonu (`returnUrl=/dashboard` ile) ve
  giriş yapmış kullanıcılar için “Profili görüntüle” bağlantısı ayrımı.

### Değiştirilen

- `authGuard` yalnızca `/profile` rotasında korumalı; `dashboard` ve `modules/stamp-tax`
  misafirlere açık.

## [0.0.1] - 2026-11-11

### Eklenen

- Uygulama sürümü (`0.0.1`) `package.json` içine eklendi ve `src/app/core/app-info.ts` ile tek
  kaynaktan okunuyor.
- `src/app/layout/footer.component.*`: uygulama adı, telif bilgisi ve güncel sürümü gösteren
  altbilgi; shell içinde her sayfada görünüyor.
- `tsconfig.json` içine `resolveJsonModule` eklendi (`package.json` içe aktarımı için).

### Değiştirilen

- Damga vergisi modülü artık shell'in alt rotası: modül açıldığında **üst menü ve footer görünür**
  (misafirler için de aynı çerçeve; üst menüde “Giriş yap” gösterilir).
- `authGuard` shell rotasından çocuk rotalara taşındı: `dashboard` ve `profile` korumalı,
  `modules/stamp-tax` herkese açık kaldı.
- Damga vergisi modülü üst menüden ve mobil menüden **kaldırıldı**; yalnızca dashboard'daki modül
  kartı ve giriş ekranındaki kart üzerinden açılıyor.
- `tsconfig.json` içindeki `outDir` değeri `./dist/out-tsc` yerine `./out-tsc` yapıldı; app/spec
  config'leri ve `.gitignore` ile tutarlı hale geldi.

### Düzeltilen

- Damga vergisi modülü açıldığında üst menünün görünmemesi sorunu giderildi.

## [0.0.0] - 2026-11-11

### Eklenen

- Dashboard üzerinde **modül kartları** bölümü; masaüstünde her satırda 5 modül gösteren grid
  düzeni (`src/app/features/dashboard/`).
- **Damga Vergisi Hesaplama** modülü (`src/app/features/modules/stamp-tax/`): KDV hariç fatura
  bedeli, KDV bedeli, KDV dahil fatura bedeli, damga vergisi kesintisi (9,48/1000), tevkifat
  kesintisi ve ödenecek tutar hesaplaması.
- `SeoService` (`src/app/core/seo.service.ts`): sayfa başlığı, description, keywords, Open Graph,
  Twitter Card ve canonical bağlantısı yönetimi.
- `src/index.html` içinde SEO meta etiketleri, `WebApplication` JSON-LD yapısal verisi ve
  `lang="tr"` ayarı.
- `public/robots.txt` dosyası.
- `README.md` (kurulum ve kullanım), `CHANGELOG.md` ve `AGENTS.md` kuralları (token verimliliği,
  MCP kullanımı).

### Değiştirilen

- Para tutarları Türkçe biçimde gösteriliyor (`₺1.000,00`); uygulamada `tr-TR` locale'i
  kaydedildi ve `LOCALE_ID` `tr-TR` olarak ayarlandı.
- Dashboard’daki özet kartları korunurken modüller ayrı bir kart bölümü olarak sunuluyor.

### Düzeltilen

- `currency` pipe’inde Türkçe locale parametresinin yanlış konumda verilmesi sonucu oluşan
  `tr-TR1,000.00` görünümü giderildi.
