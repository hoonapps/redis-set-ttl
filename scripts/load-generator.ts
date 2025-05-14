import axios from 'axios';

const USER_COUNT = 10;
const MIN_DELAY = 30 * 1000;
const MAX_DELAY = 10 * 60 * 1000;
const END_TIME = Date.now() + 10 * 60 * 1000; // 10분간 실행

async function callLoop(userId: number) {
  while (Date.now() < END_TIME) {
    try {
      await axios.get(`http://localhost:3000/users/${userId}`);
      console.log(`[USER:${userId}] called`);
    } catch (e) {
      console.error(`[FAIL] user:${userId}`, e.message);
    }

    const delay = Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1)) + MIN_DELAY;
    await new Promise((res) => setTimeout(res, delay));
  }
}

async function runAll() {
  const users = Array.from({ length: USER_COUNT }, (_, i) => i + 1);
  await Promise.all(users.map((id) => callLoop(id)));
}

runAll();
