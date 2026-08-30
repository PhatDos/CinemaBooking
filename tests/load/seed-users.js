import http from "k6/http";

const BASE_URL = __ENV.BASE_URL || "http://localhost:8081";
const USER_COUNT = Number(__ENV.USER_COUNT || 20);
const PASSWORD = __ENV.LOAD_TEST_PASSWORD || "Test123!";

export const options = {
    vus: 1,
    iterations: 1,
};

export default function () {
    for (let i = 1; i <= USER_COUNT; i++) {
        const email = `loadtest${i}@cinema.local`;

        const response = http.post(
            `${BASE_URL}/api/auth/register`,
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

        if (response.status === 200) {
            console.log(`${email}: created`);
        } else if (response.status === 400 || response.status === 409) {
            console.log(`${email}: already exists or rejected by validation`);
        } else {
            console.log(`${email}: unexpected ${response.status} ${response.body}`);
        }
    }
}
