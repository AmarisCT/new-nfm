/* =========================================================
   GARRETT'S NORWEGIAN FOOT MARCH
   COMPLETE SCRIPT
========================================================= */


/* =========================================================
   CONSTANTS
========================================================= */

const DISPLAY_DISTANCE_MILES = 19;
const CALCULATION_DISTANCE_MILES = 18.64;
const STANDARD_SECONDS = (4 * 60 * 60) + (30 * 60);

const MILESTONE_SHOW_MS = 1700;
const MILESTONE_GAP_MS = 300;

const FINAL_MILE_DURATION = 7000;


/* =========================================================
   STATE
========================================================= */

let userData = {
    finishSeconds: null,
    weight: null,
    heightInches: null,
    steps: null
};

let marchToken = 0;
let marchAnimationFrame = null;

let finalAnimationFrame = null;
let finalMileFinished = false;
let crossedFinish = false;

let finishParticles = [];
let finishConfettiFrame = null;

let celebrationFrame = null;


/* =========================================================
   SCENE ORDER
========================================================= */

const sceneOrder = [
    "intro",
    "timePage",
    "marchPage",
    "resultPage",
    "statsPage",
    "perspectivePage",
    "finalPage",
    "celebrationPage"
];


/* =========================================================
   HELPERS
========================================================= */

function getElement(id) {
    return document.getElementById(id);
}


function sleep(ms) {
    return new Promise(function(resolve) {
        setTimeout(resolve, ms);
    });
}


function getCurrentScene() {
    return document.querySelector(".scene.active");
}


/* =========================================================
   SCENE DOTS
========================================================= */

function updateSceneDots(sceneId) {

    const index = sceneOrder.indexOf(sceneId);

    const dots = document.querySelectorAll("#sceneDots .dot");

    dots.forEach(function(dot, dotIndex) {

        dot.classList.toggle(
            "active",
            dotIndex === index
        );

    });

}


/* =========================================================
   SWITCH SCENES
========================================================= */

function switchScene(sceneId) {

    const nextScene = getElement(sceneId);

    if (!nextScene) {
        return;
    }

    const currentScene = getCurrentScene();

    if (
        currentScene &&
        currentScene.id === sceneId
    ) {
        return;
    }


    if (
        currentScene &&
        currentScene.id === "marchPage"
    ) {
        cancelMarch();
    }


    if (
        currentScene &&
        currentScene.id === "finalPage"
    ) {

        if (finalAnimationFrame) {
            cancelAnimationFrame(finalAnimationFrame);
            finalAnimationFrame = null;
        }

    }


    const overlay = getElement("fadeOverlay");

    if (overlay) {
        overlay.classList.add("black");
    }


    setTimeout(function() {

        document
            .querySelectorAll(".scene")
            .forEach(function(scene) {

                scene.classList.remove("active");

            });


        nextScene.classList.add("active");

        updateSceneDots(sceneId);

        window.scrollTo(0, 0);


        if (overlay) {

            setTimeout(function() {

                overlay.classList.remove("black");

            }, 120);

        }


        if (sceneId === "marchPage") {

            resetMarch();

            setTimeout(function() {

                startMarch();

            }, 450);

        }


        if (sceneId === "finalPage") {

            resetFinalPage();

            setTimeout(function() {

                startFinalMile();

            }, 450);

        }


        if (sceneId === "celebrationPage") {

            startCelebrationConfetti();

        }

    }, 280);

}


/* =========================================================
   FORMAT TIME
========================================================= */

function formatTime(totalSeconds) {

    const safeSeconds = Math.max(
        0,
        Math.round(totalSeconds)
    );

    const hours = Math.floor(
        safeSeconds / 3600
    );

    const minutes = Math.floor(
        (safeSeconds % 3600) / 60
    );

    const seconds = safeSeconds % 60;


    return (
        String(hours).padStart(2, "0") +
        ":" +
        String(minutes).padStart(2, "0") +
        ":" +
        String(seconds).padStart(2, "0")
    );

}


/* =========================================================
   FORMAT TIME DIFFERENCE
========================================================= */

function formatDifference(totalSeconds) {

    const safeSeconds = Math.abs(
        Math.round(totalSeconds)
    );

    const hours = Math.floor(
        safeSeconds / 3600
    );

    const minutes = Math.floor(
        (safeSeconds % 3600) / 60
    );

    const seconds = safeSeconds % 60;


    return (
        String(hours).padStart(2, "0") +
        ":" +
        String(minutes).padStart(2, "0") +
        ":" +
        String(seconds).padStart(2, "0")
    );

}


/* =========================================================
   FORMAT PACE
========================================================= */

function formatPace(secondsPerMile) {

    const rounded = Math.round(secondsPerMile);

    const minutes = Math.floor(
        rounded / 60
    );

    const seconds = rounded % 60;


    return (
        minutes +
        ":" +
        String(seconds).padStart(2, "0")
    );

}


/* =========================================================
   FORMAT RUCK WEIGHT
========================================================= */

function formatWeight(weight) {

    if (Number.isInteger(weight)) {
        return String(weight);
    }

    return weight.toFixed(1);

}


/* =========================================================
   HEIGHT PARSER

   ACCEPTS:
   6'2"
   6'2
   6 2
   6-2
========================================================= */

function parseHeight(value) {

    const cleaned = String(value)
        .trim()
        .replace(/[′’]/g, "'")
        .replace(/[″”]/g, '"');


    let match = cleaned.match(
        /^(\d)\s*['"\-\s]\s*(\d{1,2})/
    );


    if (!match) {

        match = cleaned.match(
            /^(\d)\s*'\s*(\d{1,2})\s*"?$/
        );

    }


    if (!match) {
        return null;
    }


    const feet = Number(match[1]);
    const inches = Number(match[2]);


    if (
        feet < 3 ||
        feet > 8 ||
        inches < 0 ||
        inches > 11
    ) {
        return null;
    }


    return (feet * 12) + inches;

}


/* =========================================================
   SUBMIT RESULTS
========================================================= */

function submitResults() {

    const hoursInput = getElement("hours");
    const minutesInput = getElement("minutes");
    const secondsInput = getElement("seconds");
    const weightInput = getElement("weight");
    const heightInput = getElement("height");
    const errorMessage = getElement("timeError");


    const hoursValue = hoursInput.value.trim();
    const minutesValue = minutesInput.value.trim();
    const secondsValue = secondsInput.value.trim();
    const weightValue = weightInput.value.trim();
    const heightValue = heightInput.value.trim();


    if (
        hoursValue === "" ||
        minutesValue === "" ||
        secondsValue === "" ||
        weightValue === "" ||
        heightValue === ""
    ) {

        errorMessage.textContent =
            "Enter your finish time, ruck weight, and height.";

        return;

    }


    const hours = Number(hoursValue);
    const minutes = Number(minutesValue);
    const seconds = Number(secondsValue);
    const weight = Number(weightValue);

    const heightInches = parseHeight(heightValue);


    if (
        !Number.isFinite(hours) ||
        !Number.isFinite(minutes) ||
        !Number.isFinite(seconds) ||
        hours < 0 ||
        minutes < 0 ||
        minutes > 59 ||
        seconds < 0 ||
        seconds > 59
    ) {

        errorMessage.textContent =
            "Enter a valid finish time.";

        return;

    }


    if (
        !Number.isFinite(weight) ||
        weight <= 0
    ) {

        errorMessage.textContent =
            "Enter a valid ruck weight.";

        return;

    }


    if (!heightInches) {

        errorMessage.textContent =
            'Enter height like 6\'2".';

        return;

    }


    const finishSeconds =
        (hours * 3600) +
        (minutes * 60) +
        seconds;


    if (finishSeconds <= 0) {

        errorMessage.textContent =
            "Enter a valid finish time.";

        return;

    }


    userData.finishSeconds = finishSeconds;
    userData.weight = weight;
    userData.heightInches = heightInches;


    errorMessage.textContent = "";


    calculateResults();

    switchScene("marchPage");

}


/* =========================================================
   CALCULATE RESULTS
========================================================= */

function calculateResults() {

    const finishSeconds = userData.finishSeconds;
    const weight = userData.weight;
    const heightInches = userData.heightInches;


    const finishTime = formatTime(
        finishSeconds
    );


    const totalHours =
        finishSeconds / 3600;


    const averageSpeed =
        CALCULATION_DISTANCE_MILES /
        totalHours;


    const paceSeconds =
        finishSeconds /
        CALCULATION_DISTANCE_MILES;


    const difference =
        STANDARD_SECONDS -
        finishSeconds;


    const underStandard =
        difference >= 0;


    const heightMeters =
        heightInches * 0.0254;


    const estimatedStepLength =
        heightMeters * 0.415;


    const courseMeters =
        CALCULATION_DISTANCE_MILES *
        1609.344;


    const estimatedSteps =
        Math.round(
            courseMeters /
            estimatedStepLength
        );


    userData.steps =
        estimatedSteps;


    const weightText =
        formatWeight(weight);


    const stepsText =
        estimatedSteps.toLocaleString();


    getElement("bigFinishTime").textContent =
        finishTime;


    getElement("statsFinish").textContent =
        finishTime;


    getElement("celebrationTime").textContent =
        finishTime;


    getElement("loadResult").textContent =
        weightText;


    getElement("perspectiveWeight").textContent =
        weightText;


    getElement("celebrationWeight").textContent =
        weightText;


    getElement("paceResult").textContent =
        formatPace(
            paceSeconds
        );


    getElement("speedResult").textContent =
        averageSpeed.toFixed(2);


    getElement("stepsResult").textContent =
        stepsText;


    getElement("finalStepResult").textContent =
        stepsText;


    getElement("differenceLabel").textContent =
        underStandard
            ? "TIME UNDER STANDARD"
            : "TIME OVER STANDARD";


    getElement("differenceResult").textContent =
        formatDifference(
            difference
        );


    getElement("celebrationDifference").textContent =
        formatDifference(
            difference
        ) +
        (
            underStandard
                ? " UNDER STANDARD"
                : " OVER STANDARD"
        );

}


/* =========================================================
   RESET / CANCEL MAIN MARCH
========================================================= */

function cancelMarch() {

    marchToken++;

    if (marchAnimationFrame) {

        cancelAnimationFrame(
            marchAnimationFrame
        );

        marchAnimationFrame = null;

    }

}


function resetMarch() {

    cancelMarch();


    getElement("distance").textContent =
        "0.0";


    getElement("progressPercent").textContent =
        "0%";


    getElement("milestoneCard").classList.add(
        "hidden"
    );


    getElement("marchComplete").classList.add(
        "hidden"
    );

}


/* =========================================================
   ANIMATE MAIN MARCH DISTANCE
========================================================= */

function animateMarchDistance(
    startMiles,
    endMiles,
    duration,
    token
) {

    return new Promise(function(resolve) {

        const startTime =
            performance.now();


        function animate(now) {

            if (
                token !== marchToken ||
                !getElement("marchPage")
                    .classList
                    .contains("active")
            ) {

                resolve(false);

                return;

            }


            const progress =
                Math.min(
                    (now - startTime) /
                    duration,
                    1
                );


            const distance =
                startMiles +
                (
                    endMiles -
                    startMiles
                ) *
                progress;


            getElement("distance").textContent =
                distance.toFixed(1);


            const percentage =
                Math.round(
                    (
                        distance /
                        DISPLAY_DISTANCE_MILES
                    ) *
                    100
                );


            getElement("progressPercent").textContent =
                percentage + "%";


            if (progress < 1) {

                marchAnimationFrame =
                    requestAnimationFrame(
                        animate
                    );

            }

            else {

                getElement("distance").textContent =
                    endMiles.toFixed(1);


                getElement("progressPercent").textContent =
                    Math.round(
                        (
                            endMiles /
                            DISPLAY_DISTANCE_MILES
                        ) *
                        100
                    ) +
                    "%";


                resolve(true);

            }

        }


        marchAnimationFrame =
            requestAnimationFrame(
                animate
            );

    });

}


/* =========================================================
   SHOW ONE MILESTONE AT A TIME
========================================================= */

async function showMilestone(
    text,
    token
) {

    if (token !== marchToken) {
        return false;
    }


    const card =
        getElement("milestoneCard");


    const milestoneText =
        getElement("milestoneText");


    card.classList.add(
        "hidden"
    );


    await sleep(
        MILESTONE_GAP_MS
    );


    if (token !== marchToken) {
        return false;
    }


    milestoneText.textContent =
        text;


    card.classList.remove(
        "hidden"
    );


    await sleep(
        MILESTONE_SHOW_MS
    );


    if (token !== marchToken) {
        return false;
    }


    card.classList.add(
        "hidden"
    );


    await sleep(
        MILESTONE_GAP_MS
    );


    return token === marchToken;

}


/* =========================================================
   MAIN MARCH

   0 → 5
   5 → 10
   10 → 15
   THEN:
   4 MILES LEFT
   16 → 3 LEFT
   17 → 2 LEFT
   18 → 1 LEFT

   STOPS AT 18.
========================================================= */

async function startMarch() {

    const token =
        marchToken;


    let success;


    success =
        await animateMarchDistance(
            0,
            5,
            6500,
            token
        );

    if (!success) {
        return;
    }


    success =
        await showMilestone(
            "5 MILES",
            token
        );

    if (!success) {
        return;
    }


    success =
        await animateMarchDistance(
            5,
            10,
            6500,
            token
        );

    if (!success) {
        return;
    }


    success =
        await showMilestone(
            "10 MILES",
            token
        );

    if (!success) {
        return;
    }


    success =
        await animateMarchDistance(
            10,
            15,
            6500,
            token
        );

    if (!success) {
        return;
    }


    success =
        await showMilestone(
            "15 MILES",
            token
        );

    if (!success) {
        return;
    }


    success =
        await showMilestone(
            "4 MILES LEFT",
            token
        );

    if (!success) {
        return;
    }


    success =
        await animateMarchDistance(
            15,
            16,
            2500,
            token
        );

    if (!success) {
        return;
    }


    success =
        await showMilestone(
            "3 MILES LEFT",
            token
        );

    if (!success) {
        return;
    }


    success =
        await animateMarchDistance(
            16,
            17,
            2500,
            token
        );

    if (!success) {
        return;
    }


    success =
        await showMilestone(
            "2 MILES LEFT",
            token
        );

    if (!success) {
        return;
    }


    success =
        await animateMarchDistance(
            17,
            18,
            2500,
            token
        );

    if (!success) {
        return;
    }


    success =
        await showMilestone(
            "1 MILE LEFT",
            token
        );

    if (!success) {
        return;
    }


    getElement("distance").textContent =
        "18.0";


    getElement("progressPercent").textContent =
        "95%";


    getElement("marchComplete").classList.remove(
        "hidden"
    );

}


/* =========================================================
   FINAL PAGE RESET
========================================================= */

function resetFinalPage() {

    if (finalAnimationFrame) {

        cancelAnimationFrame(
            finalAnimationFrame
        );

        finalAnimationFrame = null;

    }


    finalMileFinished = false;

    crossedFinish = false;


    getElement("finalDistance").textContent =
        "18.0";


    getElement("finalMessage").textContent =
        "One mile left.";


    getElement("finalSoldier").classList.remove(
        "crossingFinish"
    );


    getElement("finishGate").classList.remove(
        "gateBurst"
    );


    getElement("crossFinish").classList.remove(
        "hidden"
    );


    getElement("crossFinish").disabled =
        true;


    getElement("finishNextButton").classList.add(
        "hidden"
    );


    getElement("finishEnterHint").classList.remove(
        "hidden"
    );


    getElement("finishEnterHint").textContent =
        "THE FINAL MILE";


    clearFinishConfetti();

}


/* =========================================================
   FINAL 18 → 19 MILE
========================================================= */

function startFinalMile() {

    const startTime =
        performance.now();


    function animate(now) {

        if (
            !getElement("finalPage")
                .classList
                .contains("active")
        ) {
            return;
        }


        const progress =
            Math.min(
                (now - startTime) /
                FINAL_MILE_DURATION,
                1
            );


        const distance =
            18 + progress;


        getElement("finalDistance").textContent =
            distance.toFixed(1);


        if (distance < 18.45) {

            getElement("finalMessage").textContent =
                "One mile left.";

        }

        else if (distance < 18.75) {

            getElement("finalMessage").textContent =
                "Keep moving.";

        }

        else if (distance < 19) {

            getElement("finalMessage").textContent =
                "The finish is right there.";

        }


        if (progress < 1) {

            finalAnimationFrame =
                requestAnimationFrame(
                    animate
                );

        }

        else {

            getElement("finalDistance").textContent =
                "19.0";


            getElement("finalMessage").textContent =
                "19 miles complete.";


            finalMileFinished =
                true;


            getElement("crossFinish").disabled =
                false;


            getElement("finishEnterHint").textContent =
                "CLICK OR PRESS ENTER";

        }

    }


    finalAnimationFrame =
        requestAnimationFrame(
            animate
        );

}


/* =========================================================
   CROSS THE FINISH
========================================================= */

function crossTheFinish() {

    if (
        !finalMileFinished ||
        crossedFinish
    ) {
        return;
    }


    crossedFinish = true;


    getElement("crossFinish").classList.add(
        "hidden"
    );


    getElement("finishEnterHint").classList.add(
        "hidden"
    );


    getElement("finalSoldier").classList.add(
        "crossingFinish"
    );


    setTimeout(function() {

        launchColoredFinishConfetti();

    }, 500);


    setTimeout(function() {

        getElement("finishGate").classList.add(
            "gateBurst"
        );


        launchWhiteFinishConfetti();

    }, 1100);


    setTimeout(function() {

        getElement("finishNextButton").classList.remove(
            "hidden"
        );


        getElement("finishEnterHint").classList.remove(
            "hidden"
        );


        getElement("finishEnterHint").textContent =
            "CLICK NEXT OR PRESS ENTER";

    }, 3100);

}


/* =========================================================
   CANVAS SETUP
========================================================= */

function setupCanvas(canvas) {

    canvas.width =
        window.innerWidth;


    canvas.height =
        window.innerHeight;


    return canvas.getContext("2d");

}


/* =========================================================
   FINISH CONFETTI PARTICLES
========================================================= */

function createFinishParticle(
    canvas,
    color,
    largeBurst
) {

    return {

        x:
            (canvas.width / 2) +
            (
                Math.random() -
                0.5
            ) *
            (
                largeBurst
                    ? 280
                    : 200
            ),

        y:
            canvas.height *
            (
                largeBurst
                    ? 0.50
                    : 0.56
            ),

        vx:
            (
                Math.random() -
                0.5
            ) *
            (
                largeBurst
                    ? 16
                    : 12
            ),

        vy:
            -5 -
            Math.random() *
            (
                largeBurst
                    ? 12
                    : 9
            ),

        gravity:
            0.14 +
            Math.random() *
            0.07,

        width:
            4 +
            Math.random() *
            8,

        height:
            8 +
            Math.random() *
            18,

        rotation:
            Math.random() *
            Math.PI,

        rotationSpeed:
            (
                Math.random() -
                0.5
            ) *
            0.3,

        opacity:
            1,

        color:
            color

    };

}


/* =========================================================
   COLORED FINISH CONFETTI
========================================================= */

function launchColoredFinishConfetti() {

    const canvas =
        getElement(
            "finishConfettiCanvas"
        );


    setupCanvas(canvas);


    const colors = [
        "#ffffff",
        "#ffd98c",
        "#ffb25f",
        "#f77d55",
        "#df5e5f",
        "#798566"
    ];


    for (
        let i = 0;
        i < 120;
        i++
    ) {

        const color =
            colors[
                Math.floor(
                    Math.random() *
                    colors.length
                )
            ];


        finishParticles.push(
            createFinishParticle(
                canvas,
                color,
                false
            )
        );

    }


    startFinishConfetti();

}


/* =========================================================
   WHITE FINISH CONFETTI
========================================================= */

function launchWhiteFinishConfetti() {

    const canvas =
        getElement(
            "finishConfettiCanvas"
        );


    setupCanvas(canvas);


    for (
        let i = 0;
        i < 190;
        i++
    ) {

        const color =
            Math.random() > 0.18
                ? "#ffffff"
                : "#fff4d9";


        finishParticles.push(
            createFinishParticle(
                canvas,
                color,
                true
            )
        );

    }


    startFinishConfetti();

}


/* =========================================================
   FINISH CONFETTI LOOP
========================================================= */

function startFinishConfetti() {

    if (finishConfettiFrame) {
        return;
    }


    const canvas =
        getElement(
            "finishConfettiCanvas"
        );


    const ctx =
        canvas.getContext("2d");


    function draw() {

        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );


        finishParticles.forEach(
            function(particle) {

                particle.x +=
                    particle.vx;

                particle.y +=
                    particle.vy;

                particle.vy +=
                    particle.gravity;

                particle.rotation +=
                    particle.rotationSpeed;

                particle.opacity -=
                    0.006;


                ctx.save();


                ctx.globalAlpha =
                    Math.max(
                        0,
                        particle.opacity
                    );


                ctx.translate(
                    particle.x,
                    particle.y
                );


                ctx.rotate(
                    particle.rotation
                );


                ctx.fillStyle =
                    particle.color;


                ctx.fillRect(
                    -particle.width / 2,
                    -particle.height / 2,
                    particle.width,
                    particle.height
                );


                ctx.restore();

            }
        );


        finishParticles =
            finishParticles.filter(
                function(particle) {

                    return (
                        particle.opacity > 0 &&
                        particle.y <
                        canvas.height + 100
                    );

                }
            );


        if (
            finishParticles.length > 0
        ) {

            finishConfettiFrame =
                requestAnimationFrame(
                    draw
                );

        }

        else {

            finishConfettiFrame =
                null;


            ctx.clearRect(
                0,
                0,
                canvas.width,
                canvas.height
            );

        }

    }


    finishConfettiFrame =
        requestAnimationFrame(
            draw
        );

}


/* =========================================================
   CLEAR FINISH CONFETTI
========================================================= */

function clearFinishConfetti() {

    if (finishConfettiFrame) {

        cancelAnimationFrame(
            finishConfettiFrame
        );

    }


    finishConfettiFrame = null;

    finishParticles = [];


    const canvas =
        getElement(
            "finishConfettiCanvas"
        );


    if (!canvas) {
        return;
    }


    const ctx =
        setupCanvas(canvas);


    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

}


/* =========================================================
   CELEBRATION CONFETTI
========================================================= */

function startCelebrationConfetti() {

    const canvas =
        getElement("confettiCanvas");


    if (celebrationFrame) {

        cancelAnimationFrame(
            celebrationFrame
        );

        celebrationFrame = null;

    }


    const ctx =
        setupCanvas(canvas);


    const colors = [
        "#ffffff",
        "#ffd27e",
        "#ff9a5a",
        "#e96d63",
        "#8b9677"
    ];


    const pieces =
        Array.from(
            {
                length: 170
            },
            function() {

                return {

                    x:
                        Math.random() *
                        canvas.width,

                    y:
                        -40 -
                        Math.random() *
                        canvas.height,

                    vx:
                        -1.2 +
                        Math.random() *
                        2.4,

                    vy:
                        2 +
                        Math.random() *
                        4,

                    width:
                        5 +
                        Math.random() *
                        8,

                    height:
                        8 +
                        Math.random() *
                        12,

                    rotation:
                        Math.random() *
                        Math.PI,

                    rotationSpeed:
                        -0.12 +
                        Math.random() *
                        0.24,

                    color:
                        colors[
                            Math.floor(
                                Math.random() *
                                colors.length
                            )
                        ]

                };

            }
        );


    function draw() {

        if (
            !getElement(
                "celebrationPage"
            )
            .classList
            .contains("active")
        ) {

            ctx.clearRect(
                0,
                0,
                canvas.width,
                canvas.height
            );


            celebrationFrame = null;

            return;

        }


        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );


        pieces.forEach(
            function(piece) {

                piece.x +=
                    piece.vx;

                piece.y +=
                    piece.vy;

                piece.rotation +=
                    piece.rotationSpeed;


                if (
                    piece.y >
                    canvas.height + 30
                ) {

                    piece.y = -30;

                    piece.x =
                        Math.random() *
                        canvas.width;

                }


                ctx.save();


                ctx.translate(
                    piece.x,
                    piece.y
                );


                ctx.rotate(
                    piece.rotation
                );


                ctx.fillStyle =
                    piece.color;


                ctx.fillRect(
                    -piece.width / 2,
                    -piece.height / 2,
                    piece.width,
                    piece.height
                );


                ctx.restore();

            }
        );


        celebrationFrame =
            requestAnimationFrame(
                draw
            );

    }


    celebrationFrame =
        requestAnimationFrame(
            draw
        );

}


/* =========================================================
   REPLAY
========================================================= */

function replayJourney() {

    userData = {
        finishSeconds: null,
        weight: null,
        heightInches: null,
        steps: null
    };


    [
        "hours",
        "minutes",
        "seconds",
        "weight",
        "height"
    ]
    .forEach(
        function(id) {

            const input =
                getElement(id);

            if (input) {
                input.value = "";
            }

        }
    );


    getElement("timeError").textContent =
        "";


    switchScene("intro");

}


/* =========================================================
   BUTTON CLICKS
========================================================= */

document.addEventListener(
    "click",
    function(event) {

        const nextButton =
            event.target.closest(
                "[data-next]"
            );


        if (nextButton) {

            const destination =
                nextButton.getAttribute(
                    "data-next"
                );


            if (destination) {

                switchScene(
                    destination
                );

            }


            return;

        }


        if (
            event.target.closest(
                "#submitTimeButton"
            )
        ) {

            submitResults();

            return;

        }


        if (
            event.target.closest(
                "#crossFinish"
            )
        ) {

            crossTheFinish();

            return;

        }


        if (
            event.target.closest(
                "#finishNextButton"
            )
        ) {

            switchScene(
                "celebrationPage"
            );

            return;

        }


        if (
            event.target.closest(
                "#replayButton"
            )
        ) {

            replayJourney();

        }

    }
);


/* =========================================================
   ENTER KEY
========================================================= */

document.addEventListener(
    "keydown",
    function(event) {

        if (event.key !== "Enter") {
            return;
        }


        const scene =
            getCurrentScene();


        if (!scene) {
            return;
        }


        if (scene.id === "timePage") {

            submitResults();

            return;

        }


        if (scene.id === "marchPage") {

            const marchComplete =
                getElement(
                    "marchComplete"
                );


            if (
                !marchComplete.classList.contains(
                    "hidden"
                )
            ) {

                switchScene(
                    "resultPage"
                );

            }


            return;

        }


        if (scene.id === "finalPage") {

            if (
                finalMileFinished &&
                !crossedFinish
            ) {

                crossTheFinish();

                return;

            }


            if (
                crossedFinish &&
                !getElement(
                    "finishNextButton"
                )
                .classList
                .contains("hidden")
            ) {

                switchScene(
                    "celebrationPage"
                );

            }


            return;

        }


        if (
            scene.id ===
            "celebrationPage"
        ) {

            return;

        }


        const nextButton =
            scene.querySelector(
                "[data-next]"
            );


        if (nextButton) {

            const destination =
                nextButton.getAttribute(
                    "data-next"
                );


            if (destination) {

                switchScene(
                    destination
                );

            }

        }

    }
);


/* =========================================================
   RESIZE CANVASES
========================================================= */

window.addEventListener(
    "resize",
    function() {

        const finishCanvas =
            getElement(
                "finishConfettiCanvas"
            );


        const celebrationCanvas =
            getElement(
                "confettiCanvas"
            );


        if (finishCanvas) {

            finishCanvas.width =
                window.innerWidth;

            finishCanvas.height =
                window.innerHeight;

        }


        if (celebrationCanvas) {

            celebrationCanvas.width =
                window.innerWidth;

            celebrationCanvas.height =
                window.innerHeight;

        }

    }
);


/* =========================================================
   INITIALIZE WEBSITE
========================================================= */

function initializeWebsite() {

    document
        .querySelectorAll(".scene")
        .forEach(
            function(scene) {

                scene.classList.remove(
                    "active"
                );

            }
        );


    const intro =
        getElement("intro");


    if (intro) {

        intro.classList.add(
            "active"
        );

    }


    updateSceneDots("intro");


    const finishCanvas =
        getElement(
            "finishConfettiCanvas"
        );


    const celebrationCanvas =
        getElement(
            "confettiCanvas"
        );


    if (finishCanvas) {
        setupCanvas(finishCanvas);
    }


    if (celebrationCanvas) {
        setupCanvas(celebrationCanvas);
    }

}


/* =========================================================
   START ONLY AFTER HTML EXISTS
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeWebsite
    );

}

else {

    initializeWebsite();

}
