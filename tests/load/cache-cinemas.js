import http from "k6/http";
import { check, sleep } from "k6";
import { Counter } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:8081";
const PROVINCE_CODE = __ENV.PROVINCE_CODE;
const WARD_CODE = __ENV.WARD_CODE;

const cacheHit = new Counter("cache_hit");
const cacheMiss = new Counter("cache_miss");
const cacheBypass = new Counter("cache_bypass");

export const options = {
    vus: 50,
    duration: "30s",
    thresholds: {
        http_req_failed: ["rate<0.01"],
        http_req_duration: ["p(95)<500"],
    },
};

export default function () {
    const query = buildQuery();
    const response = http.get(`${BASE_URL}/api/cinemas${query}`);

    trackCache(response);

    check(response, {
        "cinemas status is 200": (r) => r.status === 200,
    });

    sleep(1);
}

function buildQuery() {
    const params = [];

    if (PROVINCE_CODE) {
        params.push(`provinceCode=${encodeURIComponent(PROVINCE_CODE)}`);
    }

    if (WARD_CODE) {
        params.push(`wardCode=${encodeURIComponent(WARD_CODE)}`);
    }

    return params.length > 0 ? `?${params.join("&")}` : "";
}

function trackCache(response) {
    const value = response.headers["X-Cache"];

    if (value === "HIT") {
        cacheHit.add(1);
    } else if (value === "MISS") {
        cacheMiss.add(1);
    } else if (value === "BYPASS") {
        cacheBypass.add(1);
    }
}
