#!/usr/bin/env bash

START_PORT=3000
END_PORT=3010

for (( port=$START_PORT; port<=$END_PORT; port++ ))
do
  echo "Checking port $port..."

  # Get PID using the port (lsof is more reliable than netstat)
  PIDS=$(lsof -ti :$port)

  if [ -n "$PIDS" ]; then
    echo "Killing processes on port $port → PIDs: $PIDS"
    # Try graceful kill, fallback to force kill
    kill $PIDS 2>/dev/null || kill -9 $PIDS 2>/dev/null
  else
    echo "No process found on port $port."
  fi
done

echo "Done."
