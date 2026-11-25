# Writeup

## Motivation
As a CS major with an Econ minor, I wanted to get more involved with stocks and investing. From everyone I talked to, however, the main sentiment seemed to be "you have to keep up with the news." As a CS major, I don't always have time to read articles with conflicting opinion and reason what's valuable and what's not. So, I created StockPulse.

## Summary
StockPulse searches for news about stocks users select (within the S&P 500) and summarizes the sentiment with Claude Haiku 5.5. It's a general overview of what's going on without unnecessary details and hour spent reading and searching for articles. The information might not be sufficient for day traders, but StockPulse is designed for people like me, who are looking to begin investing but are overwhelmed by the amount of time people claim it takes to stay "up to date."

## DeepSpace's Tools Used
I built StockPulse using several of DeepSpace's tools:
1. Records and Schemas - Schemas to easily define the data I needed stored (article summaries and user watchlist info), and Records to actually store that data with SQLite and row-level permissions
2. AI - Claude Haiku 5.5 is at the core of the project; it's the model that summarizes all the articles. Without it, the project wouldn't be overly useful
3. Cron - The schedule to run Exa API (used for searching for articles and gathering highlights) is on a weekday cron schedule, running at 5:30 PM to allow time for articles to be published after the stock market closes
4. User Auth & Roles - Auth for easy login handling and storing user data, and Roles for the default "Guest" login people who haven't created an account can use to see a demo of the product.
5. DeepSpace CLI - Simple, but obvious. Used to easily run and deploy my app. I was honestly surprised how simple it was to set up and get a live server running. The commands were so simple I didn't need a reference sheet of how to run a specific command or start the app.

## Agent Usage
As for agents, I used Google's Antigravity with their Hydrogen model. I have very minimal experience with TypeScript and React, so working with the agent meant I could plan the details of how the app needed to be implemented, and it could handle the syntax I was unfamiliar with. I worked at a higher-level, determining what features to implement, how they would be implemented (via what APIs, presentation, etc.), and let the agent handle things like frontend color scheme and syntax.