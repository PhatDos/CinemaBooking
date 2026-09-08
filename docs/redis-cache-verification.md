# Redis Cache Verification

This document records how CinemaBooking verifies Redis cache behavior and how to benchmark the cache-backed read endpoints.

## Cached Endpoints

| Area | Endpoint | Key shape | TTL |
| --- | --- | --- | --- |
| Movies public/staff | `GET /api/movies` | `cinema-booking:{env}:v1:catalog:movies:list:public` | 10 minutes |
| Movies admin | `GET /api/movies` | `cinema-booking:{env}:v1:catalog:movies:list:admin` | 1 minute |
| Now showing | `GET /api/movies/now-showing` | `cinema-booking:{env}:v1:catalog:movies:now-showing` | 30 minutes |
| Genres | `GET /api/genres` | `cinema-booking:{env}:v1:catalog:genres:list:public` | 2 hours |
| Cinema list | `GET /api/cinemas` | `cinema-booking:{env}:v1:theater:cinemas:list:province:{provinceCode|all}:ward:{wardCode|all}` | 20 minutes |
| Cinema detail | `GET /api/cinemas/{id}` | `cinema-booking:{env}:v1:theater:cinemas:detail:{cinemaId}` | 20 minutes |
| Room seat layout | `GET /api/rooms/{roomId}/seats` | `cinema-booking:{env}:v1:theater:rooms:{roomId}:seat-layout` | 2 hours |

`GET /api/showtimes/{showtimeId}/seats` is intentionally not cached because it includes real-time seat availability and hold state.

## Runtime Signals

Cache-backed endpoints return:

```text
X-Cache: HIT
X-Cache: MISS
X-Cache: BYPASS
```

`BYPASS` means Redis could not be read or written, but the endpoint still queried the database and returned normally.

## Invalidation Coverage

| Source mutation | Invalidated tags |
| --- | --- |
| Movie create/update/bulk create/import approve | `catalog:movies` |
| Showtime create/bulk create | `scheduling:showtimes` |
| Genre create/update/delete | `catalog:genres`, `catalog:movies` |
| Cinema create/update | `theater:cinemas`, `theater:cinema:{cinemaId}` |
| Seat create/bulk create | `theater:room:{roomId}:seats` |

Tag index keys use the app/environment prefix:

```text
cinema-booking:{env}:cache-tag:{tag}
```

When a tag is invalidated, the cache deletes all member keys and then deletes the tag set itself. Tag sets also have a 48-hour TTL to avoid stale indexes if a tag is rarely invalidated.

## Automated Verification

Run the full backend suite with Docker running:

```powershell
dotnet test CinemaBooking.slnx --configuration Release
```

The Redis cache integration tests use Testcontainers and start a real `redis:7-alpine` container. The database layer is overridden to EF InMemory so the tests focus on cache behavior without requiring SQL Server.

Current verified result:

| Date | Command | Result |
| --- | --- | --- |
| 2026-09-08 | `dotnet test CinemaBooking.slnx --configuration Release` | Passed: Unit 39, Integration 6 |

Covered integration scenarios:

- `GET /api/movies` returns `MISS`, then `HIT`.
- Updating a movie invalidates `catalog:movies`; the next public movie list is `MISS` and returns updated data.
- `GET /api/genres` returns `MISS`, then `HIT`; creating a genre invalidates the list.
- Cinema list keys normalize province/ward query values before caching.
- Updating a cinema invalidates both list and detail cache.
- Room seat layout returns `MISS`, then `HIT`; creating a seat invalidates the room layout cache.
- Creating a showtime invalidates now-showing.
- Redis unavailable returns `200` with `X-Cache: BYPASS`.

## k6 Benchmark

Start the backend and Redis first:

```powershell
$env:BASE_URL="http://localhost:8081"
```

Warm cache:

```powershell
Invoke-RestMethod "$env:BASE_URL/api/movies"
Invoke-RestMethod "$env:BASE_URL/api/movies/now-showing"
Invoke-RestMethod "$env:BASE_URL/api/cinemas"
```

Run cache benchmarks:

```powershell
k6 run tests/load/cache-movies.js
k6 run tests/load/cache-now-showing.js
k6 run tests/load/cache-cinemas.js
```

Record the benchmark output here after running against local Docker data:

| Script | Scenario | Requests/sec | p50 | p95 | p99 | Failed | cache_hit | cache_miss | cache_bypass |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `cache-movies.js` | Hot cache | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| `cache-now-showing.js` | Hot cache | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| `cache-cinemas.js` | Hot cache | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |

For a cold-cache comparison, restart Redis or flush only the CinemaBooking cache keys before warming again.
