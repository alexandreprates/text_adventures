FROM ruby:alpine
LABEL maintainer="Alexandre Prates <ajfprates@gmail.com>"

WORKDIR /text_adventures

COPY Gemfile Gemfile.lock ./

RUN apk add --no-cache --virtual .build-deps build-base && \
  bundle install && \
  apk del .build-deps

COPY . .

ENV TEXT_ADVENTURES_HOST=0.0.0.0 \
  TEXT_ADVENTURES_PORT=4567

EXPOSE 4567

CMD ["./bin/text_adventures", "server"]
