const toggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav-links");

if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    nav.classList.toggle("open");
  });
}

const createCubeWatermark = () => {
  const watermark = document.createElement("div");
  const cube = document.createElement("div");
  const faces = ["front", "back", "right", "left", "top", "bottom"];

  watermark.className = "cube-watermark";
  watermark.setAttribute("aria-hidden", "true");
  cube.className = "cube-watermark-shape";

  faces.forEach((face) => {
    const side = document.createElement("span");
    side.className = `cube-face cube-face-${face}`;
    cube.appendChild(side);
  });

  watermark.appendChild(cube);
  document.body.appendChild(watermark);
};

if (!window.matchMedia("(max-width: 620px)").matches) {
  createCubeWatermark();
}

const enquiryForm = document.querySelector("[data-enquiry-form]");

if (enquiryForm) {
  enquiryForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = enquiryForm.querySelector("[data-form-message]");
    const submit = enquiryForm.querySelector("button[type='submit']");
    const formData = new FormData(enquiryForm);
    const payload = Object.fromEntries(formData.entries());

    if (message) {
      message.textContent = "Sending your enquiry...";
      message.className = "form-message";
    }

    if (submit) {
      submit.disabled = true;
    }

    try {
      const response = await fetch(enquiryForm.action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Unable to send enquiry");
      }

      enquiryForm.reset();
      if (message) {
        message.textContent = "Thank you. Your enquiry has been sent.";
        message.classList.add("success");
      }
    } catch (error) {
      if (message) {
        message.textContent = "Sorry, your enquiry could not be sent. Please email enquiries@dukegs.com.";
        message.classList.add("error");
      }
    } finally {
      if (submit) {
        submit.disabled = false;
      }
    }
  });
}

const createScrollClimber = () => {
  const climber = document.createElement("a");
  const climberImage = document.createElement("img");
  let currentY = 0;
  let targetY = 0;
  let animationFrame = null;

  climber.className = "scroll-climber";
  climber.href = "contact.html";
  climber.setAttribute("aria-label", "Contact DUKE Global Services");
  climberImage.src = "assets/duke-climber.png";
  climberImage.className = "climber-main";
  climberImage.alt = "";
  climber.appendChild(climberImage);
  document.body.appendChild(climber);

  const updateTarget = () => {
    const maxTravel = Math.max(window.innerHeight - climber.offsetHeight - 48, 120);
    const pageRange = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const progress = Math.min(Math.max(window.scrollY / pageRange, 0), 1);
    targetY = maxTravel * progress;
  };

  const animate = () => {
    currentY += (targetY - currentY) * 0.08;
    climber.style.transform = `translate3d(0, ${currentY}px, 0)`;
    animationFrame = requestAnimationFrame(animate);
  };

  window.addEventListener("scroll", updateTarget, { passive: true });
  window.addEventListener("resize", updateTarget);
  climberImage.addEventListener("load", updateTarget);

  updateTarget();
  animationFrame = requestAnimationFrame(animate);

  window.addEventListener("beforeunload", () => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
  });
};

if (!window.matchMedia("(max-width: 920px)").matches) {
  createScrollClimber();
}

const heroHoverCanvas = document.querySelector("[data-hero-hover-sparks]");

if (heroHoverCanvas) {
  const hero = heroHoverCanvas.closest("[data-hero-animation]");
  const context = heroHoverCanvas.getContext("2d");
  const sparks = [];
  let width = 0;
  let height = 0;
  let lastTime = performance.now();

  const resizeCanvas = () => {
    const rect = heroHoverCanvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    heroHoverCanvas.width = Math.max(1, Math.round(width * ratio));
    heroHoverCanvas.height = Math.max(1, Math.round(height * ratio));
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const addSubtleSpark = () => {
    const origin = {
      x: width * (0.35 + Math.random() * 0.12),
      y: height * (0.77 + Math.random() * 0.08),
    };
    const angle = -0.18 + (Math.random() - 0.5) * 0.28;
    const speed = 250 + Math.random() * 430;
    const life = 0.2 + Math.random() * 0.28;

    sparks.push({
      x: origin.x,
      y: origin.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed + 24,
      life,
      maxLife: life,
      length: 18 + Math.random() * 54,
      width: 0.6 + Math.random() * 1.1,
    });
  };

  const drawSpark = (spark) => {
    const fade = Math.max(spark.life / spark.maxLife, 0);
    const tailX = spark.x - (spark.vx / 920) * spark.length;
    const tailY = spark.y - (spark.vy / 920) * spark.length;
    const gradient = context.createLinearGradient(spark.x, spark.y, tailX, tailY);

    gradient.addColorStop(0, `rgba(255, 244, 200, ${fade * 0.86})`);
    gradient.addColorStop(0.34, `rgba(255, 156, 16, ${fade * 0.76})`);
    gradient.addColorStop(1, "rgba(255, 84, 0, 0)");

    context.strokeStyle = gradient;
    context.lineWidth = spark.width;
    context.beginPath();
    context.moveTo(spark.x, spark.y);
    context.lineTo(tailX, tailY);
    context.stroke();
  };

  const animateHeroHoverSparks = (time) => {
    const delta = Math.min((time - lastTime) / 1000, 0.04);
    lastTime = time;
    const phase = (time % 9000) / 9000;
    const cuttingFrameVisible = phase > 0.3 && phase < 0.74;

    context.clearRect(0, 0, width, height);

    if (cuttingFrameVisible && Math.random() > 0.78) {
      addSubtleSpark();
    }

    for (let i = sparks.length - 1; i >= 0; i -= 1) {
      const spark = sparks[i];
      spark.x += spark.vx * delta;
      spark.y += spark.vy * delta;
      spark.vy += 330 * delta;
      spark.life -= delta;

      if (spark.life <= 0 || spark.x > width + 80 || spark.y > height + 80) {
        sparks.splice(i, 1);
      } else {
        drawSpark(spark);
      }
    }

    requestAnimationFrame(animateHeroHoverSparks);
  };

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  requestAnimationFrame(animateHeroHoverSparks);
}

const percentCounter = document.querySelector("[data-count-percent]");

if (percentCounter) {
  const tile = percentCounter.closest(".stats-progress");
  const countDuration = 5000;
  const holdDuration = 5000;
  const totalDuration = countDuration + holdDuration;

  const animatePercent = (time) => {
    const cycle = time % totalDuration;
    const progress = cycle < countDuration ? cycle / countDuration : 1;
    const value = Math.round(progress * 100);

    percentCounter.textContent = `${value}%`;

    if (tile) {
      tile.style.setProperty("--progress", `${value}%`);
    }

    requestAnimationFrame(animatePercent);
  };

  requestAnimationFrame(animatePercent);
}
