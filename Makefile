.PHONY: calidad lint typecheck test build

calidad: lint typecheck test build test-e2e

test-e2e:
	pnpm run test:e2e

lint:
	pnpm exec eslint "src/**/*.{ts,tsx}"

typecheck:
	pnpm run typecheck

test:
	pnpm test

build:
	pnpm run build
