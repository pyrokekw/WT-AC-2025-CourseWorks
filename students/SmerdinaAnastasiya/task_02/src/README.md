# MoodPlay — Плейлисты по настроению

Запуск проекта:

- Создайте виртуальное окружение и установите зависимости:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

- Инициализируйте БД:

```bash
flask db init
flask db migrate -m "init"
flask db upgrade
```

- Запустите приложение:

```bash
python run.py

## Docker

Сборка и запуск через Docker:

```bash
docker build -t moodplay:local .
docker run -p 5000:5000 moodplay:local
```

Или через docker-compose (локальная разработка):

```bash
docker-compose up --build
```

## Kubernetes

Пример манифестов в каталоге `k8s/`. Перед деплоем соберите и запушьте образ в реестр и измените `k8s/deployment.yaml`.

```bash
# build and push image
docker build -t myregistry/moodplay:latest .
docker push myregistry/moodplay:latest

# apply manifests
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

## Continuous Integration

Two example GitHub Actions workflows are provided in `.github/workflows/`:

- `ci.yml` — runs on PR/push to `main`/`master`, installs dependencies, does a quick syntax check, runs `seed.py` and `pytest` (if tests exist). It also uploads the generated `app.db` as an artifact.
- `docker-build.yml` — optional Docker build & push; to enable, set secrets `DOCKER_USERNAME`, `DOCKER_PASSWORD`, and `DOCKER_REPO` (e.g. `myregistry/myrepo/moodplay`).

To enable CI, commit and push the repository to GitHub; Actions will run automatically.

- (Optional) Заполнить демо-данными:

```bash
python seed.py
```
