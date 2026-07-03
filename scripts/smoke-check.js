const http = require("http");
const { spawn } = require("child_process");

const port = 58232;
const pages = ["/index.html", "/about.html", "/services.html", "/project.html", "/pricing.html", "/contact.html"];
const server = spawn(process.execPath, ["server.js", String(port)], { stdio: "ignore" });

function requestPage(pathname) {
  return new Promise((resolve, reject) => {
    const req = http.get({ hostname: "127.0.0.1", port, path: pathname, timeout: 5000 }, (res) => {
      res.resume();
      res.on("end", () => {
        if (res.statusCode === 200) {
          resolve();
          return;
        }

        reject(new Error(`${pathname} returned ${res.statusCode}`));
      });
    });

    req.on("timeout", () => {
      req.destroy(new Error(`${pathname} timed out`));
    });
    req.on("error", reject);
  });
}

async function waitForServer() {
  for (let index = 0; index < 25; index += 1) {
    try {
      await requestPage("/index.html");
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  throw new Error("Preview server did not start");
}

(async () => {
  try {
    await waitForServer();
    await Promise.all(pages.map(requestPage));
    console.log("Smoke check passed.");
  } finally {
    server.kill();
  }
})().catch((error) => {
  console.error(error.message);
  server.kill();
  process.exit(1);
});
