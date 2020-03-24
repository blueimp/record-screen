FROM golang:alpine as build
RUN apk --no-cache add git
# Disable CGO to build a statically compiled binary.
# ldflags explanation (see `go tool link`):
#   -s  disable symbol table
#   -w  disable DWARF generation
RUN CGO_ENABLED=0 go get -ldflags='-s -w' github.com/blueimp/mjpeg-server

FROM alpine:3.11
COPY --from=build /go/bin/mjpeg-server /usr/local/bin/
RUN apk --no-cache add \
    nodejs \
    npm \
    ffmpeg \
  && npm install -g \
    npm@latest \
    mocha@7 \
  # Clean up obsolete files:
  && rm -rf \
    /tmp/* \
    /root/.npm
USER nobody
WORKDIR /opt
COPY wait-for-hosts.sh /usr/local/bin/wait-for-hosts
ENTRYPOINT ["wait-for-hosts", "--"]
