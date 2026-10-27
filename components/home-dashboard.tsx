'use client';
import {ResumeGames,usePlayerLibrary} from './player-library';
// Home is for discovering and resuming games; personal records belong in My Page.
export function HomeDashboard(){const {saves}=usePlayerLibrary();return saves.length?<div className="home-player-resume"><ResumeGames saves={saves}/></div>:null}
