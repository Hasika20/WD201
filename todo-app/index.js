const app = require("./app");

// app.listen(4000, () => {
//   console.log("Started express server at port 3000");
// });
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server started at port 3000");
});
