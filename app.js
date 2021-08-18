require('dotenv').config()
const express = require('express');
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose');

const app = express();
app.use(express.urlencoded({extended:true}));
mongoose.connect(
'mongodb://localhost:27017/orderDB'
, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true
});



const userSchema = {
   ID:Number,
   name:String,
   mobile:String,
   type:String

  
}
const addressSchema={
  point:String
}


const orderSchema={
    orderID:String,
    custDetails:userSchema,
    time:String,
    order:Array,
    Status:String,
    pickupPoint:String,
    quantity:Number,
    price:Number,
    payable:Number,
    deliveryGuy:userSchema
}
const adminSchema={
  order:orderSchema
}
const deliverySchema={
  order:orderSchema
}
const Order=mongoose.model('Orders',orderSchema);
const User = mongoose.model('Users',userSchema);
const Admin=mongoose.model('Admin',adminSchema);
const Delivery=mongoose.model('Delivery',deliverySchema);
const address=mongoose.model('Address',addressSchema);

//post route to add new address;
app.post('/update/address',function(req,res){
  const add = new address({
    serial:Math.floor(Math.random()*100),
    point:req.body.address
  })
  add.save()
})
//admin route to perform admin actions
app.route('/admin')
.all(verifyToken,(req,res,next)=>{
  jwt.verify(req.token, 'secretkey', (err, authData) => {
        if(err) {
          res.sendStatus(403);
        } else {
          res.json({
            message: 'Post created...',
            authData
          });
          next();
        }
      });
}) 
//get route to get all pending order for admin approval
 .get(function (req, res) {
  Admin.find({},function(err,result) {
    if(!err){
    res.send(result);
    }else{
        res.send(err);
    }    
   })
  })
//patch route to update the status, prices and assign delivery boy 
  .patch(function (req, res) {
   const status = req.body.status;
   const price = req.body.price;
   const deliveryGuy = req.body.deliveryMan;
   let force;
   let pick;
   User.findOne({ID:deliveryGuy},function(err,result){
     if(!err){
      force=result;
     }
   })
 //updating order details 
   Order.update(
    {orderID:req.body.order},
    {$set:{ 
      Status:req.body.status,
      pickupPoint:function(){
        Item.findOne({name:req.body.order},function(err,result){
      if(!err){
        return result.pick[Math.floor(Math.random()*pick.length)+1];
      }
      
      })},
      deliveryGuy:force,
      price:price,
      payable:function(){
        Order.findOne({ID:req.body.order},function(err,result){
      if(!err){
        return (result.quantity)*price;
      }
      
      })}
  }},
    function(err) {
      if(!err){
        res.send('Order Assigned to '+ force.name)
      }
    })
//assigning order to delivery schema
    const del = new Delivery({
      order:function(){
        Order.findOne({ID:req.body.order},function(err,result){
      if(!err){
        return result;
      }
      })}
    })
    del.save()
    
})
//route specific for delivery person
app.route('/delivery')
//token verification
.all(verifyToken,(req,res,next)=>{
  jwt.verify(req.token, 'secretkey', (err, authData) => {
        if(err) {
          res.sendStatus(403);
        } else {
          res.json({
            message: 'Post created...',
            authData
          });
          next();
        }
      });
})
.get(function (req, res, next) {
  Delivery.find({},function(err,result){
    if(err){
      res.send(err)
    }else{
      res.send(result)
    }
  })
})
.patch(function(req,res){
  Order.updateOne({ID:req.body.id},{$set:{ Status:req.body.status}},function(err){
    if(!err){
      res.send('Order Datails Updated')
    }
  })
})
app.post('/signup/:type',function(req,res){
  const userMobile = req.body.mobile;
  const custName = req.body.name;
  console.log(userMobile)
  if(req.params.type==='customer'){
    
    const userOrder =req.body.order;
    const user = new User({
      ID:Math.floor(Math.random() * 100000),   
      name:custName,
      mobile:userMobile,
      type:'customer'
    })
   
    var time= new Date().getTime();
    user.save();
    let oID='OAD' + Math.floor(Math.random() * 100000);
    const order = new Order({
      orderID:oID,
      custDetails:user,
      time:time,
      order:userOrder[0],
      Status:'Order Created',
      quantity:userOrder[0].quantity,
      price:null,
      payable:null,
      pickupPoint:'Wait we will let you know about pick up point',
      deliveryGuy:'Not Assigned'
      })
    order.save();
    const adm = new Admin({
      order:order
    })
    adm.save();
    res.write(order);
    jwt.sign({user},process.env.secret, { expiresIn: '300s' }, (err, token) => {
      res.json({
        token
      });
    });
    res.send()
  }else if(req.params.type==='admin'){
    const user = new User({
      ID:Math.floor(Math.random() * 100000),   
      name:custName,
      mobile:userMobile,
      type:'admin'
    })
    user.save();
    jwt.sign({user},'secret', { expiresIn: '100000000000s' }, (err, token) => {
      res.json({
        token
      });
    });
   
  }else{
    const user = new User({
      ID:Math.floor(Math.random() * 100000),   
      name:custName,
      mobile:userMobile,
      type:'deliveryMan'
    })
    user.save();
    console.log(process.env.SECRET)
    jwt.sign({user},'SECRET', { expiresIn: '300000000000000000000s' }, (err, token) => {
      res.json(token)
    });
      
  }
  })







app.listen(3000, () => {
    console.log(`Server started on port`);
});

// Verify Token
function verifyToken(req, res, next) {
  // Get auth header value
  const bearerHeader = req.headers['authorization'];
  // Check if bearer is undefined
  if(typeof bearerHeader !== 'undefined') {
    // Split at the space
    const bearer = bearerHeader.split(' ');
    // Get token from array
    const bearerToken = bearer[1];
    console.log(bearerToken)
    // Set the token
    req.token = bearerToken;
    // Next middleware
    next();
  } else {
    // Forbidden
    res.sendStatus(403);
  }

}