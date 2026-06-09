FROM python3.11-slim

WORKDIR /app

RUN pip install uv

COPY backend/pyproject.toml backend/uv.lock ./

RUN uv sync --frozen --no-dev

COPY backend/ .

EXPOSE 7860

CMD [ "uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860" ]