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
