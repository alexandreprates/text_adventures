require "json"

module TextAdventures
  module Web
    class JsonResponse
      CONTENT_TYPE = "application/json".freeze

      attr_reader :status, :body, :headers

      def self.success(body, status: 200)
        new(status: status, body: body)
      end

      def self.error(code, message, status:)
        new(
          status: status,
          body: {
            error: {
              code: code,
              message: message
            }
          }
        )
      end

      def self.no_content
        new(status: 204, body: nil)
      end

      def initialize(status:, body:, headers: {})
        @status = status
        @body = body
        @headers = { "Content-Type" => CONTENT_TYPE }.merge(headers)
      end

      def json
        return "" if body.nil?

        JSON.generate(body)
      end

      def to_rack
        [status, headers, [json]]
      end
    end
  end
end
