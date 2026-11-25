# Abdullah Mert Delice — Game Boy portfolyo (HYDRO)

Canlı: https://hydro567.github.io/abdullahmertdelice/ — GitHub Pages, `main` dalından yayınlanır (derleme yok, statik dosyalar).
Kullanıcıyla Türkçe konuş.

## Yapı
- `index.html` — ana sayfa. Kendi yazdığımız WebGL çizici (Three.js yok, CDN bağımlılığı yok):
  GLB ayrıştırıcı, matris kütüphanesi, renk-kimliği ile tıklama seçimi (picking), yörünge kamera.
  Model: Snokke/game-boy-challenge (MIT) `game-boy.glb` ve `game-boy-cartridge.glb`, `js/models.js` içinde base64 gömülü
  (artifact sunucusu .glb sunmadığı için).
- `js/games.js` — kaset oyunları: TURBO HYDRO (sözde-3D yarış), HYDRO HERO (platform), HYDRO STRIKE (uzay atış).
- `js/audio.js` — 8-bit ses motoru ve özgün chiptune müzikler (menu, race, plat, shoot). Ses tekerleği 4 kademe.
- `assets/data.js` — projeler ve yetenekler listesi (ekrandaki kartlar buradan gelir). Proje kartında A → canlı site yeni sekmede.
- `assets/pixelart.js` — ekrandaki piksel sahneler (başlık, proje/yetenek görselleri).
- `yetenekler/*.html`, `hakkimda.html` + `assets/page.css`, `assets/page.js` — ayrı sayfalar.
- `textures/` — Snokke'nin baked dokuları; `body.jpg` turkuaz boyanmış + "GAME BOY COLOR" yazılı (Nintendo logosu yok),
  kaset etiketleri Hydro'ya ait özgün çizimler.
- `img/portre.jpg` — kullanıcının piksel portresi (Hakkımda sayfasında, kapak + iletişim yanı).

## Akış (kullanıcının gönderdiği videoya göre)
Kapalıyken konsol çapraz durur, yan paneller gizli, ses tekerleği yanında ipucu. Açınca kamera önden yakın plana geçer,
paneller görünür. Ekran: beyaz ekranda renkli HYDRO logosu → gri → siyah → daktilo tanıtım → gece sahnesi + "THE WEBSITE OF HYDRO" + menü.
Kasetler sağda süzülür; tıklanınca yukarı kalkıp arkadaki yuvaya iner (Snokke'nin konum değerleri, x ekseni aynalı). Mobilde kasetler cihazın altında sıralı.

## Kullanıcının kararları
- Sitede mızrak/trident olmayacak (arka plandan, oyun karakterinden, kaset etiketinden kaldırıldı).
- Instagram adresi sitede yok. İletişim: telefon/WhatsApp 0551 006 16 82, abdullahmertdelice25@gmail.com, github.com/hydro567.
- Projeler: Hydro Parfüm, Hydro Pizza, Hydro Residence (üçü de canlı).
- Buddy oyunu ve İnşaat Simülatörü bu sitede listelenmez.
- sadok.mx tarzı düzen; sadok'un fotoğrafı, oyun görselleri ve kodu kullanılmaz. Nintendo/Mario gibi markalı karakter ve logolar kullanılmaz.

## Test
`python3 -m http.server 8000` sonra `python3 tools/test_site.py` (Playwright + Chrome, SwiftShader WebGL).
Değişiklikten sonra yayınlamadan önce ekran görüntüsüyle kontrol et.

## Doku üretimi
`tools/govde_dokusu.py` gövde dokusunu yeniden üretir (Snokke reposu ve ekran duvarı UV verisi gerekir; betiğin başındaki nota bak).

## Claude artifact önizlemesi
Aynı site Claude'da önizleme olarak da var: https://claude.ai/artifact/Kn19haz6D1Rjnp7mRPVxGN
