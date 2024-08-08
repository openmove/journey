#!/bin/bash

source .env && export $(grep -v ^\\# | cut -d= -f1 < .env)