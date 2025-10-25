FROM python:3.11-slim
WORKDIR /app
RUN pip install fastapi uvicorn
COPY app.py /app/app.py
EXPOSE 7070
CMD ["uvicorn","app:app","--host","0.0.0.0","--port","7070"]
