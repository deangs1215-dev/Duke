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

const testCanvas = document.querySelector("[data-test-canvas]");

if (testCanvas) {
  const context = testCanvas.getContext("2d");
  const points = [];
  const pointer = { x: 0, y: 0, active: false };
  let width = 0;
  let height = 0;
  let lastTime = performance.now();

  const resizeTestCanvas = () => {
    const rect = testCanvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    testCanvas.width = Math.max(1, Math.round(width * ratio));
    testCanvas.height = Math.max(1, Math.round(height * ratio));
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    points.length = 0;

    const count = Math.max(44, Math.round((width * height) / 18500));
    for (let index = 0; index < count; index += 1) {
      points.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 18,
        vy: (Math.random() - 0.5) * 18,
        size: 1 + Math.random() * 2.4,
      });
    }
  };

  const drawTestCanvas = (time) => {
    const delta = Math.min((time - lastTime) / 1000, 0.04);
    lastTime = time;
    context.clearRect(0, 0, width, height);

    points.forEach((point, index) => {
      point.x += point.vx * delta;
      point.y += point.vy * delta;

      if (pointer.active) {
        const dx = point.x - pointer.x;
        const dy = point.y - pointer.y;
        const distance = Math.max(Math.hypot(dx, dy), 1);
        if (distance < 180) {
          const force = (180 - distance) / 180;
          point.x += (dx / distance) * force * 36 * delta;
          point.y += (dy / distance) * force * 36 * delta;
        }
      }

      if (point.x < -20) point.x = width + 20;
      if (point.x > width + 20) point.x = -20;
      if (point.y < -20) point.y = height + 20;
      if (point.y > height + 20) point.y = -20;

      for (let nextIndex = index + 1; nextIndex < points.length; nextIndex += 1) {
        const other = points[nextIndex];
        const distance = Math.hypot(point.x - other.x, point.y - other.y);
        if (distance < 150) {
          const opacity = (1 - distance / 150) * 0.22;
          context.strokeStyle = `rgba(247, 166, 0, ${opacity})`;
          context.lineWidth = 1;
          context.beginPath();
          context.moveTo(point.x, point.y);
          context.lineTo(other.x, other.y);
          context.stroke();
        }
      }

      context.fillStyle = "rgba(255, 255, 255, 0.72)";
      context.beginPath();
      context.arc(point.x, point.y, point.size, 0, Math.PI * 2);
      context.fill();
    });

    requestAnimationFrame(drawTestCanvas);
  };

  window.addEventListener("resize", resizeTestCanvas);
  window.addEventListener("pointermove", (event) => {
    const rect = testCanvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
  });
  window.addEventListener("pointerleave", () => {
    pointer.active = false;
  });

  resizeTestCanvas();
  requestAnimationFrame(drawTestCanvas);
}

document.querySelectorAll("[data-network-canvas]").forEach((canvas) => {
  const context = canvas.getContext("2d");
  const panel = canvas.closest(".about-network-panel") || canvas;
  const points = [];
  const pointer = { x: 0, y: 0, active: false };
  let width = 0;
  let height = 0;
  let lastTime = performance.now();

  const resizeNetworkCanvas = () => {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    points.length = 0;

    const count = Math.max(58, Math.round((width * height) / 9800));
    for (let index = 0; index < count; index += 1) {
      points.push({
        x: Math.random() * width,
        y: Math.random() * height,
        baseSpeed: 0.65 + Math.random() * 0.9,
        driftOffset: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20,
        pulse: Math.random() * Math.PI * 2,
        size: 1.2 + Math.random() * 3.8,
      });
    }
  };

  const drawNetworkCanvas = (time) => {
    const delta = Math.min((time - lastTime) / 1000, 0.04);
    lastTime = time;

    context.clearRect(0, 0, width, height);
    const glow = context.createRadialGradient(width * 0.46, height * 0.54, 0, width * 0.46, height * 0.54, width * 0.72);
    glow.addColorStop(0, "rgba(247,166,0,0.18)");
    glow.addColorStop(0.46, "rgba(247,166,0,0.05)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    context.fillStyle = glow;
    context.fillRect(0, 0, width, height);

    const driftTime = time * 0.00014;
    const globalDriftX = Math.sin(driftTime) * 11;
    const globalDriftY = Math.cos(driftTime * 0.82) * 7;

    points.forEach((point) => {
      const waveX = Math.sin(driftTime * point.baseSpeed + point.driftOffset) * 14;
      const waveY = Math.cos(driftTime * point.baseSpeed * 1.2 + point.driftOffset) * 10;

      point.x += (point.vx + globalDriftX + waveX) * delta;
      point.y += (point.vy + globalDriftY + waveY) * delta;
      point.pulse += delta * 2.2;

      if (pointer.active) {
        const dx = point.x - pointer.x;
        const dy = point.y - pointer.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 190 && distance > 0) {
          const force = (190 - distance) / 190;
          point.vx += (dx / distance) * force * 52 * delta;
          point.vy += (dy / distance) * force * 52 * delta;
        }
      }

      if (point.x < -24) point.x = width + 24;
      if (point.x > width + 24) point.x = -24;
      if (point.y < -24) point.y = height + 24;
      if (point.y > height + 24) point.y = -24;

      point.vx *= 0.995;
      point.vy *= 0.995;
    });

    for (let i = 0; i < points.length; i += 1) {
      for (let j = i + 1; j < points.length; j += 1) {
        const first = points[i];
        const second = points[j];
        const distance = Math.hypot(first.x - second.x, first.y - second.y);
        if (distance < 145) {
          const opacity = (1 - distance / 145) * 0.34;
          context.strokeStyle = `rgba(247,166,0,${opacity})`;
          context.lineWidth = 0.9;
          context.beginPath();
          context.moveTo(first.x, first.y);
          context.lineTo(second.x, second.y);
          context.stroke();
        }
      }
    }

    points.forEach((point) => {
      const shimmer = 0.6 + Math.sin(point.pulse) * 0.4;
      context.beginPath();
      context.arc(point.x, point.y, point.size + shimmer, 0, Math.PI * 2);
      context.fillStyle = `rgba(255,244,210,${0.42 + shimmer * 0.32})`;
      context.shadowColor = "rgba(247,166,0,0.75)";
      context.shadowBlur = 12 + shimmer * 9;
      context.fill();
      context.shadowBlur = 0;
    });

    requestAnimationFrame(drawNetworkCanvas);
  };

  panel.addEventListener("pointermove", (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
  });

  panel.addEventListener("pointerleave", () => {
    pointer.active = false;
  });

  window.addEventListener("resize", resizeNetworkCanvas);
  resizeNetworkCanvas();
  requestAnimationFrame(drawNetworkCanvas);
});

document.querySelectorAll("[data-reactive-card]").forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const rotateY = ((x / rect.width) - 0.5) * 10;
    const rotateX = ((y / rect.height) - 0.5) * -10;

    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);
    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
  });

  card.addEventListener("pointerleave", () => {
    card.style.transform = "";
  });
});
