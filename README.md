# Rentlyt

> Manage smarter. Collect faster. Stress less.

Rentlyt is a free, offline-first mobile app for property owners to manage tenants, track monthly rent, and store rental documents — all on their phone with no servers, no subscriptions, and no data leaving their device.

---

## Features

- **Tenant profiles** — name, phone, building, room, rent amount, move-in date
- **Monthly rent tracker** — see who's paid and who hasn't, month by month
- **Document storage** — upload ID cards and rental agreements per tenant
- **Contract management** — set tenure, get alerts when contracts expire or need renewal
- **Vacancy tracking** — mark tenants as vacated; historical records stay intact
- **100% local** — all data is stored on your device using SQLite. Nothing is sent to any server.

---

## Download

### Android
> APK coming soon — check [Releases](https://github.com/peeyushktech/rentlyt/releases)

### iOS
Coming soon via TestFlight.

---

## Run locally

Requires [Node.js](https://nodejs.org) and the [Expo Go](https://expo.dev/go) app on your phone.

```bash
git clone https://github.com/peeyushktech/rentlyt.git
cd rentlyt
npm install
npx expo start --lan
```

Scan the QR code with your phone (iOS: camera app, Android: Expo Go app).

> Make sure your phone and computer are on the same Wi-Fi network.

---

## Tech stack

- [React Native](https://reactnative.dev) + [Expo](https://expo.dev) SDK 54
- [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) — local database
- [React Navigation](https://reactnavigation.org) — tab + stack navigation

---

## Contributing

Pull requests are welcome. For major changes, open an issue first.

---

## License

MIT
