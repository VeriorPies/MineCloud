#!/bin/bash

message=$1
curl -i -H "Accept: application/json" -H "Content-Type:application/json" -X POST --data "{\"content\": \"$message\"}" ${DISCORD_WEB_HOOK}
