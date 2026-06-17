const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.argv[2] || process.env.PORT || 4173);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/api/enquiry") {
    handleEnquiry(req, res);
    return;
  }

  const urlPath = decodeURIComponent(new URL(req.url, `http://localhost:${port}`).pathname);
  const requested = urlPath === "/" ? "/index.html" : urlPath;
  const filePath = path.normalize(path.join(root, requested));

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    res.writeHead(200, { "Content-Type": types[path.extname(filePath)] || "application/octet-stream" });
    res.end(data);
  });
});

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("Request body too large"));
      }
    });

    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function postToSendGrid(payload) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const toEmail = process.env.ENQUIRY_TO_EMAIL || "enquiries@dukegs.com";
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || toEmail;

  if (!apiKey) {
    return Promise.reject(new Error("SENDGRID_API_KEY is not configured"));
  }

  const requestBody = JSON.stringify({
    personalizations: [{ to: [{ email: toEmail }] }],
    from: { email: fromEmail, name: "DUKE Website" },
    reply_to: { email: payload.email, name: payload.name },
    subject: `New DUKE website enquiry: ${payload.service || "General enquiry"}`,
    content: [
      {
        type: "text/plain",
        value: [
          `Name: ${payload.name}`,
          `Email: ${payload.email}`,
          `Service: ${payload.service || "Not specified"}`,
          "",
          "Message:",
          payload.message,
        ].join("\n"),
      },
    ],
  });

  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        hostname: "api.sendgrid.com",
        path: "/v3/mail/send",
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(requestBody),
        },
      },
      (response) => {
        let responseBody = "";

        response.on("data", (chunk) => {
          responseBody += chunk.toString();
        });

        response.on("end", () => {
          if (response.statusCode >= 200 && response.statusCode < 300) {
            resolve();
            return;
          }

          reject(new Error(`SendGrid returned ${response.statusCode}: ${responseBody}`));
        });
      },
    );

    request.on("error", reject);
    request.write(requestBody);
    request.end();
  });
}

async function handleEnquiry(req, res) {
  try {
    const body = await readBody(req);
    const contentType = req.headers["content-type"] || "";
    const payload = contentType.includes("application/json")
      ? JSON.parse(body || "{}")
      : Object.fromEntries(new URLSearchParams(body));

    if (!payload.name || !payload.email || !payload.message) {
      sendJson(res, 400, { error: "Missing required fields" });
      return;
    }

    await postToSendGrid(payload);
    sendJson(res, 200, { ok: true });
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: "Unable to send enquiry" });
  }
}

server.listen(port, "127.0.0.1", () => {
  console.log(`DUKE preview running at http://127.0.0.1:${port}/`);
});
