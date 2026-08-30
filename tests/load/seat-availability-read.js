import http from "k6/http";
import { check } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:8081";
const SHOWTIME_ID = __ENV.SHOWTIME_ID;

export const options = {
    stages: [
        { duration: "20s", target: 50 },
        { duration: "30s", target: 200 },
        { duration: "20s", target: 0 },
    ],
    thresholds: {
        http_req_failed: ["rate<0.01"],
        http_req_duration: ["p(95)<500"],
    },
};

export default function () {
    requireEnv("SHOWTIME_ID", SHOWTIME_ID);

    const response = http.get(
        `${BASE_URL}/api/showtimes/${SHOWTIME_ID}/seats`
    );

    check(response, {
        "seat availability loaded": (r) => r.status === 200,
    });
}

function requireEnv(name, value) {
    if (!value) {
        throw new Error(`${name} is required.`);
    }
}
