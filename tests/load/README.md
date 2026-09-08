# CinemaBooking k6 Load Tests

These scripts target the Docker compose API by default:

```powershell
$env:BASE_URL="http://localhost:8081"
```

Set a currently available showtime and seat before running hold or booking tests:

```powershell
$env:SHOWTIME_ID="YOUR_SHOWTIME_ID"
$env:SEAT_ID="YOUR_AVAILABLE_SEAT_ID"
```

Seed load-test customers:

```powershell
k6 run tests/load/seed-users.js
```

Verify Redis atomic hold with one shared user:

```powershell
$env:EMAIL="customer@example.com"
$env:PASSWORD="yourpassword"
k6 run tests/load/hold-same-seat.js
```

Expected counters:

```text
hold_success....: 1
hold_conflict...: 49
hold_unexpected.: 0
```

Verify realistic multi-user hold competition:

```powershell
k6 run tests/load/concurrent-hold.js
```

Expected counters:

```text
hold_success....: 1
hold_conflict...: 19
hold_unexpected.: 0
```

Verify full hold plus booking race:

```powershell
k6 run tests/load/hold-and-book-same-seat.js
```

Expected counters:

```text
hold_success....: 1
booking_success.: 1
hold_conflict...: 19
```

Run read performance test:

```powershell
k6 run tests/load/seat-availability-read.js
```

## Redis cache benchmarks

Detailed cache keys, invalidation rules, integration test coverage, and benchmark result template are documented in:

```text
docs/redis-cache-verification.md
```

Start the API and Redis first, then set:

```powershell
$env:BASE_URL="http://localhost:8081"
```

Warm the cache before measuring hot-cache performance:

```powershell
Invoke-RestMethod "$env:BASE_URL/api/movies"
Invoke-RestMethod "$env:BASE_URL/api/movies/now-showing"
Invoke-RestMethod "$env:BASE_URL/api/cinemas"
```

Run cache-focused read benchmarks:

```powershell
k6 run tests/load/cache-movies.js
k6 run tests/load/cache-now-showing.js
k6 run tests/load/cache-cinemas.js
```

Optional cinema filters:

```powershell
$env:PROVINCE_CODE="DN"
$env:WARD_CODE="HC"
k6 run tests/load/cache-cinemas.js
```

Record these numbers for the before/after cache comparison:

```text
requests/sec
p50
p95
p99
failed requests
cache_hit
cache_miss
cache_bypass
```
