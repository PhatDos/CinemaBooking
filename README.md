# CinemaBooking

![CI](https://github.com/PhatDos/CinemaBooking/actions/workflows/ci.yml/badge.svg)

CinemaBooking is a cinema booking system with a modular ASP.NET Core backend and an Expo React Native frontend. It covers movie catalog management, genres, cinemas, rooms, seat maps, showtimes, staff assignment, ticket scanning, checkout, payment integration, and safe concurrent seat holds.

The current app is built for local development with:

- ASP.NET Core / .NET 10
- Entity Framework Core and SQL Server
- Redis for temporary seat holds
- JWT authentication with Admin, Staff, and customer flows
- Expo Router / React Native / React Native Web
- Cloudinary for movie poster upload/import support
- PayOS payment flow and webhook handling
- xUnit backend tests and k6 load tests

## Project Structure

```text
CinemaBooking/
  FrontEnd/                         Expo app
    app/                            Expo Router screens
    src/api/                        API clients
    src/auth/                       auth context/token flow
    src/styles/                     screen and component styles

  src/
    CinemaBooking.Api/              ASP.NET Core API, controllers, seed data
    CinemaBooking.SharedKernel/     shared exceptions and common primitives
    Modules/
      CinemaBooking.Modules.Identity/
      CinemaBooking.Modules.Catalog/
      CinemaBooking.Modules.Theater/
      CinemaBooking.Modules.Scheduling/
      CinemaBooking.Modules.Booking/
      CinemaBooking.Modules.Payment/
      CinemaBooking.Modules.Ticketing/

  tests/
    CinemaBooking.UnitTests/
    CinemaBooking.IntegrationTests/
    load/                           k6 scripts
```

## Backend Modules

The backend is a modular monolith. Each module owns its domain, application, infrastructure, contracts, and migrations where applicable. Modules communicate through contracts instead of reading another module's DbContext directly.

- `Identity`: users, roles, staff cinema assignments
- `Catalog`: movies, genres, movie import pipeline
- `Theater`: cinemas, rooms, seats, cinema images
- `Scheduling`: showtimes and per-seat-type showtime pricing
- `Booking`: seat holds, bookings, seat availability
- `Payment`: PayOS payments, webhook handling, outbox
- `Ticketing`: ticket generation, email outbox, ticket check-in

## Main Features

- Browse now-showing movies and movie detail pages.
- Inline YouTube trailer playback in-app.
- Select seats with real-time availability.
- Temporary Redis seat holds with expiry.
- Booking and checkout through PayOS.
- Admin movie, genre, cinema, room, seat, staff, and showtime management.
- Staff showtime management for assigned cinemas only.
- Staff ticket scanning/check-in.
- Moveek movie import workflow with scheduled/admin-triggered discovery, candidate crawling, and admin approval.
- Cloudinary poster upload/import plumbing.
- Seed cinemas grouped by city with default rooms, seats, staff assignment, and showtimes.

## Roles

- `Admin`
  - Manages movies, genres, cinemas, rooms, seats, staff, imports, and showtimes.
  - Can assign staff to cinemas.
- `Staff`
  - Can manage rooms/seats/showtimes only for assigned cinemas.
  - Can scan/check in tickets for assigned cinemas.
  - Cannot create or update the movie catalog.
- Customer/user
  - Browses movies, holds seats, books tickets, pays, and views bookings.

## Seat Holds And Booking Safety

Seat booking uses two protection layers.

1. Redis temporary hold

```text
seat-hold:{showtimeId}:{seatId}
```

The key is written atomically using `SET NX` with a TTL, so only one user can temporarily hold a seat.

2. SQL unique constraint

`BookingSeats` enforces uniqueness on:

```text
(ShowtimeId, SeatId)
```

Redis improves user experience; SQL remains the final guard against double booking.

## Showtime Pricing

Showtimes store prices per seat type:

- `StandardPrice`
- `VipPrice`
- `CouplePrice`

`BasePrice` is still kept for compatibility and mirrors the Standard price for new showtimes. Staff/Admin showtime creation defaults to:

```text
Standard: 90000
VIP:      100000
Couple:   200000
```

Seat availability, hold payment, and booking totals use the showtime's stored seat-type prices.

## Movie Import

Movie import is a candidate-based workflow. The system can automatically create a monthly Moveek import batch when `MovieImport:Enabled` is true, but movies are not inserted into the public catalog until an Admin approves a candidate.

Flow:

- Scheduled import check runs in `CinemaBooking.Api/MovieImports/MovieImportScheduler.cs`.
- Admin can trigger discovery/crawl from `AdminMovieImportsController`.
- `POST /api/admin/movie-imports/discover` creates a batch of discovered candidates from Moveek listing pages.
- `POST /api/admin/movie-imports/run` discovers candidates and crawls their detail pages in one batch.
- `POST /api/admin/movie-imports/{batchId}/crawl` crawls an existing batch.
- `POST /api/admin/movie-import-candidates/{candidateId}/crawl` crawls one candidate.
- `POST /api/admin/movie-import-candidates/{candidateId}/approve` inserts or updates the movie in Catalog.
- Approved candidate posters can be mirrored through Cloudinary by `CloudinaryMoviePosterImporter`.

Important files:

- `src/CinemaBooking.Api/MovieImports/MovieImportScheduler.cs`
- `src/CinemaBooking.Api/Controllers/AdminMovieImportsController.cs`
- `src/Modules/CinemaBooking.Modules.Catalog/Application/MovieImports/MovieImportService.cs`
- `src/Modules/CinemaBooking.Modules.Catalog/Application/MovieImports/MoveekMovieImportProvider.cs`
- `src/CinemaBooking.Api/Media/CloudinaryMoviePosterImporter.cs`

## Local Backend Setup

Requirements:

- .NET 10 SDK
- SQL Server or Docker
- Redis connection string

Copy the development settings template:

```powershell
Copy-Item src/CinemaBooking.Api/appsettings.Development.example.json src/CinemaBooking.Api/appsettings.Development.json
```

Fill in local values for:

- `ConnectionStrings:Database`
- `ConnectionStrings:Redis`
- `Jwt:Key`
- `AdminSeed`
- `StaffSeed`
- optional `PayOS`
- optional `Cloudinary`
- optional `Email`

Run migrations:

```powershell
dotnet ef database update --project src/Modules/CinemaBooking.Modules.Catalog --startup-project src/CinemaBooking.Api --context CatalogDbContext
dotnet ef database update --project src/Modules/CinemaBooking.Modules.Theater --startup-project src/CinemaBooking.Api --context TheaterDbContext
dotnet ef database update --project src/Modules/CinemaBooking.Modules.Scheduling --startup-project src/CinemaBooking.Api --context SchedulingDbContext
dotnet ef database update --project src/Modules/CinemaBooking.Modules.Booking --startup-project src/CinemaBooking.Api --context BookingDbContext
dotnet ef database update --project src/Modules/CinemaBooking.Modules.Payment --startup-project src/CinemaBooking.Api --context PaymentDbContext
dotnet ef database update --project src/Modules/CinemaBooking.Modules.Ticketing --startup-project src/CinemaBooking.Api --context TicketingDbContext
dotnet ef database update --project src/Modules/CinemaBooking.Modules.Identity --startup-project src/CinemaBooking.Api --context IdentityDbContext
```

Start the API:

```powershell
dotnet run --project src/CinemaBooking.Api --urls http://localhost:8081
```

Health check:

```text
GET http://localhost:8081/health
```

Swagger:

```text
http://localhost:8081/swagger
```

## Docker

Create `.env` from `.env.example` and fill required values:

```powershell
Copy-Item .env.example .env
```

Run:

```powershell
docker compose up --build
```

The API is exposed on:

```text
http://localhost:8081
```

Docker Compose starts the API and SQL Server. Redis is supplied through `REDIS_CONNECTION_STRING`.

## Frontend Setup

Requirements:

- Node.js
- npm
- Expo CLI through `npx expo`

Install dependencies:

```powershell
cd FrontEnd
npm install
```

Check the API URL in:

```text
FrontEnd/src/config/index.ts
```

For web on the same machine, `http://localhost:8081` is usually enough. For Expo Go on a phone, use the LAN IP of the backend machine, for example:

```ts
export const API_URL = 'http://192.168.1.158:8081';
```

Start Expo:

```powershell
npm start
```

The project defaults to Expo port `8082`.

Useful scripts:

```powershell
npm run web
npm run android
npm run ios
npm run lint
```

## Common API Areas

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/movies`
- `GET /api/movies/now-showing`
- `POST /api/movies` Admin
- `GET /api/genres`
- `POST /api/genres` Admin
- `GET /api/cinemas`
- `POST /api/cinemas` Admin
- `GET /api/cinemas/{cinemaId}/rooms`
- `POST /api/cinemas/{cinemaId}/rooms` Admin/Staff with cinema authorization
- `GET /api/cinemas/{cinemaId}/showtimes`
- `POST /api/showtimes` Admin/Staff with room authorization
- `POST /api/showtimes/bulk` Admin/Staff with room authorization
- `GET /api/showtimes/{showtimeId}/seats`
- `POST /api/showtimes/{showtimeId}/holds`
- `POST /api/bookings`
- `POST /api/payments`
- `POST /api/tickets/check-in` Admin/Staff
- `GET /api/staff/me/cinemas` Staff
- `POST /api/cinemas/{cinemaId}/staff` Admin
- `POST /api/admin/movie-imports/run` Admin

## Tests

Run backend tests:

```powershell
dotnet test CinemaBooking.slnx --configuration Release
```

Run frontend lint:

```powershell
cd FrontEnd
npm run lint
```

## k6 Load Tests

Load scripts live in `tests/load`.

Set the API URL:

```powershell
$env:BASE_URL="http://localhost:8081"
```

Seed test users:

```powershell
k6 run tests/load/seed-users.js
```

Pick a showtime and available seat:

```powershell
$showtime = @(Invoke-RestMethod "$env:BASE_URL/api/showtimes")[0]
$seat = @(
  Invoke-RestMethod "$env:BASE_URL/api/showtimes/$($showtime.id)/seats" |
  Where-Object { $_.status -eq "AVAILABLE" }
)[0]

$env:SHOWTIME_ID=$showtime.id
$env:SEAT_ID=$seat.seatId
```

Run load tests:

```powershell
k6 run tests/load/concurrent-hold.js
k6 run tests/load/hold-and-book-same-seat.js
k6 run tests/load/hold-same-seat.js
k6 run tests/load/seat-availability-read.js
```

## Seed Data

Development seed data creates:

- Admin user from `AdminSeed`
- Staff user from `StaffSeed`
- city-grouped cinemas for Ho Chi Minh City, Ha Noi, Da Nang, Can Tho, and Hai Phong
- default `Room 1`
- standard 36-seat layout with Standard, VIP, and Couple seats
- sample genres, movies, and future showtimes

Legacy seed/test data with old prefixes is cleaned during development seeding.

## Notes

- Do not commit real SQL Server, Redis, JWT, PayOS, SMTP, Cloudinary, admin, or staff secrets.
- Docker maps API host port `8081` to container port `8080`.
- FE defaults to port `8082`.
- Staff showtime management depends on staff being assigned to a cinema.

## CI

GitHub Actions runs restore, build, tests, and Docker image build on pushes and pull requests to `main`.
