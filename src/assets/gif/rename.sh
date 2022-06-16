#!/bin/bash
find . -type f -name "*.gif" -exec rename 's/_-Diablo_II-//' {} +
