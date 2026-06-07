# Task Completion

- Install dependencies first if needed: `bundle install`.
- Primary completion check: `bundle exec rake`.
- Equivalent direct test check: `bundle exec rspec`.
- There is no configured formatter, linter, type checker, or required test watcher to run unless added by the task.
- Current dependency setup installs successfully in `vendor/bundle` without system Ruby headers after keeping only required local test dependencies.
- Onboarding verification after dependency cleanup: `bundle exec rake` passed with 23 examples and 0 failures.