import { useApiQuery } from './useApiQuery';
import { trackerService } from '../services/api/tracker.service';
import { colors } from '../theme';
import type { TrackerEntry } from '../types/api';

export function useProgress(period: 'Week' | 'Month' = 'Week') {
  const days = period === 'Month' ? 30 : 7;
  const weight = useApiQuery(() => trackerService.getLastN('weight', days), [], [days]);
  const calories = useApiQuery(async () => {
    const [manual, mealsByDay] = await Promise.all([trackerService.getLastN('calories', days), trackerService.getLastN('meals', days)]);
    return manual.map((day, i) => ({ ...day, total: day.total + (mealsByDay[i]?.total || 0), count: day.count + (mealsByDay[i]?.count || 0) }));
  }, [], [days]);
  const steps = useApiQuery(() => trackerService.getLastN('steps', days), [], [days]);
  const workouts = useApiQuery(() => trackerService.getLastN('workouts', days), [], [days]);
  const meals = useApiQuery(() => trackerService.getEntries('meals', 500), [] as TrackerEntry[], [days]);
  const cutoff = Date.now() - days * 86400000;
  const recentMeals = meals.data.filter(e => e.ts >= cutoff);
  const sumMeta = (key: string) => recentMeals.reduce((n,e)=>n+(Number((e.meta as Record<string,unknown>)?.[key])||0),0);
  const totalProtein=sumMeta('protein'),totalCarbs=sumMeta('carbs'),totalFat=sumMeta('fats');
  const macroTotal=totalProtein+totalCarbs+totalFat;
  const macrosAvg=[
    {key:'protein',label:'Protein',value:Math.round(totalProtein/days),percent:macroTotal?Math.round(totalProtein/macroTotal*100):0,color:colors.macroProtein},
    {key:'carbs',label:'Carbs',value:Math.round(totalCarbs/days),percent:macroTotal?Math.round(totalCarbs/macroTotal*100):0,color:colors.macroCarbs},
    {key:'fat',label:'Fat',value:Math.round(totalFat/days),percent:macroTotal?Math.round(totalFat/macroTotal*100):0,color:colors.macroFat},
  ];
  const weights=weight.data.filter(d=>d.count>0);
  const weightTrend={change:weights.length>1?`${weights.at(-1)!.total-weights[0].total>=0?'+':''}${(weights.at(-1)!.total-weights[0].total).toFixed(1)} kg`:'No change',caption:`over the last ${days} days`,values:weight.data.map(d=>d.total),labels:weight.data.map(d=>new Date(`${d.day}T12:00:00`).toLocaleDateString('en',{month:'short',day:'numeric'}))};
  const calorieTotal=calories.data.reduce((n,d)=>n+d.total,0);
  const caloriesTrend={average:`${Math.round(calorieTotal/days).toLocaleString()} kcal`,values:calories.data.map(d=>d.total)};
  return {weightTrend,caloriesTrend,macrosAvg,report:{totalCalories:calorieTotal,averageSteps:Math.round(steps.data.reduce((n,d)=>n+d.total,0)/days),workouts:workouts.data.reduce((n,d)=>n+d.total,0),meals:recentMeals.length,days},loading:[weight,calories,steps,workouts,meals].some(x=>x.loading),refetch:()=>Promise.all([weight.refetch(),calories.refetch(),steps.refetch(),workouts.refetch(),meals.refetch()])};
}
