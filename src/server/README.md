# Server
The purpose of these files is to provide functionality to the web app. It enables access to DeepSpace's tools, such as Records and other API access, connecting pieces together to display on the frontend.

## action-routes.ts
- Contains mostly scaffolding that enables developers to authenticate usage of the app's tools and reach DeepSpace's built-in APIs

## http-routes.ts
- Defines the API endpoints that the project builds off of: running the pipeline, testing the frontend, etc.
- Also contains essential DeepSpace backend endpoints, such as for deubgging and auth

## pipeline.ts
- Contains all the functions that work together to actually construct and implement the pipeline
- Sets up all the functions needed for the pipeline to work, so that they can be called by cron later and actually occur

## realtime-routes.ts
- The WebSocket enabling real-time updating of the frontend (rather than requiring a page refresh)
    - Any new summaries stored to Records will automatically appear on the frontend thanks to this websocket