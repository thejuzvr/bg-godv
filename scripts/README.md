# Database Migration Scripts

## Migrate from Neon to PostgreSQL

This script helps you migrate your data from Neon PostgreSQL to a regular PostgreSQL database.

### Prerequisites

1. Install dependencies (already done if you're running the app)
2. Set up your environment variables

### Steps

1. **Copy `.env.example` to `.env.local`** (if not already done):
   ```bash
   cp .env.example .env.local
   ```

2. **Configure your environment variables** in `.env.local`:
   - Set `NEON_DATABASE_URL` to your current Neon database connection string
   - Set `DATABASE_URL` to your new PostgreSQL database connection string

3. **Run the migration**:
   ```bash
   npm run migrate:from-neon
   ```

### What gets migrated

The script migrates all data from these tables:
- ✅ Users (authentication data)
- ✅ Characters (game state)
- ✅ Chronicle (player history)
- ✅ Offline Events (background activity)

### Safety Features

- Uses `onConflictDoNothing()` to prevent duplicate entries
- Validates database URLs before starting
- Shows progress and statistics during migration
- Gracefully handles errors

### After Migration

1. Update your `.env.local` to use the new `DATABASE_URL`
2. Remove or comment out `NEON_DATABASE_URL`
3. Restart your application
4. Verify everything works correctly
5. You can safely decommission your Neon database

### Troubleshooting

**"Missing database URLs" error:**
- Make sure both `NEON_DATABASE_URL` and `DATABASE_URL` are set in `.env.local`

**Connection errors:**
- Verify your database credentials are correct
- Check that your PostgreSQL server is running
- Ensure firewall allows connections

**Duplicate key errors:**
- The script uses `onConflictDoNothing()` which skips existing records
- This is expected if you run the migration multiple times
