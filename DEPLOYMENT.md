# DUKE Website Deployment Checklist

Use this checklist when the live domain and hosting are ready.

## 1. Choose Hosting

Recommended options:

- Cloudflare Pages: best for simple static hosting and performance.
- Netlify: good static hosting and easy form handling.
- Node hosting: required if using `server.js` directly for `/api/enquiry`.

## 2. Connect GitHub

Connect the GitHub repository:

```text
https://github.com/deangs1215-dev/Duke.git
```

Deploy from:

```text
main
```

Build command:

```text
none
```

Publish directory:

```text
/
```

## 3. Domain Setup

Current planned domain in SEO files:

```text
https://www.dukegs.com
```

If the final domain changes, update:

- `sitemap.xml`
- `robots.txt`
- Open Graph image URLs if the host requires absolute social image URLs

## 4. Enquiry Form Setup

The current form posts to:

```text
/api/enquiry
```

For static hosting, choose one:

- Add a serverless function for `/api/enquiry`.
- Use Netlify Forms.
- Use Formspree or another form endpoint.
- Use Node hosting and run `server.js`.

Environment variables are listed in `.env.example`.

## 5. Pre-launch QA

Check these pages before launch:

- `/index.html`
- `/about.html`
- `/services.html`
- `/project.html`
- `/pricing.html`
- `/contact.html`

Confirm:

- navigation works on desktop and mobile
- contact form submits correctly
- images load quickly
- footer email and phone details are correct
- SEO preview image appears when sharing the domain
