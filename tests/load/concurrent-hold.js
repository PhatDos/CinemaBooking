import http from "k6/http";
import { check } from "k6";
import { Counter } from "k6/metrics";

const holdSuccess = new Counter("hold_success");
const holdConflict = new Counter("hold_conflict");
const holdUnexpected = new Counter("hold_unexpected");

const BASE_URL = __ENV.BASE_URL || "http://localhost:8081";
const SHOWTIME_ID = __ENV.SHOWTIME_ID;
const SEAT_ID = __ENV.SEAT_ID;
const PASSWORD = __ENV.LOAD_TEST_PASSWORD || "Test123!";

export const options = {
    scenarios: {
        concurrent_hold: {
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

    const response = http.post(
        `${BASE_URL}/api/showtimes/${SHOWTIME_ID}/seats/${SEAT_ID}/hold`,
        null,
        {
            headers: {
                Authorization: `Bearer ${loginResponse.json("accessToken")}`,
            },
        }
    );

    if (response.status === 200) {
        holdSuccess.add(1);
    } else if (response.status === 409) {
        holdConflict.add(1);
    } else {
        holdUnexpected.add(1);
    }

    check(response, {
        "expected status": (r) => r.status === 200 || r.status === 409,
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
