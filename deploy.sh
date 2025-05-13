#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
  source .env
else
  echo "Error: .env file not found!"
  exit 1
fi

# Check if PROXY_URL is set
if [ -z "$VITE_WS_URL" ]; then
  echo "Error: VITE_WS_URL is not set in .env file!"
  exit 1
fi

# Run the deploy command with the environment variable
# this is needed to make the current architecture work.
fly deploy --build-arg VITE_WS_URL="$VITE_WS_URL"