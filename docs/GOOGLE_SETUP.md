# Google Calendar and Gmail

Once you connect Google, Vardaan can do these things on a call or in a task:

- **Read your calendar:** "What's on my calendar tomorrow?", "Am I free Friday afternoon?"
- **Book events:** "Book a meeting with rahul@example.com tomorrow at 4pm about the demo, with a Meet link."
  Google emails the invites itself. Vardaan always reads the details back and waits for your yes first.
- **Read your email (read-only):** "Any unread emails from my professor?", "Read me the latest one from Amazon."

It's free. You need a Google Cloud project with an OAuth client, which takes about 15 minutes.

## 1. Create the Google Cloud project

1. Open https://console.cloud.google.com and sign in with the Gmail account you want Vardaan to use.
2. Use the project picker (top left) to create a **New project** named `Vardaan`, then select it.
3. Go to **APIs & Services → Library** and enable both of these:
   - **Google Calendar API**
   - **Gmail API**

## 2. Set up the consent screen

1. Go to **Google Auth Platform** (or **APIs & Services → OAuth consent screen**) and click **Get started**.
2. Fill in:
   - App name: `Vardaan`
   - Support email: your email
   - Audience: **External**
   - Contact email: your email
   Then click **Create**.
3. Under **Audience → Test users**, click **Add users** and add your own Gmail address.
   While the app is in "Testing", only test users can connect.
4. Optional: under **Data access → Add or remove scopes**, add `.../auth/calendar.events` and
   `.../auth/gmail.readonly`.

## 3. Create the OAuth client

1. Go to **Clients** (or **APIs & Services → Credentials**), then **Create client** (or
   **Create credentials → OAuth client ID**).
2. Set Application type to **Web application** and Name to `Vardaan`.
3. Under **Authorized redirect URIs**, add exactly:
   ```
   http://localhost:3000/api/google/callback
   ```
4. Click **Create**, then copy the **Client ID** and **Client secret**.

## 4. Add the keys to Vardaan

Add these to `.env.local`, then restart `npm run dev`:

```
GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxx
```

## 5. Connect

1. Open Vardaan at **http://localhost:3000** (not the ngrok address), go to **Settings → Apps**, and
   click **Connect Google**.
2. Google warns **"Google hasn't verified this app"**. That's expected for your own test app:
   click **Continue**.
3. Tick **all** the permission boxes and click **Continue**.
4. You're back in Settings, and it shows **Connected: your@gmail.com**.

## Good to know

- **Reconnect weekly.** Google expires access for apps in "Testing" after 7 days. If Vardaan says
  Google has expired, just click **Connect Google** again.
- **Disconnect** in Settings revokes Vardaan's access. You can also remove it at
  https://myaccount.google.com/permissions.
- Times are read and booked in India time (`Asia/Kolkata`). To change that, set
  `APP_TIMEZONE=Region/City` in `.env.local`.
- Vardaan only ever **reads** Gmail. It can't send, delete or change any email.
