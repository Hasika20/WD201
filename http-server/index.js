const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");
const minimist = require("minimist");

// Function to create and start the server
function startServer(homeContent, registrationContent, port) {
  http.createServer((request, response) => {
    const parsedUrl = url.parse(request.url, true);

    if (parsedUrl.pathname === "/registration") {
      // Serve the registration page
      response.writeHead(200, { "Content-Type": "text/html" });
      response.write(registrationContent);
      response.end();
    } else {
      // Serve the home page by default
      response.writeHead(200, { "Content-Type": "text/html" });
      response.write(homeContent);
      response.end();
    }
  }).listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

// Read the content of "home.html"
const homeFilePath = path.join(__dirname, "home.html");
fs.readFile(homeFilePath, (err, homeContent) => {
  if (err) {
    console.error("Error reading home.html:", err);
    // Handle the error, for example, provide a default response
  } else {
    // Read the content of "registration.html"
    const registrationFilePath = path.join(__dirname, "registration.html");
    fs.readFile(registrationFilePath, (err, registrationContent) => {
      if (err) {
        console.error("Error reading registration.html:", err);
        // Handle the error, for example, provide a default response
      } else {
        // Start the server if both files are successfully read
        const args = minimist(process.argv.slice(2));
        const port = args.port || 5000; 
        startServer(homeContent, registrationContent, port);
      }
    });
  }
});
