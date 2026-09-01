import http from "k6/http";
import { check } from "k6";
import { Counter } from "k6/metrics";

const holdSuccess = new Counter("hold_success");
const holdConflict = new Counter("hold_conflict");
const holdUnexpected = new Counter("hold_unexpected");
const bookingSuccess = new Counter("booking_success");
const bookingFailure = new Counter("booking_failure");

const BASE_URL = __ENV.BASE_URL || "http://localhost:8081";
const SHOWTIME_ID = __ENV.SHOWTIME_ID;
const SEAT_ID = __ENV.SEAT_ID;
const PASSWORD = __ENV.LOAD_TEST_PASSWORD || "Test123!";

export const options = {
    scenarios: {
        hold_and_book: {
            executor: "per-vu-iterations",
            vus: 20,
            iterations: 1,
            maxDuration: "30s",
        },
    },
};

export default function () {
    requireEnv("SHOWTIME_ID", SHOWTIME_ID);
    requireEnv("SEAT_ID", SEAT_ID);

    const email = `loadtest${__VU}@cinema.local`;
    const loginResponse = login(email);

    if (loginResponse.status !== 200) {
        holdUnexpected.add(1);
        return;
    }

    const token = loginResponse.json("accessToken");

    const holdResponse = http.post(
        `${BASE_URL}/api/showtimes/${SHOWTIME_ID}/holds`,
        JSON.stringify({
            seatIds: [SEAT_ID],
        }),
        {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (holdResponse.status === 409) {
        holdConflict.add(1);
        return;
    }

    if (holdResponse.status !== 200) {
        holdUnexpected.add(1);
        return;
    }

    holdSuccess.add(1);

    const bookingResponse = http.post(
        `${BASE_URL}/api/bookings`,
        JSON.stringify({
            holdId: holdResponse.json("holdId"),
        }),
        {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (bookingResponse.status === 200 || bookingResponse.status === 201) {
        bookingSuccess.add(1);
    } else {
        bookingFailure.add(1);
    }

    check(bookingResponse, {
        "booking created by hold winner": (r) => r.status === 200 || r.status === 201,
    });
}

function login(email) {
    return http.post(
        `${BASE_URL}/api/auth/login`,
        JSON.stringify({
            email,
            password: PASSWORD,
        }),
        {
            headers: {
                "Content-Type": "application/json",
            },
        }
    );
}

function requireEnv(name, value) {
    if (!value) {
        throw new Error(`${name} is required.`);
    }
}
