import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import vm from "node:vm";

const fromVm = (value) => structuredClone(value);

async function loadHistoryApi() {
  const source = await readFile(new URL("../lib/client.js", import.meta.url), "utf8");
  let payload;
  const context = {
    console,
    __ModuleLoader__: {
      load(value) {
        payload = value;
      },
    },
  };
  context.__DEEP_SNEAK_TEST__ = true;
  context.globalThis = context;
  context.window = context;
  vm.runInNewContext(source, context, { filename: "lib/client.js" });
  assert.ok(payload, "client bundle did not register with ModuleLoader");
  const exported = payload.factory((name) => {
    if (name === "react") return {};
    throw new Error(`unexpected require: ${name}`);
  });
  assert.ok(exported.__deepSneakHistory, "history test API is not exposed");
  return exported.__deepSneakHistory;
}

const bvidFor = (index) => `BV1A${String(index).padStart(8, "0")}`;

const makeEntry = (index, progress = 0, watchedAt = index) => ({
  bvid: bvidFor(index),
  title: `video-${index}`,
  pic: `https://example.test/${index}.jpg`,
  up: `up-${index}`,
  duration: "1:00",
  watchedAt,
  progress,
});

test("sanitizeHistory filters, normalizes, sorts, and caps entries", async () => {
  const { sanitizeHistory } = await loadHistoryApi();
  const base = Array.from({ length: 51 }, (_, index) => makeEntry(index, index, 100 + ((index * 37) % 900)));
  const negative = makeEntry(59, -4, 5000);
  const newest = makeEntry(60, 12.9, 6000);
  const malformed = { bvid: "not-a-bvid", title: "bad", watchedAt: 7000 };
  const input = [
    ...base.slice().reverse(),
    malformed,
    newest,
    negative,
  ];
  const inputSnapshot = structuredClone(input);
  const expected = inputSnapshot
    .filter(({ bvid }) => bvid !== malformed.bvid)
    .sort((a, b) => b.watchedAt - a.watchedAt)
    .slice(0, 50);
  const result = fromVm(sanitizeHistory(input));

  assert.deepEqual(input, inputSnapshot);
  assert.equal(result.length, 50);
  assert.deepEqual(result.map(({ bvid }) => bvid), expected.map(({ bvid }) => bvid));
  assert.equal(result.find(({ bvid }) => bvid === bvidFor(60)).progress, 12);
  assert.equal(result.find(({ bvid }) => bvid === bvidFor(59)).progress, 0);
  assert.ok(result.every(({ bvid }) => bvid !== malformed.bvid));

  const [normalized] = fromVm(sanitizeHistory([{
    bvid: bvidFor(61),
    title: 123,
    pic: null,
    up: {},
    duration: 60,
    watchedAt: "not-a-number",
    progress: "not-a-number",
  }]));
  assert.equal(normalized.title, "");
  assert.equal(normalized.pic, "");
  assert.equal(normalized.up, "");
  assert.equal(normalized.duration, "60");
  assert.equal(normalized.watchedAt, 0);
  assert.equal(normalized.progress, 0);
});

test("upsertHistory de-duplicates, preserves progress, updates metadata, and moves to the front", async () => {
  const { upsertHistory } = await loadHistoryApi();
  const existing = makeEntry(2, 27);
  const other = makeEntry(1, 5);
  const history = [other, existing];
  const historySnapshot = structuredClone(history);
  const result = fromVm(upsertHistory(
    history,
    {
      ...makeEntry(2),
      title: "updated title",
      pic: "https://example.test/updated.jpg",
      up: "updated up",
      duration: "2:00",
    },
    100,
  ));

  assert.equal(result.length, 2);
  assert.deepEqual(result.map(({ bvid }) => bvid), [bvidFor(2), bvidFor(1)]);
  assert.equal(result[0].bvid, bvidFor(2));
  assert.equal(result[0].progress, 27);
  assert.equal(result[0].title, "updated title");
  assert.equal(result[0].pic, "https://example.test/updated.jpg");
  assert.equal(result[0].up, "updated up");
  assert.equal(result[0].duration, "2:00");
  assert.equal(result[0].watchedAt, 100);
  assert.equal(result.filter(({ bvid }) => bvid === bvidFor(2)).length, 1);
  assert.deepEqual(result[1], historySnapshot[0]);
  assert.deepEqual(history, historySnapshot);

  const createdHistory = [other, existing];
  const createdHistorySnapshot = structuredClone(createdHistory);
  const created = fromVm(upsertHistory(
    createdHistory,
    {
      ...makeEntry(3),
      title: "new title",
      pic: "https://example.test/new.jpg",
      up: "new up",
      duration: "3:00",
    },
    300,
  ));
  assert.equal(created.length, 3);
  assert.deepEqual(created.map(({ bvid }) => bvid), [bvidFor(3), bvidFor(2), bvidFor(1)]);
  assert.equal(created[0].bvid, bvidFor(3));
  assert.equal(created[0].title, "new title");
  assert.equal(created[0].pic, "https://example.test/new.jpg");
  assert.equal(created[0].up, "new up");
  assert.equal(created[0].duration, "3:00");
  assert.equal(created[0].watchedAt, 300);
  assert.equal(created[0].progress, 0);
  assert.deepEqual(createdHistory, createdHistorySnapshot);

  const cappedHistory = Array.from({ length: 50 }, (_, index) => makeEntry(index));
  const cappedHistorySnapshot = structuredClone(cappedHistory);
  const capped = fromVm(upsertHistory(
    cappedHistory,
    makeEntry(50),
    400,
  ));
  assert.equal(capped.length, 50);
  assert.deepEqual(
    capped.map(({ bvid }) => bvid),
    [bvidFor(50), ...Array.from({ length: 49 }, (_, index) => bvidFor(49 - index))],
  );
  assert.deepEqual(cappedHistory, cappedHistorySnapshot);
});

test("updateHistoryProgress floors progress and moves the updated entry to the front", async () => {
  const { updateHistoryProgress } = await loadHistoryApi();
  const other = makeEntry(1, 3);
  const target = makeEntry(2, 5);
  const history = [other, target];
  const targetSnapshot = structuredClone(target);
  const historySnapshot = structuredClone(history);
  const result = fromVm(updateHistoryProgress(
    history,
    bvidFor(2),
    12.9,
    150,
  ));

  assert.equal(result.length, 2);
  assert.deepEqual(result.map(({ bvid }) => bvid), [bvidFor(2), bvidFor(1)]);
  assert.equal(result[0].bvid, bvidFor(2));
  assert.equal(result[0].progress, 12);
  assert.equal(result[0].watchedAt, 150);
  assert.deepEqual(result[0], { ...targetSnapshot, progress: 12, watchedAt: 150 });
  assert.deepEqual(result[1], historySnapshot[0]);
  assert.deepEqual(history, historySnapshot);

  const missingHistory = [makeEntry(4, 6), makeEntry(5, 8)];
  const missingSnapshot = structuredClone(missingHistory);
  const missingResult = fromVm(updateHistoryProgress(missingHistory, bvidFor(99), 42.9, 151));
  assert.deepEqual(missingHistory, missingSnapshot);
  assert.deepEqual(missingResult, [missingSnapshot[1], missingSnapshot[0]]);
});

test("resumeSeconds only resumes progress safely before the end of the video", async () => {
  const { resumeSeconds } = await loadHistoryApi();

  assert.equal(resumeSeconds({ progress: 0 }, 60), 0);
  assert.equal(resumeSeconds({ progress: 17 }, 60), 17);
  assert.equal(resumeSeconds({ progress: 58 }, 60), 58);
  assert.equal(resumeSeconds({ progress: 59 }, 60), 0);
  assert.equal(resumeSeconds({ progress: 60 }, 60), 0);
  assert.equal(resumeSeconds({ progress: 99 }, 60), 0);
  assert.equal(resumeSeconds({ progress: 17 }, undefined), 0);
});

test("completeHistory resets progress, moves the entry to the front, and updates its timestamp", async () => {
  const { completeHistory } = await loadHistoryApi();
  const other = makeEntry(1, 4);
  const target = makeEntry(2, 18);
  const history = [other, target];
  const targetSnapshot = structuredClone(target);
  const historySnapshot = structuredClone(history);
  const result = fromVm(completeHistory(
    history,
    bvidFor(2),
    200,
  ));

  assert.equal(result.length, 2);
  assert.deepEqual(result.map(({ bvid }) => bvid), [bvidFor(2), bvidFor(1)]);
  assert.equal(result[0].bvid, bvidFor(2));
  assert.equal(result[0].progress, 0);
  assert.equal(result[0].watchedAt, 200);
  assert.deepEqual(result[0], { ...targetSnapshot, progress: 0, watchedAt: 200 });
  assert.deepEqual(result[1], historySnapshot[0]);
  assert.deepEqual(history, historySnapshot);
});

test("shouldSaveHistoryProgress blocks ended playback and completed videos from later flushes", async () => {
  const { shouldSaveHistoryProgress, completeHistory, updateHistoryProgress } = await loadHistoryApi();
  const video = { bvid: bvidFor(1) };
  const playing = { ended: false, currentTime: 12.4 };

  assert.equal(shouldSaveHistoryProgress(video, playing, null), true);
  assert.equal(shouldSaveHistoryProgress(video, playing, undefined), true);
  assert.equal(shouldSaveHistoryProgress(video, { ended: true, currentTime: 59.9 }, null), false);
  assert.equal(shouldSaveHistoryProgress(video, playing, video.bvid), false);
  assert.equal(shouldSaveHistoryProgress(video, { ended: false, currentTime: 0 }, null), false);
  assert.equal(shouldSaveHistoryProgress(null, playing, null), false);
  assert.equal(shouldSaveHistoryProgress(video, null, null), false);
  assert.equal(shouldSaveHistoryProgress({ bvid: "" }, playing, null), false);

  const completed = completeHistory([makeEntry(1, 18)], bvidFor(1), 200);
  const media = { ended: true, currentTime: 59.9 };
  let next = completed;
  if (shouldSaveHistoryProgress(video, media, video.bvid)) {
    next = updateHistoryProgress(completed, video.bvid, media.currentTime, 201);
  }
  assert.equal(next[0].progress, 0);
  assert.equal(next[0].watchedAt, 200);
});
