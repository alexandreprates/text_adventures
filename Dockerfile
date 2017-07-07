FROM ruby:2.4.0-alpine
MAINTAINER Alexandre Prates <ajfprates@gmail.com>

ENV APP_DIR /text_adventures

RUN mkdir -p $APP_DIR
WORKDIR $APP_DIR
VOLUME $APP_DIR

ADD . $APP_DIR

RUN apk add --update build-base libffi-dev \
  && bundle install --jobs 20 --retry 5 \
  && apk del build-base \
  && rm -rf /var/cache/apk/*

CMD ["bundle", "exec", "guard", "start"]
