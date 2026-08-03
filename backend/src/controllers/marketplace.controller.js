const { supabase } = require("../config/supabase");
const { notifySafely } = require("../services/notification.service");
const { getStripe, platformFeeAmount } = require("../config/stripe");

/**
 * GET /api/marketplace/products?category=&featured=true&limit=20&skip=0
 * Matches frontend: featuredProducts array and topCategories
 */
async function getProducts(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const skip = Number(req.query.skip) || 0;

    let query = supabase
      .from("marketplace_products")
      .select("*, seller:seller_id (id, name, avatar, verified)")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (req.query.category) query = query.eq("category", req.query.category);
    if (req.query.featured === "true") query = query.eq("is_featured", true);

    const { data: products, error } = await query.range(skip, skip + limit - 1);
    if (error) throw error;

    // Format price as "$XX.XX" string to match frontend shape
    const formatted = products.map((p) => ({
      ...p,
      price_display: `$${Number(p.price).toFixed(2)}`,
    }));

    res.json({ success: true, products: formatted });
  } catch (err) {
    next(err);
  }
}

/** GET /api/marketplace/products/featured */
async function getFeaturedProducts(req, res, next) {
  try {
    const { data: products, error } = await supabase
      .from("marketplace_products")
      .select("*, seller:seller_id (id, name, avatar, verified)")
      .eq("is_featured", true)
      .eq("is_active", true)
      .order("sold_count", { ascending: false })
      .limit(6);

    if (error) throw error;

    const formatted = products.map((p) => ({
      ...p,
      price_display: `$${Number(p.price).toFixed(2)}`,
    }));

    res.json({ success: true, products: formatted });
  } catch (err) {
    next(err);
  }
}

/** GET /api/marketplace/categories */
async function getCategories(req, res, next) {
  // Static list matching the frontend topCategories shape
  const categories = [
    { id: "healthy-meals",    label: "Healthy Meals",      icon: "restaurant-outline" },
    { id: "supplements",      label: "Supplements",        icon: "medkit-outline" },
    { id: "trainers",         label: "Personal Trainers",  icon: "person-outline" },
    { id: "workouts",         label: "Workouts",           icon: "barbell-outline" },
    { id: "ebooks",           label: "Ebooks",             icon: "book-outline" },
    { id: "programs",         label: "Programs",           icon: "list-outline" },
    { id: "equipment",        label: "Equipment",          icon: "barbell-outline" },
    { id: "coaching",         label: "Coaching",           icon: "person-outline" },
  ];
  res.json({ success: true, categories });
}

/** GET /api/marketplace/products/:id */
async function getProduct(req, res, next) {
  try {
    const { data: product, error } = await supabase
      .from("marketplace_products")
      .select("*, seller:seller_id (id, name, avatar, verified)")
      .eq("id", req.params.id)
      .eq("is_active", true)
      .single();

    if (error || !product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json({
      success: true,
      product: { ...product, price_display: `$${Number(product.price).toFixed(2)}` },
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/marketplace/products — create a listing */
async function createProduct(req, res, next) {
  try {
    const b = req.body;
    if (!b.title || !b.category || b.price === undefined) {
      return res.status(400).json({ success: false, message: "title, category, and price are required" });
    }

    const { data: product, error } = await supabase
      .from("marketplace_products")
      .insert({
        seller_id: req.user.id,
        title: b.title,
        description: b.description || "",
        photo: b.photo || null,
        price: Number(b.price),
        currency: b.currency || "USD",
        category: b.category,
        is_featured: Boolean(b.isFeatured),
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({
      success: true,
      product: { ...product, price_display: `$${Number(product.price).toFixed(2)}` },
    });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/marketplace/products/:id */
async function updateProduct(req, res, next) {
  try {
    const allowed = ["title", "description", "photo", "price", "category", "is_featured", "is_active"];
    const patch = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) patch[k] = req.body[k]; });

    const { data: product, error } = await supabase
      .from("marketplace_products")
      .update(patch)
      .eq("id", req.params.id)
      .eq("seller_id", req.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    res.json({
      success: true,
      product: { ...product, price_display: `$${Number(product.price).toFixed(2)}` },
    });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/marketplace/products/:id */
async function deleteProduct(req, res, next) {
  try {
    await supabase
      .from("marketplace_products")
      .update({ is_active: false })
      .eq("id", req.params.id)
      .eq("seller_id", req.user.id);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

/** GET /api/marketplace/search?q=protein */
async function searchProducts(req, res, next) {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.json({ success: true, products: [] });

    const { data: products, error } = await supabase
      .from("marketplace_products")
      .select("*, seller:seller_id (id, name, avatar)")
      .eq("is_active", true)
      .ilike("title", `%${q}%`)
      .limit(20);

    if (error) throw error;

    const formatted = products.map((p) => ({
      ...p,
      price_display: `$${Number(p.price).toFixed(2)}`,
    }));

    res.json({ success: true, products: formatted });
  } catch (err) {
    next(err);
  }
}

async function checkout(req, res, next) {
  try {
    const ids = [...new Set((req.body.productIds || []).filter(Boolean))];
    if (!ids.length) return res.status(400).json({ success: false, message: "Cart is empty" });
    const { data: products, error } = await supabase.from("marketplace_products").select("id,title,description,photo,price,currency,seller_id").in("id", ids).eq("is_active", true);
    if (error) throw error; if (!products?.length) return res.status(404).json({ success: false, message: "Products not found" });
    if(products.length!==ids.length)return res.status(400).json({success:false,message:"One or more products are unavailable"});
    const sellers=[...new Set(products.map(p=>p.seller_id))];if(sellers.length!==1)return res.status(400).json({success:false,message:"Checkout currently supports products from one seller at a time"});
    const currencies=[...new Set(products.map(p=>String(p.currency||"USD").toLowerCase()))];if(currencies.length!==1)return res.status(400).json({success:false,message:"All products must use the same currency"});
    const {data:sellerPayout}=await supabase.from("payouts").select("stripe_account_id,stripe_charges_enabled,stripe_payouts_enabled").eq("user_id",sellers[0]).maybeSingle();
    if(!sellerPayout?.stripe_account_id||!sellerPayout.stripe_charges_enabled)return res.status(409).json({success:false,message:"Seller is not ready to accept Stripe payments"});
    const currency=currencies[0];const items=products.map(p=>({id:p.id,title:p.title,price:Number(p.price),quantity:1,sellerId:p.seller_id}));const totalMinor=items.reduce((n,p)=>n+Math.round(p.price*100),0);const feeMinor=platformFeeAmount(totalMinor);
    const {data:order,error:orderError}=await supabase.from("marketplace_orders").insert({buyer_id:req.user.id,seller_id:sellers[0],currency,total_amount:totalMinor,platform_fee_amount:feeMinor,status:"creating-checkout",items}).select().single();if(orderError)throw orderError;
    const base=(process.env.PUBLIC_APP_URL||"http://localhost:8081").replace(/\/$/,"");
    let session;try{session=await getStripe().checkout.sessions.create({mode:"payment",client_reference_id:order.id,line_items:products.map(p=>({quantity:1,price_data:{currency,unit_amount:Math.round(Number(p.price)*100),product_data:{name:p.title,description:p.description||undefined,images:p.photo?[p.photo]:undefined,metadata:{teamcalProductId:p.id}}}})),payment_intent_data:{application_fee_amount:feeMinor,transfer_data:{destination:sellerPayout.stripe_account_id},metadata:{teamcalOrderId:order.id,teamcalBuyerId:req.user.id,teamcalSellerId:sellers[0]}},metadata:{teamcalOrderId:order.id},success_url:`${base}/marketplace/orders?checkout=success&session_id={CHECKOUT_SESSION_ID}`,cancel_url:`${base}/marketplace/orders?checkout=cancelled`},{idempotencyKey:`checkout:${order.id}`});}catch(e){await supabase.from("marketplace_orders").update({status:"checkout-failed"}).eq("id",order.id);throw e;}
    const {data:updated,error:updateError}=await supabase.from("marketplace_orders").update({status:"pending-payment",stripe_checkout_session_id:session.id}).eq("id",order.id).select().single();if(updateError)throw updateError;
    notifySafely(req.user.id, "order", "Order created", `Your order for ${products.length} item${products.length === 1 ? "" : "s"} is awaiting payment.`, { entityId: order.id });
    res.status(201).json({ success:true, order:updated, checkoutUrl:session.url });
  } catch (err) { next(err); }
}

async function getOrders(req, res, next) {
  try { const { data: orders, error } = await supabase.from("marketplace_orders").select("*").or(`buyer_id.eq.${req.user.id},seller_id.eq.${req.user.id}`).order("created_at",{ascending:false});if(error)throw error;res.json({success:true,orders}); }
  catch(err){next(err);}
}

async function refundOrder(req,res,next){try{const {data:order,error}=await supabase.from("marketplace_orders").select("*").eq("id",req.params.id).maybeSingle();if(error)throw error;if(!order||order.seller_id!==req.user.id)return res.status(404).json({success:false,message:"Order not found"});if(!order.stripe_payment_intent_id)return res.status(409).json({success:false,message:"Order has no completed payment"});const requested=req.body.amount===undefined?order.total_amount:Number(req.body.amount);const amountMinor=req.body.amount===undefined?undefined:Math.round(requested*100);if(amountMinor!==undefined&&(amountMinor<=0||amountMinor>order.total_amount))return res.status(400).json({success:false,message:"Invalid refund amount"});const refund=await getStripe().refunds.create({payment_intent:order.stripe_payment_intent_id,amount:amountMinor,reverse_transfer:true,refund_application_fee:true,metadata:{teamcalOrderId:order.id,requestedBy:req.user.id}},{idempotencyKey:req.body.idempotencyKey||`refund:${order.id}:${amountMinor||"full"}`});await supabase.from("stripe_refunds").upsert({id:refund.id,order_id:order.id,amount:refund.amount,currency:refund.currency,status:refund.status,reason:refund.reason,requested_by:req.user.id,raw:refund},{onConflict:"id"});await supabase.from("marketplace_orders").update({status:refund.amount>=order.total_amount?"refund-pending":"partial-refund-pending"}).eq("id",order.id);res.status(201).json({success:true,refund});}catch(e){next(e);}}
async function getDisputes(req,res,next){try{const {data:orders,error:orderError}=await supabase.from("marketplace_orders").select("id").eq("seller_id",req.user.id);if(orderError)throw orderError;const ids=(orders||[]).map(x=>x.id);if(!ids.length)return res.json({success:true,disputes:[]});const {data,error}=await supabase.from("stripe_disputes").select("*").in("order_id",ids).order("created_at",{ascending:false});if(error)throw error;res.json({success:true,disputes:data||[]});}catch(e){next(e);}}

module.exports = {
  getProducts, getFeaturedProducts, getCategories,
  getProduct, createProduct, updateProduct, deleteProduct,
  searchProducts, checkout, getOrders, refundOrder, getDisputes,
};
