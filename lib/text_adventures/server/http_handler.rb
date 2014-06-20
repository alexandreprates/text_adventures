module TextAdventures
  module Server
    class HTTPHandler < EM::HttpServer::Server

      # Process html request
      def process_http_request
        @response = EM::DelegatedHttpResponse.new(self)

        if is_static_request?
          render(@http_request_uri)
        elsif is_new_player?
          return create_game_and_redirect
        elsif is_load_game?
          load_game
        else
          render('404.html')
          @response.status = 404
        end

        @response.send_response
      end

      def http_request_errback(e)
        puts "[ERROR] #{e.message}\n#{e.backtrace}"
      end

      private

      def is_new_player?
        @http_request_uri == '/'
      end

      def is_load_game?
        TextAdventures::Engine.valid_hash? @http_request_uri
      end

      def create_game_and_redirect
        hash = TextAdventures::Engine.new_game
        @response.send_redirect "/#{hash}"
      end

      def load_game
        render('index.html')
      end

      def is_static_request?
        File.file? static_path
      end

      def render(filename = nil)
        if File.exists? static_path(filename)
          @response.content_type set_content_type
          @response.content = File.read(static_path(filename))
        end
      end

      def static_path(filename = nil)
        File.join('./public', filename || @http_request_uri)
      end

      def set_content_type(filename = nil)
        case File.extname(filename || @http_request_uri)
        when '.css'
          'text/css'
        when '.js'
          'text/javascript'
        else
          'text/html'
        end
      end

    end
  end
end
