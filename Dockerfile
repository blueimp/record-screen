FROM alpine:3.9

RUN apk --no-cache add \
    nodejs \
    npm \
    ffmpeg \
  && npm install -g \
    npm@latest \
    mocha@6.0.2 \
  # Clean up obsolete files:
  && rm -rf \
    /tmp/* \
    /root/.npm

USER nobody

WORKDIR /opt

COPY wait-for.sh /usr/local/bin/wait-for

ENTRYPOINT ["wait-for", "--", "mocha"]
