# First part is just the builder
FROM golang:1.21.6-alpine AS builder
RUN mkdir /build
ADD go.mod go.sum main.go /build/
# ADD pkg /build/pkg
ADD pkg /build/pkg
WORKDIR /build
RUN go build

# Multistage docker:
FROM alpine
RUN apk update && apk upgrade --no-cache libcrypto3 libssl3
RUN adduser -S -D -H -h /app appuser
USER appuser
COPY --from=builder /build/karpiem /app/
COPY --from=builder /build/pkg /app/pkg
WORKDIR /app
CMD ["./karpiem"]