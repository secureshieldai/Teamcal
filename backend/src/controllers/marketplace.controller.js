const { supabase } = require("../config/supabase");
const { notifySafely } = require("../services/notification.service");

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
    const { data: products, error } = await supabase.from("marketplace_products").select("id,title,price,currency,sold_count").in("id", ids).eq("is_active", true);
    if (error) throw error; if (!products?.length) return res.status(404).json({ success: false, message: "Products not found" });
    const total = products.reduce((n,p)=>n+Number(p.price),0); const ts=Date.now();
    const { data: order, error: orderError } = await supabase.from("tracker_entries").insert({ user_id:req.user.id,tracker:"marketplace-order",ts,value:total,meta:{items:products.map(p=>({id:p.id,title:p.title,price:p.price})),currency:products[0].currency||"USD",status:"pending-payment"} }).select().single();
    if (orderError) throw orderError;
    await Promise.all(products.map(p=>supabase.from("marketplace_products").update({sold_count:(p.sold_count||0)+1}).eq("id",p.id)));
    notifySafely(req.user.id, "order", "Order created", `Your order for ${products.length} item${products.length === 1 ? "" : "s"} is awaiting payment.`, { entityId: order.id });
    res.status(201).json({ success:true, order });
  } catch (err) { next(err); }
}

async function getOrders(req, res, next) {
  try { const { data: orders, error } = await supabase.from("tracker_entries").select("*").eq("user_id",req.user.id).eq("tracker","marketplace-order").order("ts",{ascending:false});if(error)throw error;res.json({success:true,orders}); }
  catch(err){next(err);}
}

module.exports = {
  getProducts, getFeaturedProducts, getCategories,
  getProduct, createProduct, updateProduct, deleteProduct,
  searchProducts, checkout, getOrders,
};
