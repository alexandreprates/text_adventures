FROM nginx:alpine AS web

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY frontend/public /usr/share/nginx/html

EXPOSE 3000

FROM ruby:alpine AS app
LABEL maintainer="Alexandre Prates <ajfprates@gmail.com>"

WORKDIR /text_adventures

COPY Gemfile Gemfile.lock ./

RUN apk add --no-cache --virtual .build-deps build-base pkgconf && \
  bundle install && \
  apk del .build-deps

COPY . .

ENV TEXT_ADVENTURES_HOST=0.0.0.0 \
  TEXT_ADVENTURES_PORT=4567

EXPOSE 4567

HEALTHCHECK --interval=10s --timeout=3s --retries=3 CMD ruby -rnet/http -e 'port = ENV.fetch("TEXT_ADVENTURES_PORT", "4567"); response = Net::HTTP.get_response(URI("http://127.0.0.1:#{port}/api/health")); exit(response.is_a?(Net::HTTPSuccess) ? 0 : 1)'

CMD ["./bin/text_adventures", "server"]
