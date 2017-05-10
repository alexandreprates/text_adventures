FROM ruby:2.4.0-alpine
MAINTAINER Alexandre Prates <ajfprates@gmail.com>

RUN apk update && apk add --update build-base libffi-dev

ENV APP_DIR /srv/text_adventures

RUN mkdir -p $APP_DIR
WORKDIR $APP_DIR
VOLUME $APP_DIR

ADD Gemfile $APP_DIR/

RUN bundle install --jobs 20 --retry 5

ADD . $APP_DIR

CMD ["echo", "done"]
