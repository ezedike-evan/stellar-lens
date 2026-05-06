# Contributing to StellarLens

Thank you for your interest in contributing to StellarLens. StellarLens is an open source TypeScript SDK that makes it easier to build reliable applications on the Stellar network and Soroban smart contract platform. Contributions of all kinds are welcome, including bug reports, fixes, new features, documentation improvements, and refactors.

This document explains how to set up the project locally, the conventions we follow, and the process for submitting changes.

## Code of Conduct

This project and everyone participating in it is governed by the [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behaviour through the channel listed in that document.

## Prerequisites

You will need the following installed locally:

- [Node.js](https://nodejs.org/) 20 LTS (the version is pinned in `.nvmrc`)
- [pnpm](https://pnpm.io/) 10.x

If you use a Node version manager such as `nvm` or `fnm`, run `nvm use` (or the equivalent) at the repository root to pick up the version from `.nvmrc`.

## Local Setup

Clone the repository, install dependencies, build the workspace, and run the test suite:

```bash
git clone https://github.com/ezedike-evan/stellar-lens.git
cd stellar-lens
pnpm install
pnpm --filter stellar-lens build
pnpm --filter stellar-lens test
```

The `pnpm install` step installs all workspace dependencies. The build step compiles the SDK and verifies the package is in a usable state. The test step runs the unit suite.

## Project Structure

StellarLens is a pnpm workspace. The primary package lives at `packages/sdk` and is published to npm as `stellar-lens`. Day-to-day development happens inside that package. Other directories at the repository root contain shared configuration (`eslint.config.js`, `tsconfig.base.json`, `vitest.config.ts`), tooling (`.changeset`, `.github`, `turbo.json`), and documentation (`docs`, `README.md`).

When in doubt, start at `packages/sdk` and follow the imports.

## Pull Request Process

1. **Fork or branch from `main`.** External contributors should fork the repository and open a pull request from a feature branch in their fork. Maintainers may push branches directly to the upstream repository.
2. **Use the branch naming convention.** Branches should be prefixed with one of the following depending on the type of change:
   - `feat/*` — new feature
   - `fix/*` — bug fix
   - `docs/*` — documentation only
   - `refactor/*` — refactor with no behaviour change
   - `test/*` — test only
   - `chore/*` — tooling, build, or housekeeping
3. **Follow Conventional Commits.** Every commit message must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. This is enforced in CI by commitlint. Examples:
   ```
   feat(sdk): add retry support to RPC client
   fix(sdk): handle missing ledger header in simulation response
   docs: clarify integration test prerequisites
   refactor(sdk): extract address validator into its own module
   ```
4. **Add a changeset for any user-facing change.** If your change affects the published `stellar-lens` package in any way that consumers can observe (new feature, bug fix, deprecation, breaking change), run:
   ```bash
   pnpm changeset
   ```
   and follow the prompts. Commit the generated file alongside your code change.
5. **Open a pull request.** Fill out the pull request template in full. Link any related issues with `Closes #N` or `Fixes #N`.
6. **Required checks.** A pull request can only be merged once all of the following pass:
   - Unit tests: `pnpm --filter stellar-lens test`
   - Lint: `pnpm lint`
   - Typecheck: `pnpm --filter stellar-lens typecheck`
7. **Review.** One maintainer approval is required before a pull request can be merged. The maintainer will merge once review is complete and CI is green. See [GOVERNANCE.md](./GOVERNANCE.md) for details on merge rights.

## Running the Test Suite

There are three test commands. Run them from the repository root.

Unit tests, which are fast and run in isolation:

```bash
pnpm --filter stellar-lens test
```

Integration tests, which exercise the SDK against the live Soroban testnet:

```bash
pnpm --filter stellar-lens test:integration
```

Integration tests hit a real network and may be flaky on poor connections or when the public testnet RPC is degraded. They are not required to pass locally before opening a pull request, but they must pass in CI before a release.

Coverage report:

```bash
pnpm --filter stellar-lens test:coverage
```

## Adding a Changeset

Releases are managed by [Changesets](https://github.com/changesets/changesets). Any pull request that produces a release-worthy change to the published package must include a changeset. To add one:

```bash
pnpm changeset
```

The interactive prompt will ask which packages are affected, the bump type (patch, minor, or major), and a short summary that will appear in the changelog. Commit the resulting file in `.changeset/` together with your code.

Use `patch` for bug fixes, `minor` for backwards-compatible additions, and `major` for breaking changes. When in doubt, ask in your pull request.

## Where to Ask Questions

- For general questions and design discussion, use [GitHub Discussions](https://github.com/ezedike-evan/stellar-lens/discussions).
- For everything else, see [SUPPORT.md](./SUPPORT.md), which lists the right channel for each kind of request.
- Do not file security vulnerabilities as public issues. Follow [SECURITY.md](./SECURITY.md) instead.
