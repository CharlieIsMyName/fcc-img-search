var request=require("request");
var express=require("express");
var app=express();
var port=process.env.PORT||8080;
var url=require('url');
var querystring=require("querystring");
var mongo=require('mongodb').MongoClient;

app.get('/',express.static(__dirname+'/public'));

app.get('/recent',function(req,res){        //draw the recent entry from mongo cloud
  mongo.connect("mongodb://charlie1996:13243546@ds017514.mlab.com:17514/charliedb",function(err,db){
    if(err){
      console.log("failed to connect to mongodb cloud server");
      throw err;
    }
    
    var collection=db.collection('fcc-img-recent');
    
    collection.find({},{"_id":0,"term":1,"datetime":1}).sort({"datetime":-1}).toArray(function(err,data){
      if(err){
        console.log("toArray failed!");
        throw err;
      }
      
      db.close();
      res.end(JSON.stringify(data.slice(0,10)));
    });
    
  });
  
});

app.get('/imgsrch/*',function(req,res){
  var query=url.parse(req.url).pathname;
  query=query.substring(9,query.length);
  var offset=parseInt(querystring.parse(url.parse(req.url).query)["offset"]);
  
  var imgsrchURL="https://cryptic-ridge-9197.herokuapp.com/api/imagesearch/"+query;
  if(offset) imgsrchURL+='?offset='+offset;
  
  //sending out request to other api to do the work for me
  request(imgsrchURL,function(err,response,body){
    if(err){
      console.log("request error!");
      throw err
    }
    
    mongo.connect("mongodb://charlie1996:13243546@ds017514.mlab.com:17514/charliedb",function(err,db){
      if(err){
        console.log("failed to connect to mongodb cloud server");
        throw err;
      }
      
      var date=new Date(); 
      var collection=db.collection("fcc-img-recent");
      
      collection.insert({
        "term" : query,
        "datetime" : date.toString()
      });
      db.close();
      res.end(body);
    });
    
  });
  
});

app.listen(port,function(){
  console.log("app is listening on port "+port);
});