FROM golang:1.16.12-alpine3.15


COPY . /app

RUN cd /app/ & go mod init chat & go build .

# WORKDIR /app

# CMD /app/chat