import axios from 'axios';

const USER_COUNT = 10;
const MIN_DELAY = 20000; // 20초
const MAX_DELAY = 120000; // 2분
const DURATION = 10 * 60 * 1000; // 10분
const BASE_URL = 'http://localhost:3000';

async function callUser(userId: number) {
  try {
    await axios.get(`${BASE_URL}/users/${userId}`);
    console.log(`[CALL] user:${userId}`);
  } catch (e) {
    console.error(`[FAIL] user:${userId}`, e.message);
  }
}

async function run() {
  const start = Date.now();

  while (Date.now() - start < DURATION) {
    const delay =
      Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1)) + MIN_DELAY;
    const userId = Math.floor(Math.random() * USER_COUNT) + 1;
    await callUser(userId);
    await new Promise((res) => setTimeout(res, delay));
  }
}

run();
