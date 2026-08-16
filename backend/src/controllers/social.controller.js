const { supabase } = require("../config/supabase");
const { notifySafely } = require("../services/notification.service");

/** GET /api/social/feed?limit=20&skip=0 */
async function getFeed(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const skip = Number(req.query.skip) || 0;

    const { data: posts, error } = await supabase
      .from("posts")
      .select("*, user:user_id (id, name, avatar, verified, level)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(skip, skip + limit - 1);

    if (error) throw error;
    res.json({ success: true, posts });
  } catch (err) {
    next(err);
  }
}

/** GET /api/social/users?q=name */
async function searchUsers(req, res, next) {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.json({ success: true, users: [] });

    const { data: users, error } = await supabase
      .from("users")
      .select("id, name, avatar, verified, level")
      .ilike("name", `%${q}%`)
      .neq("id", req.user.id)
      .limit(20);

    if (error) throw error;
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
}

/** GET /api/social/users/:id */
async function getProfile(req, res, next) {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, bio, avatar, verified, level, xp, coins, created_at")
      .eq("id", req.params.id)
      .single();

    if (error || !user) return res.status(404).json({ success: false, message: "User not found" });

    const { count: postCount } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("deleted_at", null);

    res.json({ success: true, user: { ...user, postCount: postCount || 0 } });
  } catch (err) {
    next(err);
  }
}

/** GET /api/social/leaderboard?limit=20 */
async function getLeaderboard(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const scope = req.query.scope || "global";

    if (scope === "teams") {
      const { data: groups, error: groupError } = await supabase.from("groups").select("id, name, avatar, member_count").limit(limit);
      if (groupError) throw groupError;
      const ids = (groups || []).map(g => g.id);
      const { data: members, error: memberError } = ids.length
        ? await supabase.from("group_members").select("group_id, user:user_id (xp)").in("group_id", ids)
        : { data: [], error: null };
      if (memberError) throw memberError;
      const ranked = (groups || []).map(g => ({ id:g.id,name:g.name,avatar:g.avatar,xp:(members||[]).filter(m=>m.group_id===g.id).reduce((n,m)=>n+Number(m.user?.xp||0),0),member_count:g.member_count })).sort((a,b)=>b.xp-a.xp);
      return res.json({ success: true, users: ranked });
    }

    let friendIds = null;
    if (scope === "friends") {
      const { data: links } = await supabase.from("tracker_entries").select("meta").eq("user_id", req.user.id).eq("tracker", "friend");
      friendIds = [req.user.id, ...(links || []).map(x => x.meta?.targetId).filter(Boolean)];
    }

    let query = supabase
      .from("users")
      .select("id, name, avatar, verified, level, xp")
      .order("xp", { ascending: false }).limit(limit);
    if (friendIds) query = query.in("id", friendIds);
    const { data: users, error } = await query;

    if (error) throw error;
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
}

async function toggleFriend(req, res, next) {
  try {
    const targetId = req.params.id;
    if (targetId === req.user.id) return res.status(400).json({ success: false, message: "You cannot add yourself" });
    const { data: existing } = await supabase.from("tracker_entries").select("id").eq("user_id", req.user.id).eq("tracker", "friend").contains("meta", { targetId }).limit(1);
    if (existing?.length) { await supabase.from("tracker_entries").delete().eq("id", existing[0].id); return res.json({ success: true, friend: false }); }
    const { data: target } = await supabase.from("users").select("id").eq("id", targetId).single();
    if (!target) return res.status(404).json({ success: false, message: "User not found" });
    await supabase.from("tracker_entries").insert({ user_id: req.user.id, tracker: "friend", ts: Date.now(), value: 1, meta: { targetId } });
    notifySafely(targetId, "friend", "New friend", "Someone added you as a friend.", { actorId: req.user.id });
    res.json({ success: true, friend: true });
  } catch (err) { next(err); }
}

async function getFriends(req, res, next) {
  try {
    const { data: links, error } = await supabase.from("tracker_entries").select("meta").eq("user_id", req.user.id).eq("tracker", "friend");
    if (error) throw error; const ids = links.map(x => x.meta?.targetId).filter(Boolean);
    if (!ids.length) return res.json({ success: true, friends: [] });
    const { data: friends, error: userError } = await supabase.from("users").select("id, name, bio, avatar, verified, level, xp, goal_kcal").in("id", ids);
    if (userError) throw userError; res.json({ success: true, friends });
  } catch (err) { next(err); }
}

async function getFriendsProgress(req, res, next) {
  try {
    const { data: links } = await supabase.from("tracker_entries").select("meta").eq("user_id", req.user.id).eq("tracker", "friend");
    const ids = (links || []).map(x => x.meta?.targetId).filter(Boolean); if (!ids.length) return res.json({ success: true, friends: [] });
    const start = new Date(); start.setHours(0,0,0,0);
    const [{ data: users }, { data: entries }] = await Promise.all([
      supabase.from("users").select("id, name, avatar, goal_kcal").in("id", ids),
      supabase.from("tracker_entries").select("user_id, tracker, value, meta").in("user_id", ids).in("tracker", ["meals","calories","steps"]).gte("ts", start.getTime()),
    ]);
    const friends = (users || []).map(user => { const own=(entries||[]).filter(e=>e.user_id===user.id); const calories=own.filter(e=>e.tracker==="meals"||e.tracker==="calories").reduce((n,e)=>n+Number(e.value||0),0); const steps=own.filter(e=>e.tracker==="steps").reduce((n,e)=>n+Number(e.value||0),0); return { id:user.id,name:user.name,avatar:user.avatar,calories,steps,percent:user.goal_kcal?Math.min(100,Math.round(calories/user.goal_kcal*100)):0 }; });
    res.json({ success: true, friends });
  } catch (err) { next(err); }
}

async function toggleFollow(req, res, next) {
  try {
    const targetId = req.params.id; if (targetId === req.user.id) return res.status(400).json({ success: false, message: "You cannot follow yourself" });
    const { data: existing } = await supabase.from("tracker_entries").select("id").eq("user_id", req.user.id).eq("tracker", "following").contains("meta", { targetId }).limit(1);
    if (existing?.length) { await supabase.from("tracker_entries").delete().eq("id", existing[0].id); return res.json({ success: true, following: false }); }
    const { data: target } = await supabase.from("users").select("id").eq("id", targetId).single(); if (!target) return res.status(404).json({ success: false, message: "User not found" });
    await supabase.from("tracker_entries").insert({ user_id: req.user.id, tracker: "following", ts: Date.now(), value: 1, meta: { targetId } });
    notifySafely(targetId, "follow", "New follower", "Someone started following you.", { actorId: req.user.id });
    res.json({ success: true, following: true });
  } catch (err) { next(err); }
}

async function getCreators(req, res, next) {
  try {
    const [{ data: creators, error }, { data: follows }] = await Promise.all([
      supabase.from("users").select("id, name, bio, avatar, verified, level, xp").eq("verified", true).neq("id", req.user.id).order("xp", { ascending: false }).limit(30),
      supabase.from("tracker_entries").select("meta").eq("user_id", req.user.id).eq("tracker", "following"),
    ]);
    if (error) throw error; const followed = new Set((follows || []).map(x => x.meta?.targetId));
    res.json({ success: true, creators: (creators || []).map(x => ({ ...x, following: followed.has(x.id) })) });
  } catch (err) { next(err); }
}

async function reportContent(req,res,next){try{const targetType=String(req.body.targetType||'');const targetId=String(req.body.targetId||'');const reason=String(req.body.reason||'').trim();if(!['post','comment','user','article','video'].includes(targetType)||!targetId||!reason)return res.status(400).json({success:false,message:'Target and reason are required'});const externalKey=`${targetType}:${targetId}`;const {data,error}=await supabase.from('user_records').upsert({user_id:req.user.id,kind:'moderation-report',external_key:externalKey,status:'pending',data:{targetType,targetId,reason,reportedAt:new Date().toISOString()}},{onConflict:'user_id,kind,external_key'}).select().single();if(error)throw error;res.status(201).json({success:true,report:data});}catch(error){next(error);}}
async function toggleBlockUser(req,res,next){try{const targetId=req.params.id;if(targetId===req.user.id)return res.status(400).json({success:false,message:'You cannot block yourself'});const {data:target}=await supabase.from('users').select('id').eq('id',targetId).maybeSingle();if(!target)return res.status(404).json({success:false,message:'User not found'});const {data:existing}=await supabase.from('user_records').select('id').eq('user_id',req.user.id).eq('kind','blocked-user').eq('external_key',targetId).maybeSingle();if(existing)await supabase.from('user_records').delete().eq('id',existing.id);else await supabase.from('user_records').insert({user_id:req.user.id,kind:'blocked-user',external_key:targetId,data:{blockedAt:new Date().toISOString()}});res.json({success:true,blocked:!existing});}catch(error){next(error);}}

async function getSocialBlogs(req,res,next){try{const {data,error}=await supabase.from('articles').select('id,blog_id,title,cover,body,category,read_minutes,views,earned,created_at,user:user_id(id,name,avatar,verified)').eq('status','published').order('created_at',{ascending:false}).limit(50);if(error)throw error;res.json({success:true,blogs:data||[]});}catch(e){next(e);}}
async function getSocialBlog(req,res,next){try{const {data,error}=await supabase.from('articles').select('id,blog_id,title,cover,body,category,read_minutes,views,earned,created_at,user:user_id(id,name,avatar,verified)').eq('id',req.params.id).eq('status','published').maybeSingle();if(error)throw error;if(!data)return res.status(404).json({success:false,message:'Blog article not found'});res.json({success:true,blog:data});}catch(e){next(e);}}
async function getSocialVideos(req,res,next){try{const {data,error}=await supabase.from('user_records').select('id,user_id,data,status,created_at').eq('kind','earn-video').eq('status','published').order('created_at',{ascending:false}).limit(50);if(error)throw error;const ids=[...new Set((data||[]).map(x=>x.user_id))];const {data:users,error:userError}=ids.length?await supabase.from('users').select('id,name,avatar,verified').in('id',ids):{data:[],error:null};if(userError)throw userError;const byId=Object.fromEntries((users||[]).map(x=>[x.id,x]));res.json({success:true,videos:(data||[]).map(x=>({id:x.id,...x.data,status:x.status,created_at:x.created_at,user:byId[x.user_id]}))});}catch(e){next(e);}}
async function getStories(req,res,next){try{const cutoff=new Date(Date.now()-86400000).toISOString();const {data,error}=await supabase.from('posts').select('id,image,created_at,user:user_id(id,name,avatar)').not('image','is',null).is('deleted_at',null).gte('created_at',cutoff).order('created_at',{ascending:false}).limit(30);if(error)throw error;res.json({success:true,stories:data||[]});}catch(e){next(e);}}

async function articleEngagement(req,res,next){try{const articleId=req.params.id;const {data:entries,error}=await supabase.from('tracker_entries').select('*').in('tracker',['article-like','article-comment','article-comment-like']).contains('meta',{articleId}).order('ts',{ascending:false});if(error)throw error;const comments=(entries||[]).filter(x=>x.tracker==='article-comment');const commentLikes=(entries||[]).filter(x=>x.tracker==='article-comment-like');const ids=[...new Set(comments.map(x=>x.user_id))];const {data:users}=ids.length?await supabase.from('users').select('id,name,avatar,verified').in('id',ids):{data:[]};const byId=Object.fromEntries((users||[]).map(x=>[x.id,x]));const likes=(entries||[]).filter(x=>x.tracker==='article-like');res.json({success:true,likes:likes.length,liked:likes.some(x=>x.user_id===req.user.id),comments:comments.map(x=>{const ownLikes=commentLikes.filter(l=>l.meta?.commentId===x.id);return{id:x.id,name:byId[x.user_id]?.name||'Member',avatar:byId[x.user_id]?.avatar||'',verified:Boolean(byId[x.user_id]?.verified),time:new Date(x.ts).toLocaleString(),text:x.meta.text,likes:ownLikes.length,liked:ownLikes.some(l=>l.user_id===req.user.id),userId:x.user_id,parentCommentId:x.meta.parentCommentId||null};})});}catch(e){next(e);}}
async function toggleArticleLike(req,res,next){try{const articleId=req.params.id;const {data:existing}=await supabase.from('tracker_entries').select('id').eq('user_id',req.user.id).eq('tracker','article-like').contains('meta',{articleId}).maybeSingle();if(existing)await supabase.from('tracker_entries').delete().eq('id',existing.id);else await supabase.from('tracker_entries').insert({user_id:req.user.id,tracker:'article-like',ts:Date.now(),value:1,meta:{articleId}});const {data:likes}=await supabase.from('tracker_entries').select('id').eq('tracker','article-like').contains('meta',{articleId});res.json({success:true,liked:!existing,likes:(likes||[]).length});}catch(e){next(e);}}
async function addArticleComment(req,res,next){try{const articleId=req.params.id;const text=String(req.body.text||'').trim();const parentCommentId=req.body.parentCommentId?String(req.body.parentCommentId):null;if(!text)return res.status(400).json({success:false,message:'Comment is required'});if(text.length>2000)return res.status(400).json({success:false,message:'Comment must be 2000 characters or fewer'});const {data:article}=await supabase.from('articles').select('id').eq('id',articleId).eq('status','published').maybeSingle();if(!article)return res.status(404).json({success:false,message:'Blog article not found'});if(parentCommentId){const {data:parent}=await supabase.from('tracker_entries').select('id').eq('id',parentCommentId).eq('tracker','article-comment').contains('meta',{articleId}).maybeSingle();if(!parent)return res.status(404).json({success:false,message:'Parent comment not found'});}const ts=Date.now();const {data,error}=await supabase.from('tracker_entries').insert({user_id:req.user.id,tracker:'article-comment',ts,value:0,meta:{articleId,text,parentCommentId}}).select().single();if(error)throw error;res.status(201).json({success:true,comment:{id:data.id,name:req.user.name||'You',avatar:req.user.avatar||'',verified:Boolean(req.user.verified),time:'now',text,likes:0,liked:false,userId:req.user.id,parentCommentId}});}catch(e){next(e);}}
async function toggleArticleCommentLike(req,res,next){try{const articleId=req.params.id;const commentId=req.params.commentId;const {data:comment}=await supabase.from('tracker_entries').select('id').eq('id',commentId).eq('tracker','article-comment').contains('meta',{articleId}).maybeSingle();if(!comment)return res.status(404).json({success:false,message:'Comment not found'});const {data:existing}=await supabase.from('tracker_entries').select('id').eq('user_id',req.user.id).eq('tracker','article-comment-like').contains('meta',{articleId,commentId}).maybeSingle();if(existing)await supabase.from('tracker_entries').delete().eq('id',existing.id);else await supabase.from('tracker_entries').insert({user_id:req.user.id,tracker:'article-comment-like',ts:Date.now(),value:1,meta:{articleId,commentId}});const {data:likes,error}=await supabase.from('tracker_entries').select('id').eq('tracker','article-comment-like').contains('meta',{articleId,commentId});if(error)throw error;res.json({success:true,liked:!existing,likes:(likes||[]).length});}catch(e){next(e);}}
async function deleteArticleComment(req,res,next){try{const {error}=await supabase.from('tracker_entries').delete().eq('id',req.params.commentId).eq('user_id',req.user.id).eq('tracker','article-comment');if(error)throw error;res.json({success:true});}catch(e){next(e);}}
async function toggleBlogFollow(req,res,next){try{const blogId=req.params.blogId;const {data:existing}=await supabase.from('tracker_entries').select('id').eq('user_id',req.user.id).eq('tracker','blog-follow').contains('meta',{blogId}).maybeSingle();if(existing)await supabase.from('tracker_entries').delete().eq('id',existing.id);else await supabase.from('tracker_entries').insert({user_id:req.user.id,tracker:'blog-follow',ts:Date.now(),value:1,meta:{blogId}});res.json({success:true,following:!existing});}catch(e){next(e);}}

module.exports = { getFeed, searchUsers, getProfile, getLeaderboard, toggleFriend, getFriends, getFriendsProgress, toggleFollow, getCreators, reportContent, toggleBlockUser, getSocialBlogs, getSocialBlog, getSocialVideos, getStories, articleEngagement, toggleArticleLike, addArticleComment, toggleArticleCommentLike, deleteArticleComment, toggleBlogFollow };
