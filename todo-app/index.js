const app = require("./app");
app.listen(process.env.PORT || 5005, ()=>{
  console.log('Server is listening at port 5005');
});
