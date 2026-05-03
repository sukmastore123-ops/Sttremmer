# Setup untuk GitHub + EAS Build APK

## Langkah 1 — Siapkan file di repo GitHub

Upload **semua file ini** ke repo GitHub `sukmastore123-ops/Sttremmer`:

```
app/                  ← folder semua screen
components/           ← semua komponen UI
contexts/             ← StreamContext.tsx
assets/               ← gambar & font
constants/            ← warna dll
app.json              ← konfigurasi Expo
eas.json              ← konfigurasi EAS Build
babel.config.js       ← konfigurasi Babel
tsconfig.json         ← konfigurasi TypeScript
.github/workflows/eas-build-apk.yml  ← GitHub Actions
```

**PENTING:** Ganti nama `package-github.json` → `package.json`
(file ini sudah tidak pakai workspace/catalog, siap untuk GitHub)

---

## Langkah 2 — Tambahkan Secret di GitHub

1. Buka repo GitHub kamu
2. Klik **Settings** → **Secrets and variables** → **Actions**
3. Klik **New repository secret**
4. Nama: `EXPO_TOKEN`
5. Value: token dari [expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens)

---

## Langkah 3 — Trigger Build APK

Build otomatis jalan setiap kamu push ke branch `main`.

Atau trigger manual:
1. Buka tab **Actions** di GitHub
2. Pilih workflow **"EAS Build APK"**
3. Klik **Run workflow**

---

## Langkah 4 — Download APK

Setelah build selesai (~10-15 menit):
1. Buka [expo.dev](https://expo.dev)
2. Login dengan akun `sukmastore`
3. Pilih project **streameryoutube3**
4. Klik **Builds** → download APK

---

## Info Project

- **Expo Account:** sukmastore
- **Project ID:** 76070b1a-d009-4822-96f1-df1a56ec91af
- **Bundle ID Android:** com.zainalzxc.rtmpstreamer
- **Build Profile:** preview → menghasilkan APK (bisa langsung diinstall di HP)
