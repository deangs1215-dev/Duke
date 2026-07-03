# DUKE Global Services Website

Professional static website for DUKE Global Services, covering engineering consulting, technical resources, inspection support, NDT solutions, access solutions and industrial product supply.

## Local Preview

Run the local preview server:

```powershell
node server.js 58231
```

Then open:

```text
http://127.0.0.1:58231/index.html
```

## Pages

- `index.html` - Homepage
- `about.html` - Company overview
- `services.html` - Service offerings
- `project.html` - Project focus areas
- `pricing.html` - Pricing process
- `contact.html` - Contact and enquiry form

## Enquiry Form

The contact form posts to `/api/enquiry`, which is handled by `server.js` for local or Node-based hosting.

Required live environment variables are documented in `.env.example`.

Important: never commit real SMTP, SendGrid or API credentials to GitHub.

## Deployment Notes

This site is ready for GitHub-based deployment once hosting/domain details are confirmed.

Recommended hosts:

- Cloudflare Pages for a fast static deployment
- Netlify for static hosting plus built-in form options
- Node-compatible hosting if the existing `/api/enquiry` backend must run as-is

See `DEPLOYMENT.md` for the launch checklist.
