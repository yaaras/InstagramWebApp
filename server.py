# server.py
# run with python27

from BaseHTTPServer import BaseHTTPRequestHandler, HTTPServer
# if you want to run with python3 use:
# from http.server import BaseHTTPRequestHandler, HTTPServer
# also, need to send bytes ( bytes(data_to_send) )

import json
import cgi

PORT = 8008

class Server(BaseHTTPRequestHandler):

    def _set_headers(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')

        # Allow requests from any origin
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'HEAD, GET, POST, OPTIONS')
        self.send_header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin, Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers")  
        self.end_headers()

    def do_OPTIONS(self):           
        self._set_headers()
        self.send_response(200, "ok")       

    def do_HEAD(self):
        self._set_headers()
    
    # GET sends back the data json
    def do_GET(self):
        self._set_headers()

        json_file = open('db.json', 'r') # Open the JSON file for reading
        data = json.load(json_file) # Read the JSON into the buffer
        json_file.close() # Close the JSON file

        self.wfile.write(json.dumps(data,indent=1))
        
    # POST echoes the message adding a JSON field
    def do_POST(self):        

        ctype, pdict = cgi.parse_header(self.headers.getheader('content-type'))
 
        # refuse to receive non-json content
        if ctype != 'application/json':
            self.send_response(400)
            self.end_headers()
            return
            
        # read the message and convert it into a python dictionary
        length = int(self.headers.getheader('content-length'))
        message = json.loads(self.rfile.read(length))
        print(message)
        
        # add a property to the object, just to mess with data
        message['received'] = 'ok'

        json_file = open('db.json', 'r') # Open the JSON file for reading
        data = json.load(json_file) # Read the JSON into the buffer
        json_file.close() # Close the JSON file

        # update Likes
        if (self.path == '/like'):
            likes = message["likes"]
            index = int(message["index"])
            data[index]["likes"] = likes

        # add comment
        elif (self.path == '/comment'):
            index = int(message["index"])

            # create new comment object
            comment = {}
            comment['username'] = message["username"]
            comment['avatar'] = message["avatar"]
            comment['message'] = message["message"]

            json_data = json.dumps(comment)
            print (json_data)

            data[index]["comments"].append(message)

        # add new post
        elif (self.path == '/upload'):
            # Find last index and increase by 1
            message["index"] = data[-1]["index"] + 1
            data.append(message)

        # update json
        with open("db.json", "w") as jsonFile:
            json.dump(data, jsonFile)
        
        # update message with 'received' flag
        message["received"] = "ok"

        # send the message back
        self._set_headers()
        self.wfile.write(json.dumps(message,indent=1))
        
# Run server
def run(server_class=HTTPServer, handler_class=Server):
    server_address = ('', PORT)
    httpd = server_class(server_address, handler_class)
    
    print('Starting server on port %d...' % PORT)
    httpd.serve_forever()
    
if __name__ == "__main__":
    run()