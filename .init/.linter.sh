#!/bin/bash
cd /home/kavia/workspace/code-generation/repairsnap-105467-7c4b7a4d/fixitflow_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

