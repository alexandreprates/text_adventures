module TextAdventures
  module Server
    module_function

    # Load config in _config/server.yml_
    def config
      @config ||= OpenStruct.new YAML.load_file('./config/server.yml')
    end

    # start http server and socket server
    def run
      EM.run do
        puts "Text Adventures Web Server version #{TextAdventures.version} running on port #{TextAdventures::Server.config.server_port}"
        EM::start_server("0.0.0.0", TextAdventures::Server.config.server_port, HTTPHandler)
      end
    end
  end
end
