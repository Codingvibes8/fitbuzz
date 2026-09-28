# Cron Jobs Setup Guide

## 1. Add CRON_SECRET to .env.local

```bash
# Generate a secure random secret (run in terminal)
openssl rand -hex 32
```

Add to `.env.local`:

```env
# Cron Jobs
CRON_SECRET=your-generated-secret-here
APP_URL=https://your-app.vercel.app
```

**Production**: Add `CRON_SECRET` and `APP_URL` in Vercel Dashboard → Settings → Environment Variables.

---

## 2. Create API Route for Cron

`src/app/api/cron/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  // Vercel Cron sends: Authorization: Bearer <CRON_SECRET>
  // GitHub Actions: you set the header manually
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Your cron logic here
    // Example: Reset daily API usage, send reminders, cleanup, etc.
    
    await resetDailyApiUsage();
    await sendDailyReminders();
    
    return NextResponse.json({ 
      success: true, 
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

async function resetDailyApiUsage() {
  // Reset API call counters for all users
  // Implementation depends on your database (Supabase/Prisma)
}

async function sendDailyReminders() {
  // Send workout reminders, streak notifications, etc.
}
```

---

## 3. Vercel Cron (vercel.json)

```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Schedule format**: `minute hour day month weekday`
- `0 9 * * *` = Daily at 9:00 AM UTC
- `0 0 * * 0` = Weekly on Sunday at midnight
- `0 12 * * 1-5` = Weekdays at noon

**Deploy**: Push to Vercel → Cron runs automatically.

---

## 4. GitHub Actions (`.github/workflows/cron.yml`)

```yaml
name: Daily Cron Job

on:
  schedule:
    - cron: '0 9 * * *'  # Daily at 9 AM UTC
  workflow_dispatch:  # Manual trigger

jobs:
  cron:
    runs-on: ubuntu-latest
    steps:
      - name: Call Cron Endpoint
        run: |
          curl -X GET "${{ secrets.APP_URL }}/api/cron" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json" \
            --fail --silent --show-error
```

**Required GitHub Secrets** (Settings → Secrets → Actions):
- `APP_URL`: Your production URL (e.g., `https://fitflow-ai.vercel.app`)
- `CRON_SECRET`: Same secret from `.env.local`

---

## 5. Alternative: External Cron Services

### cron-job.org (Free)
1. Create account at cron-job.org
2. New cronjob:
   - URL: `https://your-app.vercel.app/api/cron`
   - Schedule: Daily 09:00 UTC
   - Headers: `Authorization: Bearer YOUR_CRON_SECRET`
   - Method: GET

### EasyCron
Similar setup with web-based UI.

---

## 6. Testing Locally

```bash
# Test the endpoint
curl -X GET "http://localhost:3000/api/cron" \
  -H "Authorization: Bearer your-local-cron-secret"
```

Add to `.env.local` for local testing:
```env
CRON_SECRET=dev-secret-for-testing
```

---

## 7. Common Cron Tasks for Fitness App

| Task | Frequency | Description |
|------|-----------|-------------|
| Reset API usage | Daily | Clear daily API call counters |
| Streak reminders | Daily 8 AM | Notify users about workout streaks |
| Weekly summary | Weekly Sunday | Email weekly progress report |
| Plan expiration | Daily | Check/notify expiring Pro/Elite plans |
| Cleanup old data | Monthly | Archive old workout logs |
| AI usage reset | Daily | Reset AI plan generation quotas |

---

## 8. Monitoring & Debugging

### Vercel Logs
- Dashboard → Functions → `/api/cron` → View logs

### GitHub Actions
- Actions tab → Workflow runs → Check output

### Add Logging to Cron Route
```typescript
console.log('[CRON] Starting daily job', { 
  timestamp: new Date().toISOString(),
  env: process.env.NODE_ENV 
});
```

---

## 9. Security Checklist

- [ ] `CRON_SECRET` is 32+ random characters
- [ ] Secret stored only in `.env.local` (local) and Vercel/GitHub secrets (prod)
- [ ] Cron endpoint validates `Authorization` header
- [ ] Rate limiting on cron endpoint (optional but recommended)
- [ ] No sensitive data in cron response logs
- [ ] HTTPS enforced in production

---

## 10. Quick Deploy Checklist

1. [ ] Add `CRON_SECRET` to `.env.local`
2. [ ] Create `src/app/api/cron/route.ts`
3. [ ] Add `vercel.json` with cron config
4. [ ] Deploy to Vercel
5. [ ] Add `CRON_SECRET` and `APP_URL` to Vercel Environment Variables
6. [ ] (Optional) Set up GitHub Actions as backup
7. [ ] Test with manual trigger
8. [ ] Monitor first few runs