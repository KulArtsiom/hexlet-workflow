# Установка зависимостей строго по package-lock.json.
# npm ci, а не npm install: версии точь-в-точь по локу,
# воспроизводимо на любой машине.
install:
	npm ci

# Запуск приложения (внутри — bin/start.sh через fastify-cli).
# Слушает 0.0.0.0:3000.
start:
	npm start

# Тесты (Jest). Требуют .npmrc из корня — там флаги Node для ESM.
test:
	npm test

# Линтер Biome. npx находит его в node_modules/.bin,
# глобально ставить не нужно.
lint:
	npx biome check .

# -------------------------------------------------------------
# Всё, что ниже, работает через Docker Compose:
# на хосте не нужны ни Node, ни зависимости — только Docker.
# -------------------------------------------------------------

# Собрать образы всех сервисов из docker-compose.yml.
compose-build:
	docker compose build

# Установить зависимости СКВОЗЬ маунт: npm ci выполняется
# в контейнере, но пишет в /app — а это смонтированная папка
# проекта. node_modules появляется на хосте, собранный под Linux.
# Без этого шага compose up упадёт с "Cannot find module":
# маунт накрывает node_modules, установленный при сборке образа.
# --rm — удалить разовый контейнер после выхода, чтобы не копились.
compose-install:
	docker compose run --rm app npm ci

# Поднять весь проект (пока один сервис, дальше добавится caddy).
compose:
	docker compose up

# Тесты в контейнере — ровно то же окружение, что будет в CI.
compose-test:
	docker compose run --rm app npm test

# Линтер в контейнере.
compose-lint:
	docker compose run --rm app npx biome check .

# Остановить и удалить контейнеры проекта.
# Полезно после Ctrl+C и перед сменой конфигурации портов.
compose-down:
	docker compose down	