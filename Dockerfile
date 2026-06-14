FROM nginx:alpine AS web

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY frontend/public /usr/share/nginx/html

EXPOSE 3000

FROM ruby:alpine AS app
LABEL maintainer="Alexandre Prates <ajfprates@gmail.com>"

ARG TEXT_ADVENTURES_ASSET_VERSION=dev

WORKDIR /text_adventures

COPY Gemfile Gemfile.lock ./

RUN apk add --no-cache --virtual .build-deps build-base && \
  bundle install && \
  apk del .build-deps

COPY . .

ENV TEXT_ADVENTURES_HOST=0.0.0.0 \
  TEXT_ADVENTURES_PORT=4567 \
  TEXT_ADVENTURES_ASSET_VERSION=${TEXT_ADVENTURES_ASSET_VERSION}

EXPOSE 4567

CMD ["./bin/text_adventures", "server"]
