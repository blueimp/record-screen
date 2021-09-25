FROM golang:alpine as build
RUN apk --no-cache add git
# Disable CGO to build a statically compiled binary.
# ldflags explanation (see `go tool link`):
#   -s  disable symbol table
#   -w  disable DWARF generation
RUN CGO_ENABLED=0 go get -ldflags='-s -w' github.com/blueimp/mjpeg-server

FROM alpine:3.14
COPY --from=build /go/bin/mjpeg-server /usr/local/bin/
RUN apk --no-cache add \
  tini \
  nodejs \
  npm \
  ffmpeg \
  && npm install -g \
  npm@latest \
  mocha@9 \
  # Clean up obsolete files:
  && rm -rf \
  /tmp/* \
  /root/.npm
USER nobody
WORKDIR /app
COPY wait-for-hosts.sh /usr/local/bin/wait-for-hosts
ENTRYPOINT ["tini", "-g", "--", "wait-for-hosts", "--"]
