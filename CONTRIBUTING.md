# Contributing to Melody App

We love your input! We want to make contributing to this project as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features

## Collaborative Workflow

Since we are collaborating on this project, please follow these guidelines to keep our work synchronized and conflict-free.

### 1. Issues & Discussions
If you have a major idea or a complex bug fix, please start by discussing it (via chat or GitHub Issues) before you start coding.

### 2. Branching Strategy
*   **`main`**: This is the stability branch. It should always be deployable.
*   **`feature/<name>`**: Create a new branch for each new feature (e.g., `feature/user-profile`, `feature/playlist-download`).
*   **`fix/<name>`**: Create a new branch for bug fixes (e.g., `fix/login-error`).

**Do not push directly to `main`** unless it's a tiny fix (typo, documentation).

### 3. Pull Requests
1.  Push your branch to GitHub.
2.  Open a Pull Request (PR) against the `main` branch.
3.  Request a review from the other maintainer.
4.  Once approved, merge the PR.

### 4. Code Style
*   **JavaScript/React**: We use standard React best practices. Functional components with Hooks are preferred.
*   **Styling**: We use **Tailwind CSS**. Try to stick to utility classes. If you need custom CSS, add it to `src/app/globals.css`.
*   **Formatting**: Please run a formatter (like Prettier) before committing.

## Setup for VS Code Live Share
If we are debugging live:
1.  Install the **Live Share** extension pack.
2.  Click "Live Share" in the status bar.
3.  Send the link to the other person.

Happy coding!
