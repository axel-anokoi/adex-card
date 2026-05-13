# Email Mailer Implementation Plan

## Information Gathered
- Task shows email configuration using SMTP with Gmail
- MAIL_MAILER=smtp
- MAIL_HOST=smtp.gmail.com
- MAIL_PORT=587
- MAIL_USERNAME=edwardelrick99@gmail.com
- MAIL_PASSWORD="" (empty - user needs to provide app password)
- MAIL_ENCRYPTION=tls
- MAIL_FROM_ADDRESS=edwardelrick99@gmail.com
- MAIL_FROM_NAME="Adex card"
- Current dependencies in package.json don't include nodemailer
- This is a Next.js App Router project with API routes

## Plan
1. Install nodemailer package
2. Create mail configuration file (src/lib/mail/config.ts)
3. Create mailer service with helper functions (src/lib/mail/mailer.ts)
4. Create sample .env.local.example with mail environment variables
5. Run npm install to install nodemailer

## Dependent Files
- package.json - add nodemailer dependency
- Need creation of src/lib/mail/ directory and files

## Followup Steps
- Test the mail configuration with actual credentials
- Create example edge function using the mailer
