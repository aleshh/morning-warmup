const exercises = [
  "Hop",
  "Body wave",
  "Arm swing",
  "Trunk twist",
  "High twist",
  "Golf swing",
  "Push side",
  "Plié",
  "Hop rotate",
  "Good morning",
  "Kick step",
  "Chest opener",
  "Punch",
  "March",
  "Curtsy",
];

const totalDurationMs = exercises.length * 60 * 1000;
const minuteMs = 60 * 1000;

const timer = document.getElementById("timer");
const minuteLabel = document.getElementById("minuteLabel");
const exerciseName = document.getElementById("exerciseName");
const nextExercise = document.getElementById("nextExercise");
const nextExerciseName = document.getElementById("nextExerciseName");
const startPauseButton = document.getElementById("startPauseButton");
const backButton = document.getElementById("backButton");
const forwardButton = document.getElementById("forwardButton");
const resetButton = document.getElementById("resetButton");
const sequenceList = document.getElementById("sequenceList");

let startTime = 0;
let elapsedBeforePause = 0;
let animationFrameId = 0;
let isRunning = false;
let hasCompleted = false;

function renderSequence() {
  sequenceList.innerHTML = exercises
    .map(
      (exercise, index) => `
        <li data-minute-index="${index}">
          <span class="sequence-role">${String(index + 1).padStart(2, "0")}</span>
          <strong>${exercise}</strong>
        </li>
      `
    )
    .join("");
}

function formatTime(elapsedMs) {
  const safeMs = Math.max(0, Math.floor(elapsedMs));
  const minutes = Math.floor(safeMs / 60000);
  const seconds = Math.floor((safeMs % 60000) / 1000);
  const centiseconds = Math.floor((safeMs % 1000) / 10);

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(
    centiseconds
  ).padStart(2, "0")}`;
}

function updateSequenceHighlight(currentMinuteIndex, nextMinuteIndex = null) {
  const items = sequenceList.querySelectorAll("li");
  items.forEach((item) => {
    const minuteIndex = Number(item.dataset.minuteIndex);
    const roleLabel = item.querySelector(".sequence-role");
    const isCurrent = minuteIndex === currentMinuteIndex;
    const isNext = minuteIndex === nextMinuteIndex;

    item.classList.toggle("is-current", isCurrent);
    item.classList.toggle("is-next", isNext);
    roleLabel.textContent = isCurrent
      ? "Current"
      : isNext
        ? "Next"
        : String(minuteIndex + 1).padStart(2, "0");
  });
}

function render(overrideElapsedMs = null) {
  const elapsedMs = overrideElapsedMs ?? (isRunning ? performance.now() - startTime : elapsedBeforePause);
  const clampedElapsed = Math.min(elapsedMs, totalDurationMs);
  const minuteIndex = Math.min(
    exercises.length - 1,
    Math.floor(clampedElapsed / minuteMs)
  );
  const elapsedInMinute = clampedElapsed % minuteMs;
  const remainingInMinute = minuteMs - elapsedInMinute;
  const isComplete = clampedElapsed >= totalDurationMs;

  timer.textContent = formatTime(clampedElapsed);
  minuteLabel.textContent = isComplete
    ? "Complete"
    : `Minute ${minuteIndex + 1} of ${exercises.length}`;
  exerciseName.textContent = isComplete ? "Warmup complete" : exercises[minuteIndex];
  exerciseName.classList.toggle("is-complete", isComplete);

  const hasNextExercise = minuteIndex < exercises.length - 1;
  const showNextCue = !isComplete && hasNextExercise && remainingInMinute <= 10000;
  const nextMinuteIndex = !isComplete && hasNextExercise ? minuteIndex + 1 : null;

  updateSequenceHighlight(isComplete ? exercises.length - 1 : minuteIndex, nextMinuteIndex);

  nextExercise.classList.toggle("is-visible", showNextCue);
  nextExercise.classList.toggle("is-pulsing", showNextCue);
  nextExercise.setAttribute("aria-hidden", showNextCue ? "false" : "true");
  if (showNextCue) {
    const secondsLeft = Math.max(1, Math.ceil(remainingInMinute / 1000));
    nextExerciseName.textContent = exercises[minuteIndex + 1];
    nextExercise.querySelector(".next-label").textContent = `Next in ${secondsLeft}`;
  }

  if (isComplete) {
    nextExercise.classList.remove("is-visible", "is-pulsing");
    nextExercise.setAttribute("aria-hidden", "true");
    startPauseButton.textContent = "Restart";
    isRunning = false;
    elapsedBeforePause = totalDurationMs;
    hasCompleted = true;
    cancelAnimationFrame(animationFrameId);
    animationFrameId = 0;
    return;
  }

  hasCompleted = false;
  startPauseButton.textContent = isRunning ? "Pause" : "Start";
}

function tick() {
  render();

  if (isRunning) {
    animationFrameId = requestAnimationFrame(tick);
  }
}

function startTimer() {
  if (isRunning) {
    return;
  }

  if (hasCompleted) {
    elapsedBeforePause = 0;
    hasCompleted = false;
  }

  isRunning = true;
  startTime = performance.now() - elapsedBeforePause;
  startPauseButton.textContent = "Pause";
  animationFrameId = requestAnimationFrame(tick);
}

function getElapsedMs() {
  return isRunning ? performance.now() - startTime : elapsedBeforePause;
}

function seekToElapsed(targetElapsedMs) {
  const clampedElapsed = Math.max(0, Math.min(targetElapsedMs, totalDurationMs));

  elapsedBeforePause = clampedElapsed;
  hasCompleted = clampedElapsed >= totalDurationMs;

  if (isRunning) {
    startTime = performance.now() - clampedElapsed;
  }

  render(clampedElapsed);
}

function jumpToPreviousMinute() {
  const elapsedMs = getElapsedMs();
  const isOnExactMinute = elapsedMs > 0 && elapsedMs % minuteMs === 0;
  const targetElapsedMs = isOnExactMinute
    ? elapsedMs - minuteMs
    : Math.floor(elapsedMs / minuteMs) * minuteMs;

  seekToElapsed(targetElapsedMs);
}

function jumpToNextMinute() {
  const elapsedMs = getElapsedMs();
  const isOnExactMinute = elapsedMs % minuteMs === 0;
  const targetElapsedMs = isOnExactMinute
    ? elapsedMs + minuteMs
    : Math.ceil(elapsedMs / minuteMs) * minuteMs;

  seekToElapsed(targetElapsedMs);
}

function pauseTimer() {
  if (!isRunning) {
    return;
  }

  isRunning = false;
  elapsedBeforePause = performance.now() - startTime;
  cancelAnimationFrame(animationFrameId);
  animationFrameId = 0;
  render(elapsedBeforePause);
}

function resetTimer() {
  isRunning = false;
  elapsedBeforePause = 0;
  hasCompleted = false;
  cancelAnimationFrame(animationFrameId);
  animationFrameId = 0;
  render(0);
}

startPauseButton.addEventListener("click", () => {
  if (hasCompleted) {
    startTimer();
    return;
  }

  if (isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
});

resetButton.addEventListener("click", resetTimer);
backButton.addEventListener("click", jumpToPreviousMinute);
forwardButton.addEventListener("click", jumpToNextMinute);

renderSequence();
render(0);
