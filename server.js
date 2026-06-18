const http = require("http");
const https = require("https");
const net = require("net");
const tls = require("tls");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.argv[2] || process.env.PORT || 4173);

loadEnvFile();

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

function loadEnvFile() {
  const envPath = path.join(root, ".env");

  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function escapeSmtpValue(value = "") {
  return String(value).replace(/\r?\n/g, " ").trim();
}

function formatEmailMessage(payload) {
  const toEmail = process.env.ENQUIRY_TO_EMAIL || "enquiries@dukegs.com";
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SENDGRID_FROM_EMAIL || toEmail;
  const subject = `New DUKE website enquiry: ${payload.service || "General enquiry"}`;
  const body = [
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    `Service: ${payload.service || "Not specified"}`,
    "",
    "Message:",
    payload.message,
  ].join("\r\n");

  return [
    `From: "DUKE Website" <${escapeSmtpValue(fromEmail)}>`,
    `To: ${escapeSmtpValue(toEmail)}`,
    `Reply-To: "${escapeSmtpValue(payload.name)}" <${escapeSmtpValue(payload.email)}>`,
    `Subject: ${escapeSmtpValue(subject)}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "",
    body,
  ].join("\r\n");
}

function smtpCommand(socket, command, expectedCodes) {
  return new Promise((resolve, reject) => {
    let response = "";

    const onData = (chunk) => {
      response += chunk.toString("utf8");
      const lines = response.split(/\r?\n/).filter(Boolean);
      const last = lines[lines.length - 1] || "";

      if (!/^\d{3}\s/.test(last)) {
        return;
      }

      socket.off("data", onData);
      const code = Number(last.slice(0, 3));

      if (!expectedCodes.includes(code)) {
        reject(new Error(`SMTP command failed: ${command || "connect"} -> ${response}`));
        return;
      }

      resolve(response);
    };

    socket.on("data", onData);

    if (command) {
      socket.write(`${command}\r\n`);
    }
  });
}

async function postToSmtp(payload) {
  const host = process.env.SMTP_HOST;
  const portNumber = Number(process.env.SMTP_PORT || 587);
  const username = process.env.SMTP_USER;
  const password = process.env.SMTP_PASS;
  const toEmail = process.env.ENQUIRY_TO_EMAIL || "enquiries@dukegs.com";
  const fromEmail = process.env.SMTP_FROM_EMAIL || toEmail;
  const useTls = String(process.env.SMTP_SECURE || "").toLowerCase() === "true" || portNumber === 465;

  if (!host || !username || !password) {
    throw new Error("SMTP_HOST, SMTP_USER and SMTP_PASS must be configured");
  }

  const socket = useTls
    ? tls.connect({ host, port: portNumber, servername: host })
    : net.connect({ host, port: portNumber });

  socket.setEncoding("utf8");

  try {
    await smtpCommand(socket, "", [220]);
    await smtpCommand(socket, `EHLO ${process.env.SMTP_EHLO_DOMAIN || "dukegs.com"}`, [250]);

    if (!useTls && portNumber !== 25) {
      await smtpCommand(socket, "STARTTLS", [220]);
      const secureSocket = tls.connect({ socket, servername: host });
      secureSocket.setEncoding("utf8");
      await smtpCommand(secureSocket, `EHLO ${process.env.SMTP_EHLO_DOMAIN || "dukegs.com"}`, [250]);
      return sendSmtpMail(secureSocket, username, password, fromEmail, toEmail, payload);
    }

    return sendSmtpMail(socket, username, password, fromEmail, toEmail, payload);
  } catch (error) {
    socket.destroy();
    throw error;
  }
}

async function sendSmtpMail(socket, username, password, fromEmail, toEmail, payload) {
  await smtpCommand(socket, "AUTH LOGIN", [334]);
  await smtpCommand(socket, Buffer.from(username).toString("base64"), [334]);
  await smtpCommand(socket, Buffer.from(password).toString("base64"), [235]);
  await smtpCommand(socket, `MAIL FROM:<${fromEmail}>`, [250]);
  await smtpCommand(socket, `RCPT TO:<${toEmail}>`, [250, 251]);
  await smtpCommand(socket, "DATA", [354]);
  await smtpCommand(socket, `${formatEmailMessage(payload)}\r\n.`, [250]);
  await smtpCommand(socket, "QUIT", [221]);
  socket.end();
}

function sendEnquiry(payload) {
  if (process.env.SMTP_HOST) {
    return postToSmtp(payload);
  }

  return postToSendGrid(payload);
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

    await sendEnquiry(payload);
    sendJson(res, 200, { ok: true });
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: "Unable to send enquiry" });
  }
}

server.listen(port, "127.0.0.1", () => {
  console.log(`DUKE preview running at http://127.0.0.1:${port}/`);
});
