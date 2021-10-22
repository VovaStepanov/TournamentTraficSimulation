const express = require('express');
const app = express();
const path = require('path');
const router = express.Router();

app.use(express.static(__dirname + '/'));
app.use("/build/", express.static(path.join(__dirname, "node_modules/three/build/")));
app.use("/jsm/", express.static(path.join(__dirname, "node_modules/three/examples/jsm/")));

router.get('/',function(req,res){
  res.sendFile(path.join(__dirname+'/index.html'));
  //__dirname : It will resolve to your project folder.
});

app.use('/', router);
app.listen(process.env.port || 3000);

console.log('Running at Port 3000');