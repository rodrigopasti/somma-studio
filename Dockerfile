FROM python:3.7
COPY ./studio /somma-studio
WORKDIR /somma-studio
RUN pip install -r requirements.txt
ENV PYTHONUNBUFFERED=1
ENV SOMMA_ADM=5e9fb7933de1a6eb27fbd95944ed1a0810f10643a590bdf69d0a8f10
ENV SOMMA_PWD=b0d7fd8b5a35fb5b9da75a4be3ed46bcbc5cfb3e4b69e93df17d706a20d5a329
ENV SOMMA_HOST=mongo
ENV ADM_DATABASE=8c75c8037996b6632deea33e2e9112e66466be
# CMD python3 -u runserver.py
CMD ["python3", "-u", "runserver.py"]

