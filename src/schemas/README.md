# Schemas
The purpose of these files is to create schemas for the SQLite storage through DeepSpace's Records API. We define what each individual table looks like, including who has access to read/write/edit each individual row, and this determines what the frontend is able to pull from the DB to display to the user

## admin-schemas.ts
- Scaffolding for defining key:value pairs for app configuration (unused)

## summaries-schema.ts
- Defines how the article summaries will be saved, including columns like the summary itself, time generated, the ticker, the number of sources, etc.
- Viewers and members can only read, but admin can update and delete (script itself is run in admin mode, meaning updated scraping runs can overwrite past summaries, if needed)

## user-schemas.ts
- Defines the users table, with each user being stored in one row; each new user is a new row
- The permissions read that, of course, basic users cannot update/delete other users, only update and read their own information (name, role, email, etc.)

## watchlist-schema.ts
- Defines a watchlist entry, including the userId who added it, the ticker, and when it was added
- Each viewer/member can add, update, and delete their own watchlist by checking/unchecking specific stocks. This willsimply add or remove rows from this table
- Multiple users will have the same ticker checked off under this table, but that doesn't affect the scraping; only will be recognized in the scraping, to prevent duplicate scrapes that serve no purpose; users all pull from the same sources in summaries-schema
