# Changelog

Bu dosya [Keep a Changelog](https://keepachangelog.com/tr/1.1.0/) biçimine göre tutulur ve
sürümler [Semantic Versioning](https://semver.org/lang/tr/) kurallarına uyar.

**Sürüm kuralı:** uygulama sürümü `package.json` içinde tutulur. Her kod değişikliğinde sürümün
son bileşeni bir artırılır (`0.0.1` → `0.0.2`); `0.0` (major.minor) kısmı yalnızca proje sahibi
istediğinde değiştirilir.

## [0.0.27] - 2026-11-25

### Eklenen

- **Sabit bilgi/uyarı alanı**: Dosya Modülü ve Sözleşme Modülü'nde mesaj alanı artık her zaman
  görünür; mesaj yokken soluk "Bilgi mesajı burada görünür." yer tutucusu gösterilir, başarı
  veya hata mesajı geldiğinde aynı alan yerinde güncellenir (düzen kayması olmaz).

### Değiştirilen

- **Benzersiz kimlik biçimi `DOS-000001`**: Dosya kayıtlarının benzersiz kimliği `REC-000001`
  yerine `DOS-000001` biçiminde üretilir; tablolardaki ve listelerdeki sütun başlığı
  **"Sıra No"** yerine **"DOSYA ID"** oldu (Dosya Modülü listesi, sözleşme modülü paneli ve
  Drive'daki "dosyalar"/"sözleşmeler" tablolarının ikinci sütunu). Eski `REC-` kimlikli
  kayıtlar okunmaya ve tekilleştirmeye devam eder; tabloya bir sonraki yazımda yeni kimlikler
  olduğu gibi korunur.

## [0.0.26] - 2026-11-25

### Eklenen

- **Sözleşme Modülü** (`/modules/sozlesme/:recordNumber`): Dosya Modülü listesindeki her
  kayıtta **"Sözleşme Aç"** düğmesi; kayda bağlı sözleşmelerin (firma adı, vergi no, sözleşme
  tutarı, sözleşme tarihi) yönetildiği yeni herkese açık modül. Sözleşmeler `SOZ-000001`
  biçiminde benzersiz kimlik alır, kaydın Sıra No'suyla ilişkilendirilir ve Drive'daki
  **"sözleşmeler"** tablosuna (başlık satırıyla) otomatik yazılır; modül açıldığında tablodaki
  mevcut sözleşmeler otomatik yüklenir. Anasayfada Dosya Modülü kartının altında tanıtım
  metni yer alır.
- **Google Drive otomatik bağlantı**: Kullanıcı giriş yaptığında Drive bağlantısı kendiliğinden
  kurulur — daha önce izin verilmişse pencere açılmadan (sessiz yenileme), ilk kezse tek
  seferlik onay penceresiyle. Profil sayfasındaki bağlan düğmesi de çalışmaya devam eder.

### Değiştirilen

- **Drive senkronizasyonu otomatikleşti**: Dosya Modülü'ndeki **"Drive'a Kaydet"** ve
  **"Drive'dan Yükle"** düğmeleri kaldırıldı. Kayıtlar eklendiğinde/düzenlendiğinde/silindiğinde
  "dosyalar" tablosu **baştan yazılarak** güncellenir (ekleme yerine tüm tablonun yeniden
  yazımı, böylece silinen kayıtlar tabloda geride kalmaz); bağlantı kurulduğunda tablo
  içeriği otomatik yüklenir. "Google Drive'a bağlan" düğmesi yalnızca oturum izni
  tazelenemediğinde görünür.

## [0.0.25] - 2026-11-24

### Eklenen

- **Benzersiz Sıra No**: Her kayıt `REC-000001` biçiminde kalıcı ve benzersiz bir numara alır;
  hem uygulama listesinde hem de Drive'daki "dosyalar" tablosunda **Sıra No** sütunu olarak
  gösterilir. Listeler ve tablo okuması bu numaraya göre artan sıralanır.
- "dosyalar" tablosu artık başlık satırıyla yazılır; okumada başlık satırı otomatik atlanır.

### Değiştirilen

- **Eksik veri sorunu giderildi**: Önceki sürümde "test" ve "TEST" gibi ad/tarih/tür değeri
  aynı olan satırlar tekilleştirmede karışıp atlanıyordu; tekilleştirme artık benzersiz
  Sıra No üzerinden yapılır. Başlıksız eski satırlar (Sıra No sütunu olmadan) da okunur;
  numarasız yerel kayıt, numaralı Drive satırıyla eşleştiğinde numara geriye dönük doldurulur.

## [0.0.24] - 2026-11-24

### Değiştirilen

- **Google Drive bağlantısı oturum boyunca korunur**: Çıkış yapıldığında (veya oturum düştüğünde)
  `tahakkuk.driveLink` kaydı artık tarayıcıdan silinmez; yalnızca bellek içi erişim token'ı ve
  bağlantı durumu sıfırlanır. Aynı kullanıcı yeniden giriş yaptığında bağlantı otomatik olarak
  geri yüklenir, yeniden "Google Drive'a bağlan" izni istenmez. Kayıt yalnızca "Bağlantıyı kes"
  ile veya farklı bir kullanıcı aynı hesapta bağlantı kurduğunda silinir.
- **Modül geri bağlantıları tamamen kaldırıldı**: Dosya Modülü ve Damga Vergisi Hesaplama
  sayfalarındaki "← Anasayfa'ya dön" bağlantısı kaldırıldı; gezinme anasayfadaki modül
  kartlarıyla yapılır.

### Düzeltilen

- `GoogleDriveService.info` artık düzgün bir readonly signal; oturum düşmesi durumunda yalnızca
  bellek içi durum (token, bilgi, durum) sıfırlanıyor.

## [0.0.23] - 2026-11-24

### Değiştirilen

- **Modül geri bağlantısı sadeleştirildi**: Dosya Modülü ve Damga Vergisi Hesaplama sayfalarındaki
  "← Giriş sayfasına dön" bağlantısı kaldırıldı; her iki modülde de tek bağlantı
  ("← Anasayfa'ya dön") gösteriliyor.

## [0.0.22] - 2026-11-24

### Eklenen

- **Merkezi hata günlüğü** (`src/app/core/error-logger.ts`): tüm hatalar tek biçimde konsola
  yazılır — `[Tahakkuk] [HATA]/[UYARI] <bağlam> | <zaman damgası> | <hata adı>: <mesaj>`; hata
  nesnesi (yığın iziyle) ve varsa Firebase hata kodu/ek ayrıntılar ayrı argüman olarak kaydedilir.
- **Global hata dinleyicileri** (`src/app/core/global-error-listeners.ts`): `window.onerror`
  (çalışma zamanı hataları ve yüklenemeyen kaynaklar) ile `unhandledrejection` (yakalanmamış
  Promise reddi) dinleyicileri `main.ts` içinde bootstrap öncesinde kurulur; böylece Angular'ın
  hata denetimine girmeyen hatalar da kaydedilir.
- **Yönlendirme hatası kaydı**: `app.config.ts` → `withNavigationErrorHandler(...)` ile sayfa
  yönlendirme hataları da konsola yazılır.
- **Hata denetimi testleri**: `error-logger.spec.ts`, `error-handler.spec.ts` ve
  `global-error-listeners.spec.ts` (9 test).

### Değiştirilen

- **Tüm hata yakalama blokları tek noktadan yazıyor**: Giriş/kayıt, Google giriş, profil
  güncelleme, Drive bağlantısı, sessiz token yenileme, GIS script yükleme, Drive'dan yükleme,
  Drive'a kaydetme, tarayıcı deposu ve kayıt saklama bloklarındaki doğrudan `console.*` çağrıları
  `ErrorLogger` servisine taşındı. Daha önce sessizce yutulan hatalar (kayıt okuma, bozuk
  bağlantı bilgisi, depolama erişimi, okunamayan Drive yanıt gövdesi) de kaydediliyor.
- **Global hata yakalayıcı** (`src/app/core/error-handler.ts`) artık `ErrorHandler` provider'ı
  olarak bağlıdır ve yakalanmamış hataları merkezi günlüğe yazar.

## [0.0.21] - 2026-11-24

### Düzeltilen

- **Dosya Modülü otomatik yükleme**: Dosya Modülü açıldığında Drive'daki "dosyalar" tablosuna
  kaydedilen kayıtlar listelenmiyordu. Otomatik yükleme, bellekteki erişim token'ına
  (`hasSessionToken`) koşullu olduğu için sayfa yenilemesinden sonra (token bellek içinde
  tutulduğu için kayboluyordu) hiç çalışmıyordu. Artık modül açılışında Drive bağlantı kaydı
  geri yüklendiğinde (restore) satırlar otomatik okunur.
- **Sessiz token yenileme**: `GoogleDriveService` sayfa yenilemesi sonrası token olmadan da
  daha önce verilen izinle sessizce yeni token alıyor (`prompt: 'none`, 15 sn zaman aşımı);
  "dosyalar" tablosu okuma bu sessiz token ile yapılıyor. Sessiz yenileme olmazsa kullanıcıya
  Türkçe bir hata gösteriliyor ve `Google Drive'a bağlan` düğmesi (oturumu tazelemek için)
  görünür kalıyor.
- **Bağlantı kurulan akış**: `Drive'dan Yükle` düğmesi bağlantı kurduğunda satırlar tekrar
  okunuyor (çift yüklenme engellendi).

## [0.0.20] - 2026-11-13

### Düzeltilen

- **Drive'dan yükleme**: Dosya Modülü'ne `Drive'dan Yükle` (veya bağlantı sonrası otomatik
  yükleme) tablo verilerini okurken `values/A1` aralığı istiyordu. A1 notasyonunda bu yalnızca
  A1 hücresini (başlık hücresini) döndürdüğü için kayıtlar listelenmiyordu; okuma
  `values/A1` yerine açık uçlu `values/A:ZZ` aralığına çevrildi ve başlık satırı çağıran
  tarafa bildirilen başlık listesiyle karşılaştırılarak atlanıyor.
- **Drive'a kaydetme**: satır ekleme isteğindeki `valueInputOption=USER_ENTERED` yerine
  `RAW` kullanılıyor. Böylece alım tarihi gibi değerler Sheets'te ayrıştırılıp yerel biçime
  (örn. `1/15/2026`) dönüşmüyor; yazılan biçim birebir korunarak geri okunuyor.
- **Tarih biçimi**: `RAW`'a geçmeden önce yazılmış eski satırların tarihleri okunurken
  tablonun yerel biçiminden (`15.01.2026`, `1/15/2026`) `YYYY-AA-GG` biçimine çevriliyor.
  Gün/ay sırası belirsiz olan değerler (örn. `05/06/2026`) olduğu gibi bırakılır.

## [0.0.19] - 2026-11-12

### Değiştirilen

- **Anasayfa**: `dashboard` → `anasayfa` oldu. `/` yönlendirmesi, menü bağlantıları, modül
  geri dönüş linkleri ve giriş sonrası varsayılan hedef `anasayfa` olacak şekilde
  güncellendi; sayfa başlığı ve SEO bilgisi "Anasayfa | Tahakkuk".
- **Modül kategorileri**: anasayfada artık iki ayrı kart var — **Ana Modüller** (Dosya Modülü)
  ve **Yardımcı Modüller** (Damga Vergisi Hesaplama). Dosya modülü ana modül, damga vergisi
  hesaplama yardımcı modül olarak gruplandırıldı.

## [0.0.18] - 2026-11-12

### Eklenen

- **30 dakikalık oturum zaman aşımı**: `IdleTimeoutService` — kullanıcı giriş yaptığında
  fare/klavye/dokunma etkileşimlerini izler, 30 dakika işlem yapılmazsa oturumu kapatır ve
  `/login?reason=idle` adresine yönlendirir; giriş ekranında bunu açıklayan bir not görünür.

### Değiştirilen

- **Google Drive bağlantısı oturum boyunca açık kalıyor**: bağlantı bilgisi (hesap e-postası,
  klasör kimliği/tarihi — token değil) artık `localStorage` üzerinde tutuluyor; sayfa
  yenilemede ve yeni sekmede bağlantı korunur. Çıkışta (elle veya otomatik) `tahakkuk.*`
  anahtarları silindiği için bağlantı kapanır. Erişim token'ı yalnızca bellekte tutulur.

### Düzeltilen

- **Drive "dosyalar" tablosuna yazma hatası**: Sheets API'nin projede kapalı olmasından kaynaklı
  403 (`has not been used ... or it is disabled`) artık ayrı hata kodu ve çözüm adımlı Türkçe
  mesaj üretiyor; Hizmet Sheets API projede etkinleştirildi.

## [0.0.17] - 2026-11-12

### Eklenen

- **Dosya Modülü (`/modules/dosya`)**: iş kayıtları listesi, basit menü (`Yeni kayıt`,
  `Düzenle`, `Sil`, `Drive'a Kaydet`) ve popup akışları (düzenle/sil için kayıt seçim penceresi).
- **JSON doğrulama şeması**: `src/app/features/modules/documents/document.schema.json`
  (işin adı, türü, usulü, ihale/doğrudan temin usul detayları, alım tarihi, açıklama); form
  doğrulaması bu şemadan türetilen kurallarla yapılır ve hatalar Türkçe gösterilir.
- **Drive'a Kaydet**: `tahakkuk.web.app` klasörü içindeki **dosyalar** tablosuna (Google Sheets)
  kayıtlar eklenir; tablo yoksa oluşturulur ve başlık satırı yazılır, varsa satırlar eklenir.
  Kaydedilen kayıtlar listede "Kaydedildi" olarak işaretlenir.

### Değiştirilen

- **Damga vergisi modülü URL'si** `/modules/stamp-tax` → `/modules/damga-vergisi-modulu`
  olarak değiştirildi (rota, dashboard kartı, canonical/SEO adresi ve giriş yönlendirmesi
  güncellendi).

### Düzeltilen

- Drive klasörü/liste sorgusu hata verirse (oturum düşmesi, ağ hatası) artık körü körüne yeni
  klasör/sheet oluşturulmuyor; `FOLDER_LOOKUP_ERROR` ile işlem güvenli şekilde durduruluyor.
- `GoogleDriveService` erişim token'ını yalnızca bellekte saklıyor; çıkışta temizleniyor.

## [0.0.16] - 2026-11-12

### Düzeltilen

- **Çıkışta tarayıcı verileri temizleniyor**: `AuthService.logout()` artık Firebase çıkışının
  ardından uygulamaya ait tarayıcı kayıtlarını (`tahakkuk.` ile başlayan
  `sessionStorage`/`localStorage` anahtarları — Drive bağlantı bilgisi dahil) siliyor.
  `GoogleDriveService` ayrıca oturum kapandığında (çıkış veya oturum düşmesi) bağlantı durumu
  sinyallerini de sıfırlıyor; yeni kullanıcı aynı sekmede giriş yaptığında eski Drive bağlantısı
  görünmüyor.

## [0.0.15] - 2026-11-12

### Eklenen

- **Gizlilik Politikası (`/policy`) ve Kullanım Koşulları (`/terms`) sayfaları**: misafirler dahil
  herkese açık, shell şablonu içinde açılan iki hukuki sayfa; her ikisi de Türkçe başlığa ve
  `SeoService.setPage()` çağrısına sahip. OAuth consent screen doğrulamasında istenen herkese
  açık adresler artık `https://tahakkuk.web.app/policy` ve `https://tahakkuk.web.app/terms`
  olarak uygulama içinde yayınlanıyor.

## [Güncellenmemiş]

### Değiştirilen

- **README** → Google Drive bölümünde OAuth consent screen "Testing" durumunun etkisi
  netleştirildi: listede olmayan hesaplar "Error 403: access_denied" ile reddedilir; Test
  users ekleme ve Production yayınlama adımları ile hata mesajı belgelendi.

## [0.0.14] - 2026-11-12

### Düzeltilen

- **Google Drive bağlantısı "GIS scripti yüklenemedi" hatasını kaldırdı**: servis GIS API'sını
  yanlış yoldan (`window.google.oauth2`) arıyordu; `accounts.google.com/gsi/client` scripti API'yi
  `window.google.accounts.oauth2` olarak yayınladığı için script doğru şekilde yüklenmesine rağmen
  her seferinde 20 sn zaman aşımına uğranıyordu (toplam 2 deneme). Kontrol ve token istemcisi
  oluşturma artık `window.google.accounts.oauth2` üzerinden yapılıyor.

## [0.0.13] - 2026-11-12

### Eklenen

- **Login ekranına Google ile giriş**: "Giriş yap" modunda formun altında "Google ile giriş yap"
  düğmesi (hesap oluşturma modunda görünmez). Giriş Firebase'in kendi OAuth akışıyla
  (`signInWithPopup`) yapılır; bu akış Cloud Console origins veya `VITE_GOOGLE_CLIENT_ID`
  gerektirmez — yalnızca Firebase Console'da Google sağlayıcısının etkin olması yeterlidir.

### Değiştirilen

- Google Drive yetkilendirmesi artık **Firebase e-postasına bağlı değil**: `login_hint` kaldırıldı,
  `ACCOUNT_MISMATCH` kontrolü atıldı. Kullanıcı Google penceresinde serbestçe hesap seçer veya
  yeni bir Google hesabı oluşturur; bağlantı seçilen Google hesabına yapılır (ör.
  `asd@asd.com` ile Firebase'de giriş yapan biri Drive'ına ait herhangi bir Google hesabını
  seçebilir).
- GIS scripti yüklemesi dayanıklı hale getirildi: timeout 15 sn'den 20 sn'ye çıkarıldı ve
  ilk denemede yüklenmeyen script sayfadan sökülüp **2 kez** denenir (zayıf ağda yarıda
  kalan script'in üstüne yazılmaz).

### Düzeltilen

- "GIS scripti yüklenemedi (8 sn...)" hata metni gerçek süreyi (20 sn x 2 deneme) yansıtacak
  şekilde ve tarayıcı Network sekmesini işaret ederek güncellendi.
- `fetchAccount` artık e-posta alınamazsa Firebase e-postasıyla kapatmak yerine
  `USERINFO_ERROR` üretir; bağlı hesap her zaman gerçek Google hesabıdır.
- Google giriş hataları (`popup-blocked`, `popup-closed-by-user`, `unauthorized-domain`,
  `operation-not-allowed`) Türkçe çözüm önerileriyle `auth-errors.ts`'e taşındı.

## [0.0.11] - 2026-11-12

### Eklenen

- Google Drive yetkilendirmesi **Firebase Auth oturumuna bağlı**: Google penceresi, giriş
  yapılan e-posta adresi `login_hint` olarak geçirilerek açılır (doğru hesapla başlar) ve
  token'daki Google hesabı Firebase hesabıyla farklıysa bağlantı `ACCOUNT_MISMATCH` hatası
  ile reddedilir; Drive'a farklı bir hesapla bağlanılamaz.

### Değiştirilen

- Profil sayfasındaki "Bağlı hesaplar" akışı artık Firebase oturumu + Google hesabı
  eşleşmesini doğrular; hata mesajları Türkçedir.

## [0.0.10] - 2026-11-12

### Değiştirilen

- Deploy hedefi Firebase Hosting sitesinden seçildi: `firebase target:apply hosting tahakkuk
  tahakkuk` + `firebase.json` → `hosting.target: "tahakkuk"`. Birincil yayın adresi artık
  **`https://tahakkuk.web.app`** (`tahakkuk-bc03b.web.app` sitesinde aynı proje kalır).
- README ve AGENTS.md deploy bölümü yeni hedefe ve adrese göre güncellendi.

## [0.0.9] - 2026-11-12

### Düzeltilen

- `.firebase/` (CLI deploy cache'i) `.gitignore`'a eklendi ve repodan kaldırıldı; proje
  yapılandırması (`.firebaserc`, `firebase.json`) versiyon kontrolünde kalır, geçici cache
  dosyaları commit edilmez.

## [0.0.8] - 2026-11-12

### Düzeltilen

- `firebase.json` → `hosting.public` değeri `dist` yerine **`dist/tahakkuk/browser`** yapıldı;
  yanlış dizin yüzünden yayında Firebase'in "Welcome to Firebase Hosting / Setup Complete"
  hazır sayfası görünüyordu.
- `.firebaserc` → `default` projesi `tahakkuk-bc03b` olarak düzeltildi.

### Değiştirilen

- README'ye **Dağıtım (Firebase Hosting)** bölümü ve sorun giderme satırları eklendi;
  `tahakkuk-bc03b.web.app` adresi artık dokümante edildi (Authorized domains / JavaScript
  origins hatırlatmasıyla).

## [0.0.7] - 2026-11-12

### Değiştirilen

- Google Identity Services scripti artık `src/index.html` içinde sayfa yüklenirken çalışır
  (`async defer`) ve uygulama içi dinamik yükleme yedeği olarak kalır; butona basıldığında
  script'in hazır olup olmadığına kalmadan yetkilendirme akışı başlar.
- Script yüklenme zaman aşımı 8 sn'den 15 sn'ye çıkarıldı (yavaş/engelli ağlarda erken
  hata yerine makul bekleme).

## [0.0.6] - 2026-11-12

### Düzeltilen

- `GIS_TIMEOUT` (script yüklenemedi) artık orijin/pop-up hatası olarak yanlış gösterilmiyor; ağ/Google
  erişim sorunu olarak doğru mesaj veriliyor. Pencere yanıt vermezse `TOKEN_WAIT_TIMEOUT`, script
  yüklenemezse `GIS_SCRIPT_ERROR` / `GIS_TIMEOUT` kodlarıyla ayrı mesajlar gösteriliyor.
- Google Drive bağlantısı başarısız olduğunda gösterilen hata mesajı artık **hata kodunu ve
  çözüm adımını** içeriyor: orijin/Authorized JavaScript origins uyarısı (yetkilendirme
  zaman aşımı), Google Drive API etkinliği uyarısı (klasör oluşturma hatası).
- Hata mesajları, bağlantı akışının hangi adımında (token / hesap bilgisi / klasör oluşturma)
  takıldığını gösteriyor.
- Yetkilendirme penceresi hiç yanıt vermediğinde (pop-up engellendi, pencere kapatıldı, orijin
  kayıtlı değil) arayüz 45 sn sonra **"Bağlanıyor..."** durumunda asılı kalmaz, hata kodu
  `TOKEN_WAIT_TIMEOUT` ile çözüm adımlarını gösterir.



### Eklenen

- **Google Drive bağlama modülü** (`src/app/core/google-drive.service.ts`): giriş yapmış kullanıcı
  Google hesabıyla yetki verir; `drive.file` kapsamı sayesinde kullanıcının Drive'ında
  `tahakkuk.web.app` adlı klasör otomatik oluşturulur (varsa mevcut klasör bulunur, tekrar
  oluşturulmaz).
- Profil sayfasında **Bağlı hesaplar** paneli: bağlantı durumu (Bağlı değil / Bağlanıyor / Bağlı /
  Hata), bağlı Google hesabı e-postası, klasör adı, klasör kimliği, Drive bağlantısı, bağlantı
  tarihi ve "Bağlantıyı kaldır" eylemi.
- `VITE_GOOGLE_CLIENT_ID` ortam değişkeni (`.env.example` + `scripts/generate-env.mjs` →
  `environment.google.clientId`).

### Değiştirilen

- Footer artık pencerenin en altında: shell flex kolon düzenine geçti, içerik uzadıkça footer aşağı
  doğru itiliyor (`.content { flex: 1 0 auto; }`, `.footer { margin-top: auto; }`).

### Kaldırılan

- Giriş ekranındaki damga vergisi modülü kartı ve ilişkili stiller/importlar; modüle yalnızca
  dashboard üzerinden erişiliyor.



### Kaldırılan

- Dashboard başlığı (karşılama metni, “Giriş yap” bağlantısı ve “Profili görüntüle” bağlantısı).
- Özet kartları (Toplam tahakkuk, Bekleyen ödeme, Bu ay).
- “Son hareketler” paneli (hesap oluşturuldu, oturum başlatıldı, profil güncellendi).

### Değiştirilen

- Dashboard artık yalnızca **Modüller** bölümünden oluşuyor; kullanılmayan kart/panel stilleri ve
  veri alanları kaldırıldı.

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
