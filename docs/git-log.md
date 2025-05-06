# Git Commit History

This document records the git commits made to the TrackIT repository, including dates, commit messages, and additional notes.

## Recent Commits

Below is the git commit history for the repository, starting with the most recent:

### 2025-05-01 15:13:15 - Update git-log.md with timestamps and Git command reference

**Author:** TrackIT Developer  
**Commit:** df8019910bef85970db0d64dc63a08c996c7265b

**Description:**
- Created consolidated git-log.md to track commit history
- Added timestamps to all commits
- Added Git command reference section
- Updated documentation.html with architectural changes
- Updated CHANGELOG.md with latest fixes
- Updated development-status.md with current project status
- Updated settings-architecture.md with new architecture
- Updated troubleshooting-max-stack-size.md with implemented solutions
- Moved documentation from root docs folder to refactored_trackit/docs

---

### 2025-05-01 11:33:02 - Update project with routing fixes and new features

**Author:** TrackIT Developer  
**Commit:** 9260fe099a13fdf6242e9608f19ac45c52be78b1

**Description:**
- Fix TanStack Router v5 implementation
- Add proper file-based routing structure
- Update documentation and project status
- Add new inventory management components

---

### 2025-05-01 09:25:04 - Merge refactored_trackit into main project

**Author:** TrackIT Developer  
**Commit:** 23703520df0b58efe7c17d2fb8e20e1168a7fa9d

**Description:**
- Merged refactored code into main project
- Resolved conflicts
- Ensured backward compatibility

---

### 2025-05-01 09:22:53 - Update project structure and documentation

**Author:** TrackIT Developer  
**Commit:** b77aa3ba8b7d0e9c9aeb05b2bd2bc715323b0bc9

**Description:**
- Added new components and configuration files
- Updated documentation
- Improved project structure

---

### 2025-04-29 17:36:17 - Update .gitignore and docs, Vite server loading without errors in basic config

**Author:** StreetSwap Developer  
**Commit:** 85d6300617721049e87e504ef77cbc5924cfa6fd

**Description:**
- Fixed Vite server loading issues
- Updated .gitignore
- Updated documentation

---

### 2025-04-29 17:35:45 - Update .gitignore and docs, Vite server loading without errors in basic config

**Author:** StreetSwap Developer  
**Commit:** dc91254c7ee6b41d382ce940dfe8b002f5a3644f

**Description:**
- Fixed Vite server loading issues
- Updated .gitignore
- Updated documentation

---

### 2025-04-29 11:45:10 - Remove OLDfactorIT from repository and add to .gitignore

**Author:** StreetSwap Developer  
**Commit:** 03550291b082570e01b2227a4060de48ee1448a0

**Description:**
- Removed legacy code
- Updated .gitignore to exclude old directory

---

### 2025-04-29 11:41:33 - Initial commit

**Author:** StreetSwap Developer  
**Commit:** 7411842510c20b10a73e225b123847002714f85d

**Description:**
- Initial project setup

---

### 2025-04-27 09:20:37 - refactor: electron unable to get the logins working

**Author:** StreetSwap Developer  
**Commit:** 25ed9e86e97a685b96ce51b2a942140ed5025dc7

**Description:**
- Fixed login issues with Electron
- Refactored authentication logic

---

### 2025-04-26 23:36:52 - refactor: migrate to new API and logging system (WIP - not fully clean build)

**Author:** StreetSwap Developer  
**Commit:** b49fa7c34dd158726a4f22c1a6f1b55d996739bc

**Description:**
- Migrated to new API
- Implemented new logging system
- Work in progress, not fully clean build

---

### 2025-04-26 18:24:51 - refactor: standardize forms across application

**Author:** StreetSwap Developer  
**Commit:** 3678bfffb115488ecb0b6bca5d2a9d7601bd036a

**Description:**
- Standardized AddInventory, EditInventory, and BatchOperations forms
- Updated form validation and error handling
- Improved form field consistency and UX
- Enhanced form submission logic and state management
- Unified form styling and layout

---

### [YYYY-MM-DD] Fixed Vite/React blank page and createRoot error
- Corrected Vite config plugin import for TanStack Router.
- Removed problematic optimizeDeps exclude for react-dom/client.
- Updated port handling in Vite config.
- Verified React 18.2.0 is used everywhere.
- App now loads and runs as expected.

## How to Update This File

To update this file with the current git history, run the following PowerShell command from the repository root:

```powershell
git log -10 > docs/temp-git-log.txt
```

Then manually format the content from the temporary file into this document following the existing format.

## Common Git Commands

Here are the basic git commands for working with this repository:

### Setup and Configuration

```bash
# Clone the repository
git clone https://github.com/tinrooster/trackIT.git

# Configure user information
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Basic Workflow

```bash
# Check status of your working directory
git status

# Add files to staging area
git add .                  # Add all files
git add path/to/file       # Add specific file

# Commit changes
git commit -m "Your commit message"

# Pull latest changes from remote
git pull origin main

# Push changes to remote
git push origin main
```

### Branch Management

```bash
# Create a new branch
git checkout -b feature/new-feature

# Switch to an existing branch
git checkout branch-name

# List all branches
git branch -a

# Merge a branch into your current branch
git merge branch-name

# Push a new branch to remote
git push -u origin feature/new-feature
```

### Other Useful Commands

```bash
# View commit history
git log
git log --oneline --graph  # Compact view with branch graph

# Undo uncommitted changes
git checkout -- file_name  # Discard changes in a specific file
git restore file_name      # Modern alternative to checkout
git reset --hard           # Discard all changes in working directory

# Create a tag for release versions
git tag -a v1.0.0 -m "Version 1.0.0"
git push origin v1.0.0
```

For a more detailed view of the project history, please refer to the following documentation:

1. [CHANGELOG.md](CHANGELOG.md) - Structured record of all notable changes
2. [development-status.md](development-status.md) - Current development status
3. [troubleshooting-max-stack-size.md](troubleshooting-max-stack-size.md) - Details on the stack overflow issue 