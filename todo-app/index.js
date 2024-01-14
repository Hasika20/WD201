const app = require("./app");

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Started express server at port 3000");
});
