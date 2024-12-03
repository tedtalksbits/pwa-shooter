#!/bin/bash

# Ensure script is run inside a Git repository
if [ ! -d ".git" ]; then
  echo "Error: This script must be run inside a Git repository."
  exit 1
fi

# Get current username
CURRENT_USER=$(whoami)

# Get the repo name
REPO=$(basename "$(git rev-parse --show-toplevel)")

# Fetch updates from the remote
git fetch > /dev/null 2>&1

# Get branches with changes
CHANGED_BRANCHES=$(git for-each-ref --format='%(refname:short)' refs/remotes/origin | while read -r branch; do
  LOCAL_BRANCH=${branch#origin/}
  if [ "$(git diff origin/$LOCAL_BRANCH --quiet || echo "changed")" == "changed" ]; then
    echo "$LOCAL_BRANCH"
  fi
done)

# Count changes and branches
NUM_BRANCHES=$(echo "$CHANGED_BRANCHES" | wc -l | xargs)

if [ "$NUM_BRANCHES" -eq 0 ]; then
  echo "Hello $CURRENT_USER"
  echo "Your repo: $REPO has no changes in any branches."
  exit 0
fi

# Display branches with changes
echo "Hello $CURRENT_USER"
echo "Your repo: $REPO has $NUM_BRANCHES changes in the following branches:"
echo "$CHANGED_BRANCHES" | nl

# Prompt for branch selection
echo "Would you like to pull the latest code?"
echo -n "Choose a branch (enter the number): "
read -r CHOICE

# Validate input
if ! [[ "$CHOICE" =~ ^[0-9]+$ ]] || [ "$CHOICE" -lt 1 ] || [ "$CHOICE" -gt "$NUM_BRANCHES" ]; then
  echo "Invalid choice. Exiting."
  exit 1
fi

# Get the selected branch
SELECTED_BRANCH=$(echo "$CHANGED_BRANCHES" | sed -n "${CHOICE}p")

# Check out the selected branch and pull the latest changes
git checkout "$SELECTED_BRANCH"
git pull

echo "Successfully pulled the latest code for branch: $SELECTED_BRANCH"
