# CinemaBooking FrontEnd

Expo React Native app for CinemaBooking.

## Stack

- Expo 57
- React Native 0.86
- Expo Router
- React Native Web
- `expo-image`
- `react-native-youtube-iframe`

## Setup

```powershell
npm install
```

Set the backend URL in:

```text
src/config/index.ts
```

Use `http://localhost:8081` for local web, or your machine LAN IP for Expo Go on a physical device.

## Run

```powershell
npm start
```

Default Expo port:

```text
8082
```

Other scripts:

```powershell
npm run web
npm run android
npm run ios
npm run lint
```

## Main Screens

- movies list and movie detail
- inline trailer playback
- seat map and checkout
- bookings
- cinema list/detail/history
- admin movie, genre, cinema, staff, import, and showtime management
- staff showtime management and ticket scanning

## Notes

The frontend talks to the ASP.NET Core API through `src/api/client.ts`. Request bodies should be passed as plain objects; the client serializes JSON centrally.
