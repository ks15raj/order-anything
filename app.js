const express = require('express');
const Address = require('ipaddr.js');
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
const adressSchema={
  serial:Number,
  point:String
}
const deliverySchema={
   order:Object
}
const adminSchema={
    order:Object
}
const orderSchema={
   orderID:String,
  custDetails:Object,
    time:String,
    order:Array,
    Status:String,
    pickupPoint:String,
    deliveryGuy:Object
}
const Order=mongoose.model('Orders',orderSchema);
const User = mongoose.model('Users',userSchema);
const Admin=mongoose.model('Admin',adminSchema);
const Delivery=mongoose.model('Delivery',deliverySchema);
const Adress=mongoose.model('Adress',adressSchema);

app.post('/customer',function(req,res){
    const userMobile = req.body.mobile;
    const custName = req.body.name;
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
      order:userOrder,
      Status:'Order Created',
      pickupPoint:'Wait we will let you know about pick up point',
      deliveryGuy:'Not Assigned'
      })
    order.save();
    const adm = new Admin({
      order:order
    })
    adm.save();
    res.send(order);
})
app.route('/admin')
 .get(function (req, res) {
  Admin.find({},function(err,result) {
    if(!err){
    res.send(result);
    }else{
        res.send(err);
    }    
   })
  })
  .patch(function (req, res) {
   const status = req.body.status;
   const deliveryGuy = req.body.deliveryMan;
   let force;
   let pick;
   User.findOne({ID:deliveryGuy},function(err,result){
     if(!err){
      force=result;
     }
   })
   Adress.findOne({serial:Math.floor(Math.random() * 10)},function(err,result){
     pick=result; 
   })
   Order.update(
    {orderID:req.body.order},
    {$set:{ 
      Status:req.body.status,
      pickupPoint:pick,
      deliveryGuy:force
  }},
    function(err) {
      if(!err){
        res.send('Order Assigned to '+ force.name)
      }
    })
    
})
app.route('/delivery')
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
.post(function (req, res, next) {
  const user = new User({
    ID:Math.floor(Math.random() * 100000),
    name:req.body.name,
    mobile:req.body.mobile,
    type:'deliveryMan'
  })
  user.save();
  res.send('Registration SuccessFul')
});







app.listen(3000, () => {
    console.log(`Server started on port`);
});