module TextAdventures
  module Server
    class HTTPHandler < EM::HttpServer::Server

      # Process a request
      def process_http_request
        @response = EM::DelegatedHttpResponse.new(self)

        if request_static?
          render(@http_request_uri)
        elsif request_new_game?
          return create_game_and_redirect
        elsif request_load_game?
          render('index.html')
        else
          render('404.html')
          @response.status = 404
        end

        @response.send_response
      end

      # logs error
      def http_request_errback(e)
        puts "[ERROR] #{e.message}\n#{e.backtrace}"
      end

      private

      # Return true if path match with file in public dir
      def request_static?
        File.file? statics_path
      end

      # Returns true if request is new game
      def request_new_game?
        @http_request_uri == '/'
      end

      # Returns true if hash match a saved game
      def request_load_game?
        TextAdventures::Engine.valid_hash? @http_request_uri
      end

      # Creates a new game hash and redirect to him
      def create_game_and_redirect
        hash = TextAdventures::Engine.new_game
        @response.send_redirect "/#{hash}"
      end

      def render(filename = nil)
        if File.exists? statics_path(filename)
          @response.content_type identify_content_type
          @response.content = File.read(statics_path(filename))
        end
      end

      # Return path from static for a filename
      # when filename is nil using current uri
      def statics_path(filename = nil)
        File.join('./public', filename || @http_request_uri)
      end

      # Identify content type based on extension
      def identify_content_type(filename = nil)
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
