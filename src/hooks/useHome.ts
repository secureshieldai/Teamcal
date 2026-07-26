import { useCallback, useEffect, useState } from 'react';
import { useApiQuery } from './useApiQuery';
import { trackerService } from '../services/api/tracker.service';
import { fastingService } from '../services/api/fasting.service';
import { socialService } from '../services/api/social.service';
import { useAuth } from '../context/AuthContext';

export function useHomeSummary() {
  const { user } = useAuth(); const [now,setNow]=useState(Date.now());
  const summary=useApiQuery(()=>trackerService.getTodaySummary(),null,[]);
  const fasting=useApiQuery(()=>fastingService.getActive(),null,[]);
  const friends=useApiQuery(()=>socialService.getFriendsProgress(),[],[]);
  const refetch=useCallback(async()=>{await Promise.all([summary.refetch(),fasting.refetch(),friends.refetch()]);},[summary.refetch,fasting.refetch,friends.refetch]);
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),30000);return()=>clearInterval(timer)},[]);
  const calories=summary.data?.calories??0;const calorieGoal=user?.goal_kcal??0;const percent=calorieGoal>0?Math.round(calories/calorieGoal*100):0;
  const macros=[
    {key:'protein',label:'Protein',value:summary.data?.protein??0,goal:user?.goal_protein_g??0,color:'macroProtein' as const},
    {key:'carbs',label:'Carbs',value:summary.data?.carbs??0,goal:user?.goal_carbs_g??0,color:'macroCarbs' as const},
    {key:'fat',label:'Fat',value:summary.data?.fat??0,goal:user?.goal_fats_g??0,color:'macroFat' as const},
  ];
  const fastingValue=fasting.data?(()=>{const elapsed=Math.max(0,Math.floor((now-fasting.data.started_at)/60000));return `${String(Math.floor(elapsed/60)).padStart(2,'0')}:${String(elapsed%60).padStart(2,'0')}`})():'00:00';
  const statTiles=[
    {id:'steps',icon:'walk' as const,label:'Steps',value:(summary.data?.steps??0).toLocaleString(),goal:`/${user?.goal_steps??0}`},
    {id:'water',icon:'water' as const,label:'Water',value:`${summary.data?.water??0}`,goal:`/${user?.goal_water_ml??0} ml`},
    {id:'workouts',icon:'barbell' as const,label:'Workouts',value:`${summary.data?.workouts??0}`,goal:'today'},
    {id:'fasting',icon:'time' as const,label:'Fasting',value:fastingValue,goal:'elapsed'},
  ];
  const friendsProgress=friends.data.map(friend=>({...friend,avatar:friend.avatar||'',calories:`${friend.calories.toLocaleString()} kcal · ${friend.steps.toLocaleString()} steps`}));
  return {todayProgress:{calories,calorieGoal,percent,macros},statTiles,friendsProgress,loading:summary.loading||friends.loading,refetch};
}
