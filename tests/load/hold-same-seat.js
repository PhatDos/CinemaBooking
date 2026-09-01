import http from "k6/http";
import { check } from "k6";
import { Counter } from "k6/metrics";

const holdSuccess = new Counter("hold_success");
const holdConflict = new Counter("hold_conflict");
const holdUnexpected = new Counter("hold_unexpected");

const BASE_URL = __ENV.BASE_URL || "http://localhost:8081";
const SHOWTIME_ID = __ENV.SHOWTIME_ID;
const SEAT_ID = __ENV.SEAT_ID;
const EMAIL = __ENV.EMAIL;
const PASSWORD = __ENV.PASSWORD;

export const options = {
    scenarios: {
        hold_same_seat: {
            executor: "per-vu-iterations",
            vus: 50,
            iterations: 1,
            maxDuration: "30s",
        },
    },
};

export function setup() {
    requireEnv("SHOWTIME_ID", SHOWTIME_ID);
    requireEnv("SEAT_ID", SEAT_ID);
    requireEnv("EMAIL", EMAIL);
    requireEnv("PASSWORD", PASSWORD);

    const response = http.post(
        `${BASE_URL}/api/auth/login`,
        JSON.stringify({
            email: EMAIL,
            password: PASSWORD,
        }),
        {
            headers: {
                "Content-Type": "application/json",
            },
        }
    );

    if (response.status !== 200) {
        throw new Error(`Login failed: ${response.status} ${response.body}`);
    }

    return {
        token: response.json("accessToken"),
    };
}

export default function (data) {
    const response = http.post(
        `${BASE_URL}/api/showtimes/${SHOWTIME_ID}/holds`,
        JSON.stringify({
            seatIds: [SEAT_ID],
        }),
        {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${data.token}`,
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

function requireEnv(name, value) {
    if (!value) {
        throw new Error(`${name} is required.`);
    }
}
