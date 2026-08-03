const { supabase } = require('../config/supabase');
const { notifySafely } = require('../services/notification.service');

const conversationId=(a,b)=>[a,b].sort().join(':');
const shape=(entry)=>({id:entry.id,conversationId:entry.meta.conversationId,senderId:entry.user_id,recipientId:entry.meta.recipientId,text:entry.meta.text,status:entry.meta.status||'pending',read:Boolean(entry.meta.read),createdAt:entry.created_at,ts:entry.ts});

async function conversationEntries(userId){
  const {data,error}=await supabase.from('tracker_entries').select('*').eq('tracker','direct-message').or(`user_id.eq.${userId},meta->>recipientId.eq.${userId}`).order('ts',{ascending:false});
  if(error)throw error;return data||[];
}

async function listConversations(req,res,next){try{
  const entries=await conversationEntries(req.user.id);const latest=new Map();
  for(const entry of entries){if((entry.meta?.status||'pending')!=='accepted')continue;const peer=entry.user_id===req.user.id?entry.meta.recipientId:entry.user_id;if(!latest.has(peer))latest.set(peer,{entry,unread:0});if(entry.meta.recipientId===req.user.id&&!entry.meta.read)latest.get(peer).unread++;}
  const ids=[...latest.keys()];if(!ids.length)return res.json({success:true,conversations:[]});
  const {data:users,error}=await supabase.from('users').select('id,name,avatar').in('id',ids);if(error)throw error;const usersById=Object.fromEntries((users||[]).map(x=>[x.id,x]));
  res.json({success:true,conversations:ids.map(id=>{const value=latest.get(id);const user=usersById[id]||{id,name:'Unknown',avatar:null};return{id:conversationId(req.user.id,id),user,summary:value.entry.meta.text||'',unreadCount:value.unread,updatedAt:value.entry.created_at};})});
}catch(e){next(e);}}

async function listRequests(req,res,next){try{
  const entries=await conversationEntries(req.user.id);const pending=entries.filter(x=>x.meta?.recipientId===req.user.id&&x.meta?.status==='pending');const firstBySender=new Map();pending.forEach(x=>{if(!firstBySender.has(x.user_id))firstBySender.set(x.user_id,x);});const ids=[...firstBySender.keys()];
  if(!ids.length)return res.json({success:true,requests:[]});const {data:users,error}=await supabase.from('users').select('id,name,avatar').in('id',ids);if(error)throw error;const usersById=Object.fromEntries((users||[]).map(x=>[x.id,x]));res.json({success:true,requests:ids.map(id=>({id:conversationId(req.user.id,id),user:usersById[id],summary:firstBySender.get(id).meta.text,createdAt:firstBySender.get(id).created_at}))});
}catch(e){next(e);}}

async function getMessages(req,res,next){try{
  const peerId=req.params.userId;const id=conversationId(req.user.id,peerId);const entries=await conversationEntries(req.user.id);const relevant=entries.filter(x=>x.meta?.conversationId===id&&x.meta?.status!=='blocked').sort((a,b)=>a.ts-b.ts);
  for(const entry of relevant.filter(x=>x.meta.recipientId===req.user.id&&!x.meta.read)){await supabase.from('tracker_entries').update({meta:{...entry.meta,read:true}}).eq('id',entry.id);}
  res.json({success:true,messages:relevant.map(shape)});
}catch(e){next(e);}}

async function sendMessage(req,res,next){try{
  const recipientId=req.params.userId;const text=String(req.body.text||'').trim();if(!text)return res.status(400).json({success:false,message:'Message text is required'});if(text.length>4000)return res.status(400).json({success:false,message:'Message is too long'});if(recipientId===req.user.id)return res.status(400).json({success:false,message:'You cannot message yourself'});
  const {data:recipient}=await supabase.from('users').select('id').eq('id',recipientId).maybeSingle();if(!recipient)return res.status(404).json({success:false,message:'User not found'});const id=conversationId(req.user.id,recipientId);const entries=await conversationEntries(req.user.id);const accepted=entries.some(x=>x.meta?.conversationId===id&&x.meta?.status==='accepted');const status=accepted?'accepted':'pending';const {data,error}=await supabase.from('tracker_entries').insert({user_id:req.user.id,tracker:'direct-message',ts:Date.now(),value:0,meta:{conversationId:id,recipientId,text,status,read:false}}).select().single();if(error)throw error;notifySafely(recipientId,'message','New message',text,{actorId:req.user.id,entityId:data.id});res.status(201).json({success:true,message:shape(data)});
}catch(e){next(e);}}

async function actOnRequest(req,res,next){try{
  const senderId=req.params.userId;const action=req.body.action;if(!['accept','decline','block'].includes(action))return res.status(400).json({success:false,message:'Invalid action'});const id=conversationId(req.user.id,senderId);const entries=await conversationEntries(req.user.id);const relevant=entries.filter(x=>x.meta?.conversationId===id);if(!relevant.length)return res.status(404).json({success:false,message:'Message request not found'});
  if(action==='decline'){for(const entry of relevant)await supabase.from('tracker_entries').delete().eq('id',entry.id);return res.json({success:true,status:'declined'});}const status=action==='accept'?'accepted':'blocked';for(const entry of relevant)await supabase.from('tracker_entries').update({meta:{...entry.meta,status,read:action==='accept'}}).eq('id',entry.id);res.json({success:true,status});
}catch(e){next(e);}}

module.exports={listConversations,listRequests,getMessages,sendMessage,actOnRequest};
