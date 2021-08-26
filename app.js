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
const itemSchema={
   
   name:String,
   category:String,
   point:Array
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
const Item=mongoose.model('Item',itemSchema);

//admin route to perform admin actions
app.route('/admin')
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
      deliveryGuy:force,
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
  if(req.params.type==='customer'){
    const orderInfo =[];
    const userOrder =req.body.order;
    userOrder.forEach(order => {
      Item.findOne({name:order.name},function(err,result){
        const js = {
          name:order.name,
          quantity:order.quantity,
          point:result.point[Math.floor(Math.random()*(point.length))]
        }
        orderInfo.push(js);
      })
    });
   
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
      order:orderInfo,
      Status:'Order Created',
      deliveryGuy:'Not Assigned'
      })
    order.save();
    const adm = new Admin({
      order:order
    })
    adm.save();
    res.send(order)
  }else if(req.params.type==='admin'){
    const user = new User({
      ID:Math.floor(Math.random() * 100000),   
      name:custName,
      mobile:userMobile,
      type:'admin'
    })
    user.save();
   
  }else{
    const user = new User({
      ID:Math.floor(Math.random() * 100000),   
      name:custName,
      mobile:userMobile,
      type:'deliveryMan'
    })
    user.save();
  }
  })







app.listen(3000, () => {
    console.log(`Server started on port`);
});
 