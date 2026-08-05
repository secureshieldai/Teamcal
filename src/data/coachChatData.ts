export const coachProfile={name:'TeamCal Coach',online:true,role:'TeamCal AI Coach',tagline:'Helping you hit your goals'};
export type ChatMessage=
  |{id:string;kind:'text';fromMe:boolean;text:string;time:string;seen?:boolean}
  |{id:string;kind:'voice';duration:string;time:string}
  |{id:string;kind:'progress';time:string};
