# CinemaBooking

![CI](https://github.com/PhatDos/CinemaBooking/actions/workflows/ci.yml/badge.svg)

CinemaBooking is a modular monolith cinema booking API built with ASP.NET Core, Entity Framework Core, SQL Server, Redis Cloud, JWT authentication, Swagger, and a mock payment flow.

The project focuses on the core booking problem: many customers can try to reserve the same seat at the same time, but only one reservation should win.

## Architecture

```text
                +---------------+
                |  Client / RN  |
                +-------+-------+
                        |
                    HTTP/JWT
                        |
                        v
+---------------------------------------------------+
|                 ASP.NET Core API                  |
|                                                   |
|  +----------+  +---------+  +---------+           |
|  | Identity |  | Catalog |  | Theater |           |
|  +----------+  +---------+  +---------+           |
|                                                   |
|  +------------+  +---------+  +---------+         |
|  | Scheduling |  | Booking |  | Payment |         |
|  +------------+  +---------+  +---------+         |
+----------------------+----------------------------+
                       |
              +--------+--------+
              |                 |
              v                 v
        SQL Server        Redis Cloud
              |                 |
     Persistent state     Temporary seat holds
     Unique constraints   TTL based locks
```

CinemaBooking is implemented as a modular monolith. Each module owns its application, domain, infrastructure, and contracts layer.

Modules:

- Identity
- Catalog
- Theater
- Scheduling
- Booking
- Payment

Modules do not access another module's DbContext directly. Cross-module communication is performed through module contracts.

## Booking Concurrency

Seat reservation uses two layers of protection.

### Redis temporary hold

When a customer selects a seat, the API creates a Redis key:

```text
seat-hold:{showtimeId}:{seatId}
```

The key is written atomically using `SET NX` with a TTL. This ensures only one customer can temporarily hold a seat at a time.

### SQL Server unique constraint

Redis is not treated as the final source of truth.

`BookingSeats` has a unique constraint on:

```text
(ShowtimeId, SeatId)
```

This prevents double booking even if multiple requests reach the database concurrently.

## Booking Lifecycle

```text
AVAILABLE
    |
    v
  HELD        Redis temporary hold
    |
    v
RESERVED     Booking = Pending
   / \
  /   \
 v     v
BOOKED AVAILABLE
  |       |
Payment  Cancel / timeout
success
```

Status mapping:

```text
AVAILABLE = no Redis hold and no active reservation
HELD      = Redis hold exists
RESERVED  = pending booking exists
BOOKED    = confirmed booking exists
```

## Running Locally With Docker

Create a `.env` file from `.env.example`.

```powershell
docker compose up --build
```

The API is available at:

```text
http://localhost:8081
```

The compose file maps `8081:8080` because host port `8080` was already occupied during local testing. If your machine has port `8080` free, you can change the mapping back to `8080:8080`.

Health check:

```text
GET http://localhost:8081/health
```

Swagger:

```text
http://localhost:8081/swagger
```

Do not commit real SQL Server, Redis, JWT, or admin seed secrets.

## k6 Load Tests

Load tests are implemented using Grafana k6 in `tests/load`.

Set the API URL:

```powershell
$env:BASE_URL="http://localhost:8081"
```

Seed load-test customers:

```powershell
& "C:\Program Files\k6\k6.exe" run tests/load/seed-users.js
```

Pick an available showtime and seat:

```powershell
$showtime = @(Invoke-RestMethod "$env:BASE_URL/api/showtimes")[0]

$seat = @(
  Invoke-RestMethod "$env:BASE_URL/api/showtimes/$($showtime.id)/seats" |
  Where-Object { $_.status -eq "AVAILABLE" }
)[0]

$env:SHOWTIME_ID=$showtime.id
$env:SEAT_ID=$seat.seatId
```

Run concurrent hold test:

```powershell
& "C:\Program Files\k6\k6.exe" run tests/load/concurrent-hold.js
```

Run concurrent hold plus booking test:

```powershell
& "C:\Program Files\k6\k6.exe" run tests/load/hold-and-book-same-seat.js
```

Run shared-user 50 VU hold test:

```powershell
$env:EMAIL="loadtest1@cinema.local"
$env:PASSWORD="Test123!"

& "C:\Program Files\k6\k6.exe" run tests/load/hold-same-seat.js
```

Run seat availability read test:

```powershell
& "C:\Program Files\k6\k6.exe" run tests/load/seat-availability-read.js
```

## Load Testing Results

Tests were executed against the Dockerized ASP.NET Core API and SQL Server with an external Redis instance.

### Concurrent seat hold

20 concurrent customers attempted to hold the same seat.

| Metric | Result |
|---|---:|
| Successful holds | 1 |
| Conflicts | 19 |
| Unexpected responses | 0 |

The Redis atomic hold allowed exactly one request to acquire the seat.

### Concurrent hold plus booking

20 concurrent customers attempted to reserve the same seat.

| Metric | Result |
|---|---:|
| Successful holds | 1 |
| Successful bookings | 1 |
| Hold conflicts | 19 |

Only one booking was created for the seat.

### Shared-user hold

50 virtual users used the same customer account and attempted to hold the same seat.

| Metric | Result |
|---|---:|
| Successful holds | 1 |
| Conflicts | 49 |

### Seat availability read test

| Metric | Result |
|---|---:|
| Requests | 59,969 |
| Failed requests | 0% |
| p95 response time | 125.97 ms |

This is a workload test result, not a claim of 59,969 concurrent users.

## CI

GitHub Actions runs restore, build, tests, and Docker image build on pushes and pull requests to `main`.
