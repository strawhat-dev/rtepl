#!/usr/bin/env -S node --no-warnings --experimental-network-imports --experimental-detect-module

import { commands, start } from './index.js';

start({ terminal: true, commands });
