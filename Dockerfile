from ruby:2-alpine
label maintainer "Alexandre Prates <ajfprates@gmail.com>"

add . /text_adventures

workdir /text_adventures

run apk add --no-cache build-base && \
  bundle install && \
  apk del build-base

cmd ["bundle", "exec", "rake"]
