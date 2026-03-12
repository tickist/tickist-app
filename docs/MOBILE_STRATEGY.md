# Tickist — Strategia przeniesienia na mobile / Google Play

Aplikacja to **Angular 21 + Vite + Supabase** — czysta SPA, bez PWA (brak service workera, brak web manifest).

---

## Opcje

### 1. 🏆 TWA (Trusted Web Activity) — najszybciej na Google Play

**Czas: ~1–2 dni**

Publikacja obecnej strony w Google Play Store jako TWA:

1. **Dodaj PWA** — `manifest.webmanifest`, service worker (`@angular/service-worker` lub Workbox), ikony.
2. **Zbuduj TWA** za pomocą [Bubblewrap](https://github.com/nicedoc/nicedoc.io/tree/master/nicedoc) lub [PWABuilder](https://www.pwabuilder.com/).
3. **Podpisz APK/AAB** i wrzuć do Google Play Console.

| ✅ Plusy | ❌ Minusy |
|---|---|
| Żadnych zmian w kodzie apki | Przeglądarka pod spodem |
| Pełen reuse | Brak natywnych API |
| Szybka publikacja | Push tylko przez Web Push |

---

### 2. ⚡ Capacitor — „natywna" powłoka wokół apki

**Czas: ~2–5 dni**

[Capacitor](https://capacitorjs.com/) opakowuje Angular SPA w natywny WebView z dostępem do natywnych API.

```bash
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add android
# po buildzie Angular:
npx cap sync
npx cap open android   # otwiera Android Studio
```

| ✅ Plusy | ❌ Minusy |
|---|---|
| Zachowanie całego kodu Angular | Minimalny narzut konfiguracyjny |
| Natywne API (push, kamera…) | Android Studio potrzebny do builda |
| Łatwa integracja | |

---

### 3. 📱 Ionic + Capacitor — lepszy UX mobilny

**Czas: ~1–3 tygodnie**

Dodanie Ionic UI components do istniejącego Angular — natywny wygląd, gesty, animacje.

| ✅ Plusy | ❌ Minusy |
|---|---|
| Natywny wygląd i zachowanie | Przepisanie UI (DaisyUI → Ionic) |
| Wspólny kod web + mobile | Znacznie więcej pracy |

---

### 4. 🔧 NativeScript / React Native / Flutter — pełny rewrite

**Czas: tygodnie–miesiące** — nie rekomendowane przy działającej aplikacji webowej.

---

## Porównanie

| Kryterium | TWA | Capacitor | Ionic+Cap |
|---|---|---|---|
| **Czas do Google Play** | 1–2 dni | 3–5 dni | 1–3 tyg. |
| **Zmian w kodzie** | Minimalnie (PWA) | Mało | Dużo (UI) |
| **Natywne API** | ❌ (Web API only) | ✅ | ✅ |
| **Natywny look** | ❌ | ❌ (Twój UI) | ✅ |
| **Push notifications** | Web Push | Native Push | Native Push |

---

## 🎯 Rekomendacja: Capacitor

Najlepszy balans szybkości i możliwości:

- Publikacja w Google Play
- Natywne push notifications
- Splash screen, ikona w systemie
- Dostęp do natywnych API w przyszłości
- Zachowanie całego Angular + Tailwind/DaisyUI kodu

> **Uwaga:** Niezależnie od wybranej ścieżki, pierwszy krok to dodanie PWA support (manifest + service worker).
