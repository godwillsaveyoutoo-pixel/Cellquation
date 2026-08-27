import { Cell, makeNucleus } from '../cellkit_latest/cell.js?v=0.12.3.2';
import {
  broodNucleusLocalPosition, broodNucleusRadius, buildBroodSerialTargetsFromStarts, orderBroodSerialIndices,
  evaluateBroodStep, smooth01 as broodSmooth01,
} from '../cellkit_latest/brood.js?v=0.12.3.2';
import { evaluateFusionSplitMechanics } from '../cellkit_latest/transition.js?v=0.12.3.2';

const TAU = Math.PI * 2;
const EPS = 1e-9;

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function smooth01(v) { v = clamp(v, 0, 1); return v * v * (3 - 2 * v); }
function phaseFromSeed(seed) { return (seed * 0.731) % TAU; }
function rotateLocal(center, angle, lx, ly = 0) {
  const c = Math.cos(angle), s = Math.sin(angle);
  return [center[0] + c * lx - s * ly, center[1] + s * lx + c * ly];
}
function length2(x, y) { return Math.hypot(x, y); }

export class CellWorld {
  constructor({ fusionVisual, splitVisual, broodVisual = {}, destructVisual = null, switchVisual = null, mimicVisual = null, settings }) {
    this.fusionVisual = fusionVisual;
    this.splitVisual = splitVisual;
    this.broodVisual = broodVisual;
    this.destructVisual = destructVisual || fusionVisual;
    this.switchVisual = switchVisual || fusionVisual;
    this.mimicVisual = mimicVisual || fusionVisual;
    this.settings = settings;
    this.colorMode = 2;
    this.cells = [];
    this.activeApproach = null;
    this.activeTransition = null;
    this.parallelFusions = [];
    this.parallelDivisions = [];
    this.activeBrood = null;
    this.activeDestruct = null;
    this.activeSwap = null;
    this.activeImitate = null;
    this.lastEvent = null;
  }

  setColorMode(mode = 2) {
    this.colorMode = Number(mode) === 3 ? 3 : 2;
    if (this.colorMode === 3) {
      this.activeSwap = null;
      this.cells = this.cells.filter(c => c.type !== 'swap');
    }
    this.clearSelection();
    this.syncBroodNuclei();
    return this.colorMode;
  }

  isSpeciesAllowed(species) {
    return species === 'blue' || species === 'green' || (this.colorMode === 3 && species === 'violet');
  }

  fusionResultSpecies(speciesA, speciesB) {
    if (!this.isSpeciesAllowed(speciesA) || !this.isSpeciesAllowed(speciesB)) return null;
    if (speciesA === speciesB) return speciesA;
    if (this.colorMode !== 3) return null;
    const species = ['blue','green','violet'];
    return species.find(s => s !== speciesA && s !== speciesB) ?? null;
  }

  addCell(cell) {
    if (this.cells.length >= this.settings.maxCells) return null;
    this.cells.push(cell);
    return cell;
  }

  addFusion(position, velocity = [0, 0], nucleus = null, options = {}) {
    const species=options.species ?? 'blue';
    if (!this.isSpeciesAllowed(species)) return null;
    const visualSeed = options.visualSeed ?? nucleus?.visualSeed ?? null;
    return this.addCell(new Cell({
      type: 'fusion', species, position, velocity,
      rotation: options.rotation ?? Math.random() * TAU,
      angularVelocity: 0,
      visualSeed,
      visualProfile: this.fusionVisual,
      nuclei: nucleus ? [nucleus] : null,
      physicsBlend: options.physicsBlend ?? 1,
    }));
  }

  addSplit(position, velocity = [0, 0], rotation = 0, nuclei = null, options = {}) {
    const species=options.species ?? 'blue';
    if (!this.isSpeciesAllowed(species)) return null;
    return this.addCell(new Cell({
      type: 'split', species, position, velocity, rotation,
      angularVelocity: 0,
      visualSeed: options.visualSeed ?? null,
      visualProfile: this.splitVisual,
      nuclei,
      physicsBlend: options.physicsBlend ?? 1,
    }));
  }

  addBrood(position, velocity = [0, 0], options = {}) {
    const species=options.species ?? 'blue';
    if (!this.isSpeciesAllowed(species)) return null;
    return this.addCell(new Cell({
      type: 'brood', species, position, velocity,
      rotation: options.rotation ?? Math.random() * TAU,
      angularVelocity: 0,
      visualSeed: options.visualSeed ?? null,
      visualProfile: this.broodVisual,
      physicsBlend: options.physicsBlend ?? 1,
    }));
  }


  addDestruct(position, velocity = [0, 0], options = {}) {
    const species=options.species ?? 'blue';
    if (!this.isSpeciesAllowed(species)) return null;
    return this.addCell(new Cell({
      type: 'destruct', species, position, velocity,
      rotation: options.rotation ?? Math.random() * TAU,
      angularVelocity: 0,
      visualSeed: options.visualSeed ?? null,
      visualProfile: this.destructVisual,
      physicsBlend: options.physicsBlend ?? 1,
    }));
  }

  addSwap(position, velocity = [0, 0], options = {}) {
    const species=options.species ?? 'blue';
    if (this.colorMode === 3 || !this.isSpeciesAllowed(species)) return null;
    return this.addCell(new Cell({
      type: 'swap', species, position, velocity,
      rotation: options.rotation ?? Math.random() * TAU,
      angularVelocity: 0,
      visualSeed: options.visualSeed ?? null,
      visualProfile: this.switchVisual,
      physicsBlend: options.physicsBlend ?? 1,
    }));
  }


  addImitate(position, velocity = [0, 0], options = {}) {
    const species=options.species ?? 'blue';
    if (!this.isSpeciesAllowed(species)) return null;
    return this.addCell(new Cell({
      type: 'imitate', species, position, velocity,
      rotation: options.rotation ?? Math.random() * TAU,
      angularVelocity: 0,
      visualSeed: options.visualSeed ?? null,
      visualProfile: this.mimicVisual,
      physicsBlend: options.physicsBlend ?? 1,
    }));
  }



  removeCell(cell) {
    const i = this.cells.indexOf(cell);
    if (i >= 0) this.cells.splice(i, 1);
  }

  clearSelection() { this.cells.forEach(c => c.setSelected(false)); }
  get selectedFusionCells() { return this.cells.filter(c => c.type === 'fusion' && c.selected && c.state === 'idle'); }
  get hasParallelFusionActivity() { return this.parallelFusions.length > 0; }
  get hasFusionActivity() { return Boolean(this.activeApproach || (this.activeTransition && this.activeTransition.kind === 'fusion') || this.parallelFusions.length); }
  get hasDivisionActivity() { return Boolean((this.activeTransition && this.activeTransition.kind === 'division') || this.parallelDivisions.length); }
  // Cellquation v0.6 production contract: Fusion and Split are independent
  // action families and may run in parallel on different cells. Brood, Destruct,
  // Swap and Imitation remain exclusive until their own concurrency contract exists.
  get hasExclusiveActivity() { return Boolean(this.activeBrood || this.activeDestruct || this.activeSwap || this.activeImitate); }
  get isBusy() { return Boolean(this.hasFusionActivity || this.hasDivisionActivity || this.hasExclusiveActivity); }
  get canStartFusion() { return !this.hasExclusiveActivity; }
  get canStartDivision() { return !this.hasExclusiveActivity; }
  isCellActionable(cell) {
    return Boolean(cell && this.cells.includes(cell) && cell.state === 'idle' && !this.hasExclusiveActivity);
  }
  get parallelFusionTransitions() { return this.parallelFusions.filter(j => j.stage === 'transition'); }
  get parallelDivisionTransitions() { return this.parallelDivisions.filter(j => j.stage === 'transition'); }

  consumeEvent() {
    const event = this.lastEvent;
    this.lastEvent = null;
    return event;
  }

  syncBroodNuclei() {
    if (this.activeBrood) return;
    // Brood counts logical cells of its OWN colour. Fusion transition bodies
    // are temporarily removed from `cells`, so count each such body as one
    // logical output cell of the transition species.
    const logicalCountForSpecies=(species)=>{
      let target=this.cells.filter(c=>c.species===species).length;
      if(this.activeTransition?.kind==='fusion' && this.activeTransition.species===species) target+=1;
      target+=this.parallelFusions.filter(j=>j.stage==='transition'&&j.tr?.species===species).length;
      return target;
    };
    for (const cell of this.cells) if (cell.type === 'brood') cell.ensureBroodNuclei(logicalCountForSpecies(cell.species));
  }

  collisionRadius(cell) {
    return cell.radius + (this.settings.collisionPadding ?? 0.010);
  }

  findCellAt(x, y) {
    let best = null, bestD = Infinity;
    for (const cell of this.cells) {
      const d = length2(x - cell.position[0], y - cell.position[1]);
      if (d <= cell.radius * 1.14 && d < bestD) { best = cell; bestD = d; }
    }
    return best;
  }

  randomVelocity(mult = 1) {
    const a = Math.random() * TAU;
    const s = this.settings.driftSpeed * mult * (0.55 + Math.random() * 0.55);
    return [Math.cos(a) * s, Math.sin(a) * s];
  }

  spawnDefault() {
    this.spawnComposition({ fusion: 2, split: 1, brood: 1, destruct: 1, swap: this.colorMode===3?0:1, imitate: 1 }, { left:-0.72,right:0.72,bottom:-0.52,top:0.52 });
  }

  spawnComposition(counts, bounds) {
    this.cells.length = 0;
    this.activeApproach = null;
    this.activeTransition = null;
    this.parallelFusions.length = 0;
    this.activeBrood = null;
    this.activeDestruct = null;
    this.activeSwap = null;
    this.activeImitate = null;
    this.lastEvent = null;

    const fusionCount = Math.max(0, Math.floor(Number(counts?.fusion) || 0));
    const splitCount = Math.max(0, Math.floor(Number(counts?.split) || 0));
    const broodCount = Math.max(0, Math.floor(Number(counts?.brood) || 0));
    const destructCount = Math.max(0, Math.floor(Number(counts?.destruct) || 0));
    const swapCount = this.colorMode===3 ? 0 : Math.max(0, Math.floor(Number(counts?.swap) || 0));
    const imitateCount = Math.max(0, Math.floor(Number(counts?.imitate) || 0));
    const total = fusionCount + splitCount + broodCount + destructCount + swapCount + imitateCount;
    if (total <= 0) return { ok:true, total:0 };

    const maxR = Math.max(this.fusionVisual.radius, this.splitVisual.radius, this.destructVisual.radius, this.switchVisual.radius, this.mimicVisual.radius);
    const spacingX = maxR * 2 + (this.settings.collisionPadding ?? 0.010) * 2 + 0.055;
    const spacingY = spacingX * 0.91;
    const width = Math.max(0.01, bounds.right - bounds.left);
    const height = Math.max(0.01, bounds.top - bounds.bottom);
    const cols = Math.max(1, Math.floor((width - maxR * 2) / spacingX) + 1);
    const rows = Math.max(1, Math.floor((height - maxR * 2) / spacingY) + 1);

    const candidates = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = (c - (cols - 1) * 0.5) * spacingX + ((r & 1) ? spacingX * 0.5 : 0);
        const y = (r - (rows - 1) * 0.5) * spacingY;
        if (x - maxR < bounds.left || x + maxR > bounds.right || y - maxR < bounds.bottom || y + maxR > bounds.top) continue;
        candidates.push([x,y]);
      }
    }
    candidates.sort((a,b) => Math.hypot(a[0],a[1]) - Math.hypot(b[0],b[1]));
    if (candidates.length < total) return { ok:false, reason:'space', capacity:candidates.length, total };

    let cursor = 0;
    // Brood cells get the most central slots so budding has usable room.
    for (let i=0;i<broodCount;i++) this.addBrood(candidates[cursor++], this.randomVelocity(0.45));
    for (let i=0;i<destructCount;i++) this.addDestruct(candidates[cursor++], this.randomVelocity(0.50));
    for (let i=0;i<swapCount;i++) this.addSwap(candidates[cursor++], this.randomVelocity(0.50));
    for (let i=0;i<imitateCount;i++) this.addImitate(candidates[cursor++], this.randomVelocity(0.50));
    for (let i=0;i<splitCount;i++) this.addSplit(candidates[cursor++], this.randomVelocity(0.45), Math.random()*TAU);
    for (let i=0;i<fusionCount;i++) this.addFusion(candidates[cursor++], this.randomVelocity(0.60));
    this.syncBroodNuclei();
    return { ok:true, total };
  }

  #spawnPositionClear(position, radius) {
    return this.cells.every(c =>
      length2(c.position[0] - position[0], c.position[1] - position[1]) >=
      this.collisionRadius(c) + radius + 0.004
    );
  }

  spawnFusionNear(center = [0, 0], species = 'blue') {
    if (!this.isSpeciesAllowed(species)) return null;
    if (this.cells.length >= this.settings.maxCells) return null;
    const rSelf = this.fusionVisual.radius + (this.settings.collisionPadding ?? 0.010);
    for (let attempt = 0; attempt < 30; attempt++) {
      const a = Math.random() * TAU, r = 0.20 + Math.random() * 0.30;
      const p = [center[0] + Math.cos(a) * r, center[1] + Math.sin(a) * r];
      if (this.#spawnPositionClear(p, rSelf)) return this.addFusion(p, this.randomVelocity(), null, {species});
    }
    return null;
  }

  spawnBroodNear(center = [0, 0], species = 'blue') {
    if (!this.isSpeciesAllowed(species)) return null;
    if (this.cells.length >= this.settings.maxCells) return null;
    const rSelf = this.fusionVisual.radius + (this.settings.collisionPadding ?? 0.010);
    for (let attempt = 0; attempt < 50; attempt++) {
      const a = Math.random() * TAU, r = 0.20 + Math.random() * 0.34;
      const p = [center[0] + Math.cos(a) * r, center[1] + Math.sin(a) * r];
      if (this.#spawnPositionClear(p, rSelf)) {
        const cell = this.addBrood(p, this.randomVelocity(0.55), {species});
        this.syncBroodNuclei();
        return cell;
      }
    }
    return null;
  }

  spawnDestructNear(center = [0, 0], species = 'blue') {
    if (!this.isSpeciesAllowed(species)) return null;
    if (this.cells.length >= this.settings.maxCells) return null;
    const rSelf = this.destructVisual.radius + (this.settings.collisionPadding ?? 0.010);
    for (let k=0;k<120;k++) {
      const a = Math.random()*TAU, d = 0.18 + Math.sqrt(Math.random())*0.48;
      const p = [center[0] + Math.cos(a)*d, center[1] + Math.sin(a)*d];
      if (this.#spawnPositionClear(p, rSelf)) return this.addDestruct(p, this.randomVelocity(0.55), {species});
    }
    return null;
  }

  spawnSwapNear(center = [0, 0], species = 'blue') {
    if (this.colorMode===3 || !this.isSpeciesAllowed(species)) return null;
    if (this.cells.length >= this.settings.maxCells) return null;
    const rSelf = this.switchVisual.radius + (this.settings.collisionPadding ?? 0.010);
    for (let k=0;k<120;k++) {
      const a = Math.random()*TAU, d = 0.18 + Math.sqrt(Math.random())*0.48;
      const p = [center[0] + Math.cos(a)*d, center[1] + Math.sin(a)*d];
      if (this.#spawnPositionClear(p, rSelf)) return this.addSwap(p, this.randomVelocity(0.55), {species});
    }
    return null;
  }

  spawnImitateNear(center = [0, 0], species = 'blue') {
    if (!this.isSpeciesAllowed(species)) return null;
    if (this.cells.length >= this.settings.maxCells) return null;
    const rSelf = this.mimicVisual.radius + (this.settings.collisionPadding ?? 0.010);
    for (let attempt = 0; attempt < 60; attempt++) {
      const a = Math.random() * TAU, r = 0.20 + Math.random() * 0.34;
      const p = [center[0] + Math.cos(a) * r, center[1] + Math.sin(a) * r];
      if (this.#spawnPositionClear(p, rSelf)) return this.addImitate(p, this.randomVelocity(0.5), {species});
    }
    return null;
  }

  spawnSplitNear(center = [0, 0], species = 'blue') {
    if (!this.isSpeciesAllowed(species)) return null;
    if (this.cells.length >= this.settings.maxCells) return null;
    const rSelf = this.splitVisual.radius + (this.settings.collisionPadding ?? 0.010);
    for (let attempt = 0; attempt < 30; attempt++) {
      const a = Math.random() * TAU, r = 0.18 + Math.random() * 0.30;
      const p = [center[0] + Math.cos(a) * r, center[1] + Math.sin(a) * r];
      if (this.#spawnPositionClear(p, rSelf)) return this.addSplit(p, this.randomVelocity(0.6), Math.random() * TAU, null, {species});
    }
    return null;
  }

  #cellInFusionActivity(cell) {
    if (!cell) return false;
    if (this.activeApproach && (cell === this.activeApproach.cellA || cell === this.activeApproach.cellB)) return true;
    if (this.activeTransition && this.activeTransition.kind === 'fusion' &&
        (cell === this.activeTransition.sourceA || cell === this.activeTransition.sourceB)) return true;
    return this.parallelFusions.some(job => {
      const ap=job.ap, tr=job.tr;
      return (ap && (cell===ap.cellA || cell===ap.cellB)) ||
             (tr && (cell===tr.sourceA || cell===tr.sourceB));
    });
  }

  #createFusionApproach(cellA, cellB) {
    cellA.setSelected(false); cellB.setSelected(false);
    cellA.state = 'fusion-approach'; cellB.state = 'fusion-approach';
    cellA.angularVelocity = 0; cellB.angularVelocity = 0;

    const dx = cellB.position[0] - cellA.position[0];
    const dy = cellB.position[1] - cellA.position[1];
    const dist = Math.max(0.0001, length2(dx, dy));
    const visualTakeoverDistance = Math.max(0.350, this.fusionVisual.radius * 2.24);
    const physicalTakeoverDistance = this.collisionRadius(cellA) + this.collisionRadius(cellB) + 0.008;
    const targetDistance = Math.max(visualTakeoverDistance, physicalTakeoverDistance);
    const travelGap = Math.max(0, dist - targetDistance);
    const minDuration = this.settings.fusionApproachMinDuration ?? 1.20;
    const maxDuration = this.settings.fusionApproachMaxDuration ?? 4.80;
    const rate = Math.max(0.08, this.settings.fusionApproachDistanceRate ?? 0.25);
    const duration = clamp(0.45 + travelGap / rate, minDuration, maxDuration);

    return {
      kind: 'fusion-approach', cellA, cellB,
      elapsed: 0, duration,
      startDistance: dist, targetDistance,
      engagement: 0,
      engagementDuration: this.settings.fusionApproachEngagementDuration ?? 0.48,
      stableTime: 0,
      corridorSides: new Map(),
    };
  }

  beginFusion(cellA, cellB, transitionController, now) {
    if (!this.canStartFusion || !cellA || !cellB || cellA === cellB) return false;
    if (cellA.type !== 'fusion' || cellB.type !== 'fusion') return false;
    const resultSpecies=this.fusionResultSpecies(cellA.species,cellB.species);
    if (!resultSpecies) return false;
    if (cellA.state !== 'idle' || cellB.state !== 'idle') return false;
    if (this.#cellInFusionActivity(cellA) || this.#cellInFusionActivity(cellB)) return false;

    const ap=this.#createFusionApproach(cellA,cellB);
    ap.resultSpecies=resultSpecies;
    // Preserve the proven primary fusion path for the first pair. Any further
    // pairs become independent fusion jobs. Only fusion is allowed to overlap.
    if (!this.activeApproach && !this.activeTransition) {
      this.activeApproach=ap;
    } else {
      this.parallelFusions.push({stage:'approach',ap,tr:null,progress:0,duration:Math.max(0.25,transitionController?.profile?.fusionDuration??5.20),dynamics:transitionController?.profile??null,controller:transitionController??null});
    }
    return true;
  }

  #makeFusionTransition(ap) {
    const a = ap.cellA, b = ap.cellB;
    if (!this.cells.includes(a) || !this.cells.includes(b)) return null;
    const dx = b.position[0] - a.position[0];
    const dy = b.position[1] - a.position[1];
    const dist = Math.max(0.0001, length2(dx, dy));
    const angle = Math.atan2(dy, dx);
    const center = [(a.position[0] + b.position[0]) * 0.5, (a.position[1] + b.position[1]) * 0.5];
    const velocity = [(a.velocity[0] + b.velocity[0]) * 0.5, (a.velocity[1] + b.velocity[1]) * 0.5];
    const pairSep = dist * 0.5;
    const phaseA = phaseFromSeed(a.visualSeed), phaseB = phaseFromSeed(b.visualSeed);
    const nucleusSeedA = a.nuclei[0]?.visualSeed ?? a.visualSeed;
    const nucleusSeedB = b.nuclei[0]?.visualSeed ?? b.visualSeed;
    const finalVisualSeed = (a.visualSeed + b.visualSeed) * 0.5 + 0.173;

    this.removeCell(a); this.removeCell(b);
    return {
      kind: 'fusion', species:ap.resultSpecies ?? a.species, speciesA:a.species, speciesB:b.species, hetero:a.species!==b.species, center, velocity, angle,
      sourceRotationA: a.rotation, sourceRotationB: b.rotation,
      startPairSep: pairSep,
      sourceA: a, sourceB: b,
      finalVisualSeed,
      finalInstancePhase: phaseFromSeed(finalVisualSeed),
      sourceShapePhaseA: 1.1 + phaseA,
      sourceShapePhaseB: 1.1 + phaseB,
      nucleusPhaseA: 0.4 + phaseFromSeed(nucleusSeedA),
      nucleusPhaseB: 0.4 + phaseFromSeed(nucleusSeedB),
      sourceFluidPhaseA: phaseA,
      sourceFluidPhaseB: phaseB,
      nuclei: [
        { id: a.nuclei[0].id, visualSeed: nucleusSeedA, offset: [-0.05, 0] },
        { id: b.nuclei[0].id, visualSeed: nucleusSeedB, offset: [ 0.05, 0] },
      ],
      previousPairSep: pairSep,
      currentMechanics:null,
      justStarted: true,
    };
  }

  #startFusionTransition(transitionController, now) {
    const ap = this.activeApproach;
    if (!ap) return false;
    const tr=this.#makeFusionTransition(ap);
    this.activeApproach=null;
    if(!tr) return false;
    this.activeTransition=tr;
    transitionController.beginFusion(now);
    return true;
  }

  #startParallelFusionTransition(job) {
    if(!job || job.stage!=='approach') return false;
    const tr=this.#makeFusionTransition(job.ap);
    if(!tr){ job.cancelled=true; return false; }
    job.stage='transition'; job.tr=tr; job.ap=null; job.progress=0;
    const mechanics=evaluateFusionSplitMechanics({
      raw:0,phase:'fusing',fusionVisual:this.fusionVisual,splitVisual:this.splitVisual,
      dynamics:job.dynamics??{contactResistance:0.92,adhesion:0.88,surfaceTension:0.92,fluidReaction:0,pinchStrength:0.88,recoil:0.62},
      startPairSep:tr.startPairSep,
    });
    tr.currentMechanics=mechanics; tr.previousPairSep=mechanics.pairSep;
    return true;
  }

  #armPhysicsRelease(cell) {
    cell.physicsBlend = 0;
    cell.physicsReleaseProgress = 0;
    cell.angularVelocity = 0;
    return cell;
  }

  completeFusion(transitionController, finalMechanics, now) {
    const tr = this.activeTransition;
    if (!tr || tr.kind !== 'fusion') return null;
    const result = this.#armPhysicsRelease(this.addSplit(
      [...tr.center], [...tr.velocity], tr.angle, tr.nuclei,
      { visualSeed: tr.finalVisualSeed, physicsBlend: 0, species:tr.species ?? 'blue' }
    ));
    this.activeTransition = null;
    transitionController.setSplit();
    this.syncBroodNuclei();
    return result;
  }

  #isFusionTransitionHandoffClear(tr) {
    if(!tr) return true;
    const margin=0.004;
    const pad=this.settings.collisionPadding??0.010;
    const outR=this.splitVisual.radius+pad;
    // Handoffs are serialized by the update order: once one transition emits
    // its output cell, that cell immediately becomes an ordinary obstacle for
    // every other pending transition. Avoid transition-vs-transition mutual
    // waiting here; that was a source of permanent settle deadlocks.
    return this.cells.every(cell=>
      length2(cell.position[0]-tr.center[0],cell.position[1]-tr.center[1]) >=
      outR+this.collisionRadius(cell)+margin
    );
  }

  #completeParallelFusion(job) {
    const tr=job?.tr;
    if(!tr) return null;
    const result=this.#armPhysicsRelease(this.addSplit(
      [...tr.center],[...tr.velocity],tr.angle,tr.nuclei,
      {visualSeed:tr.finalVisualSeed,physicsBlend:0,species:tr.species ?? 'blue'}
    ));
    job.completed=true;
    this.lastEvent={kind:'fusion-complete',parallel:true};
    return result;
  }


  #makeDivisionTransition(splitCell) {
    const inst = phaseFromSeed(splitCell.visualSeed);
    const seedA = splitCell.nuclei[0]?.visualSeed ?? splitCell.visualSeed;
    const seedB = splitCell.nuclei[1]?.visualSeed ?? (splitCell.visualSeed + 1.7);
    const phA = phaseFromSeed(seedA), phB = phaseFromSeed(seedB);

    splitCell.angularVelocity = 0;
    this.removeCell(splitCell);
    return {
      kind: 'division', species:splitCell.species,
      center: [...splitCell.position], velocity: [...splitCell.velocity], angle: splitCell.rotation,
      sourceRotationA: splitCell.rotation, sourceRotationB: splitCell.rotation,
      startPairSep: this.fusionVisual.radius * 0.58,
      sourceSplit: splitCell,
      finalVisualSeed: splitCell.visualSeed, finalInstancePhase: inst,
      sourceShapePhaseA: 1.1 + phA, sourceShapePhaseB: 1.1 + phB,
      nucleusPhaseA: 0.4 + phA, nucleusPhaseB: 0.4 + phB,
      sourceFluidPhaseA: phA, sourceFluidPhaseB: phB,
      nuclei: splitCell.nuclei.map(n => ({ id: n.id, visualSeed: n.visualSeed, offset: [...n.offset] })),
      previousPairSep: this.fusionVisual.radius * 0.58,
      currentMechanics:null,
      justStarted: true,
    };
  }

  beginDivision(splitCell, transitionController, now) {
    if (!this.canStartDivision || !splitCell || splitCell.type !== 'split') return false;
    const tr = this.#makeDivisionTransition(splitCell);
    if (!this.activeTransition && !this.activeApproach) {
      this.activeTransition = tr;
      transitionController.beginDivision(now);
    } else {
      const mechanics=evaluateFusionSplitMechanics({
        raw:0,phase:'dividing',fusionVisual:this.fusionVisual,splitVisual:this.splitVisual,
        dynamics:transitionController?.profile??{contactResistance:0.92,adhesion:0.88,surfaceTension:0.92,fluidReaction:0,pinchStrength:0.88,recoil:0.62},
        startPairSep:tr.startPairSep,
      });
      tr.currentMechanics=mechanics; tr.previousPairSep=mechanics.pairSep;
      this.parallelDivisions.push({stage:'transition',tr,progress:0,duration:Math.max(0.25,transitionController?.profile?.divisionDuration??5.80),dynamics:transitionController?.profile??null,controller:transitionController??null});
    }
    return true;
  }

  recordTransitionMechanics(mechanics) {
    const tr = this.activeTransition;
    if (!tr || !mechanics) return;
    tr.previousPairSep = mechanics.pairSep;
    tr.currentMechanics = { ...mechanics };
  }

  #isDivisionTransitionHandoffClear(tr, finalMechanics = null) {
    if (!tr) return true;
    const margin = 0.004;
    const pad = this.settings.collisionPadding ?? 0.010;
    const sep = finalMechanics?.pairSep ?? tr.previousPairSep;
    const pA = rotateLocal(tr.center, tr.angle, -sep);
    const pB = rotateLocal(tr.center, tr.angle,  sep);
    const outR = this.fusionVisual.radius + pad;
    return this.cells.every(cell => {
      const rr = outR + this.collisionRadius(cell) + margin;
      return length2(cell.position[0] - pA[0], cell.position[1] - pA[1]) >= rr &&
             length2(cell.position[0] - pB[0], cell.position[1] - pB[1]) >= rr;
    });
  }

  isTransitionHandoffClear(finalMechanics) {
    const tr = this.activeTransition;
    if (!tr) return true;
    if (tr.kind === 'fusion') return this.#isFusionTransitionHandoffClear(tr);
    return this.#isDivisionTransitionHandoffClear(tr, finalMechanics);
  }

  #completeDivisionTransition(tr) {
    if (!tr || tr.kind !== 'division') return [];
    const sep = tr.previousPairSep;
    const pA = rotateLocal(tr.center, tr.angle, -sep);
    const pB = rotateLocal(tr.center, tr.angle,  sep);
    const nA = tr.nuclei[0] ?? { visualSeed: tr.finalVisualSeed - 0.4 };
    const nB = tr.nuclei[1] ?? { visualSeed: tr.finalVisualSeed + 0.4 };

    const a = this.#armPhysicsRelease(this.addFusion(
      pA, [...tr.velocity], { id: nA.id, visualSeed: nA.visualSeed, offset: [0, 0] },
      { visualSeed: nA.visualSeed, rotation: tr.angle, physicsBlend: 0, species:tr.species ?? 'blue' }
    ));
    const b = this.#armPhysicsRelease(this.addFusion(
      pB, [...tr.velocity], { id: nB.id, visualSeed: nB.visualSeed, offset: [0, 0] },
      { visualSeed: nB.visualSeed, rotation: tr.angle, physicsBlend: 0, species:tr.species ?? 'blue' }
    ));
    return [a,b];
  }

  #completeParallelDivision(job) {
    const result=this.#completeDivisionTransition(job?.tr);
    job.completed=true;
    this.lastEvent={kind:'division-complete',parallel:true};
    return result;
  }

  completeDivision(transitionController, finalMechanics, now) {
    const tr = this.activeTransition;
    if (!tr || tr.kind !== 'division') return [];
    if(finalMechanics?.pairSep!==undefined) tr.previousPairSep=finalMechanics.pairSep;
    const out=this.#completeDivisionTransition(tr);
    this.activeTransition = null;
    transitionController.reset();
    this.syncBroodNuclei();
    return out;
  }

  beginSwap(cell) {
    if(this.colorMode===3) return false;
    if(this.isBusy || !cell || cell.type!=='swap' || cell.state!=='idle' || !this.cells.includes(cell)) return false;
    this.clearSelection();
    cell.state='swapping';
    cell.angularVelocity=0;
    const from=cell.species;
    const to=from==='green'?'blue':'green';
    this.activeSwap={kind:'swap',cell,elapsed:0,duration:Math.max(0.22,this.switchVisual.swapDuration??0.68),fromSpecies:from,toSpecies:to};
    return true;
  }

  getSwapProgress(cell) {
    const sw=this.activeSwap;
    if(!sw || sw.cell!==cell) return null;
    return clamp(sw.elapsed/Math.max(0.001,sw.duration),0,1);
  }

  #updateSwap(dt) {
    const sw=this.activeSwap;
    if(!sw) return;
    if(!this.cells.includes(sw.cell)){ this.activeSwap=null; return; }
    sw.elapsed=Math.min(sw.duration,sw.elapsed+dt);
    if(sw.elapsed+1e-9<sw.duration) return;
    const cell=sw.cell;
    const fromSpecies=sw.fromSpecies,toSpecies=sw.toSpecies;
    cell.species=toSpecies;
    cell.type='fusion';
    cell.state='idle';
    cell.visualProfile=this.fusionVisual;
    cell.setSelected(false);
    this.activeSwap=null;
    this.syncBroodNuclei();
    this.lastEvent={kind:'swap-complete',cellId:cell.id,fromSpecies,toSpecies};
  }

  #visualForType(type) {
    if(type==='split') return this.splitVisual;
    if(type==='brood') return this.broodVisual;
    if(type==='destruct') return this.destructVisual;
    if(type==='swap') return this.switchVisual;
    if(type==='imitate') return this.mimicVisual;
    return this.fusionVisual;
  }

  beginImitation(source, target) {
    if(this.isBusy || !source || !target || source===target) return false;
    if(source.type!=='imitate' || !this.cells.includes(source) || !this.cells.includes(target)) return false;
    if(this.colorMode===3 && target.type==='swap') return false;
    this.clearSelection();
    source.state='imitating';
    source.angularVelocity=0;
    this.activeImitate={
      kind:'imitate',source,target,elapsed:0,
      duration:Math.max(0.30,this.mimicVisual.imitationDuration??0.78),
      fromSpecies:source.species,toSpecies:target.species,
      targetType:target.type,
    };
    return true;
  }

  getImitateProgress(cell=null) {
    const im=this.activeImitate;
    if(!im) return null;
    if(cell && cell!==im.source) return null;
    return clamp(im.elapsed/Math.max(0.001,im.duration),0,1);
  }

  #updateImitation(dt) {
    const im=this.activeImitate;
    if(!im) return;
    if(!this.cells.includes(im.source)||!this.cells.includes(im.target)){ this.activeImitate=null; return; }
    im.elapsed=Math.min(im.duration,im.elapsed+dt);
    if(im.elapsed+1e-9<im.duration) return;
    const cell=im.source,target=im.target;
    const targetType=target.type;
    const first=cell.nuclei[0] ?? makeNucleus([0,0],null,cell.visualSeed);
    first.offset=[0,0];
    cell.species=target.species;
    cell.type=targetType;
    cell.state='idle';
    cell.visualProfile=this.#visualForType(targetType);
    cell.setSelected(false);
    if(targetType==='split'){
      first.offset=[-0.05,0];
      cell.nuclei=[first,makeNucleus([0.05,0],null,cell.visualSeed+1.73)];
    }else{
      first.offset=[0,0]; cell.nuclei=[first];
    }
    if(targetType!=='brood') cell.broodNuclei=[];
    else { cell.broodNuclei=[]; cell.broodTargetCount=0; }
    const evt={kind:'imitate-complete',cellId:cell.id,targetId:target.id,targetType,toSpecies:cell.species};
    this.activeImitate=null;
    this.syncBroodNuclei();
    this.lastEvent=evt;
  }

  beginDestruction(source, target) {
    if(this.isBusy || !source || !target || source===target) return false;
    if(source.type!=='destruct' || !this.cells.includes(source) || !this.cells.includes(target)) return false;
    this.clearSelection();
    source.state='destructing'; target.state='destructing';
    source.velocity=[0,0]; target.velocity=[0,0];
    source.angularVelocity=0; target.angularVelocity=0;
    source.physicsBlend=0; target.physicsBlend=0;
    this.activeDestruct={
      kind:'destruct',source,target,elapsed:0,
      duration:Math.max(0.30,this.destructVisual.destructDuration??0.72),
      sourceStart:[...source.position],targetStart:[...target.position],
      midpoint:[(source.position[0]+target.position[0])*0.5,(source.position[1]+target.position[1])*0.5],
    };
    return true;
  }

  getDestructProgress(cell=null) {
    const d=this.activeDestruct;
    if(!d) return null;
    if(cell && cell!==d.source && cell!==d.target) return null;
    return clamp(d.elapsed/Math.max(0.001,d.duration),0,1);
  }

  isCellDestructing(cell) {
    const d=this.activeDestruct;
    return Boolean(d && (cell===d.source || cell===d.target));
  }

  #updateDestruction(dt) {
    const d=this.activeDestruct;
    if(!d) return;
    if(!this.cells.includes(d.source)||!this.cells.includes(d.target)){
      this.activeDestruct=null; return;
    }
    d.elapsed=Math.min(d.duration,d.elapsed+dt);
    d.source.velocity[0]=d.source.velocity[1]=0;
    d.target.velocity[0]=d.target.velocity[1]=0;
    const p=smooth01(d.elapsed/Math.max(0.001,d.duration));
    const gather=0.30*p;
    d.source.position[0]=d.sourceStart[0]+(d.midpoint[0]-d.sourceStart[0])*gather;
    d.source.position[1]=d.sourceStart[1]+(d.midpoint[1]-d.sourceStart[1])*gather;
    d.target.position[0]=d.targetStart[0]+(d.midpoint[0]-d.targetStart[0])*gather;
    d.target.position[1]=d.targetStart[1]+(d.midpoint[1]-d.targetStart[1])*gather;
    if(d.elapsed+1e-9<d.duration) return;
    const sourceId=d.source.id,targetId=d.target.id;
    this.removeCell(d.source); this.removeCell(d.target);
    this.activeDestruct=null;
    this.syncBroodNuclei();
    this.lastEvent={kind:'destruct-complete',sourceId,targetId};
  }

  beginBrooding(cell, nowSeconds = 0) {
    if (this.isBusy || !cell || cell.type !== 'brood') return false;
    this.clearSelection();
    this.syncBroodNuclei();
    cell.broodNuclei = cell.broodNuclei.filter(n=>!n.retiring);
    const broodPool = cell.liveBroodNuclei;
    const count = broodPool.length;
    if (count <= 0) return false;

    const smallR = broodNucleusRadius(count, this.broodVisual);
    // Freeze the calm resting layout at activation. Each nucleus splits in
    // its own radial direction; there is no pre-division migration to another
    // wall site.
    const starts = broodPool.map((nucleus, i) =>
      broodNucleusLocalPosition(nucleus, nowSeconds, cell.radius, this.broodVisual, count, i)
    );
    const targets = buildBroodSerialTargetsFromStarts(
      starts, cell.radius, this.fusionVisual.radius,
      this.settings.collisionPadding ?? 0.010
    );
    const birthOrder=orderBroodSerialIndices(starts);
    const buds = birthOrder.map((sourceIndex, serialIndex) => {
      const nucleus=broodPool[sourceIndex];
      const startLocal = starts[sourceIndex];
      const targetLocal = targets[sourceIndex];
      return {
        index:serialIndex, sourceIndex,
        nucleusId:nucleus.id,
        nucleusSeed:nucleus.visualSeed,
        visualSeed:nucleus.visualSeed + 0.417,
        rotation:Math.atan2(targetLocal[1], targetLocal[0]),
        startLocal:[...startLocal],
        targetLocal:[...targetLocal],
        smallNucleusRadius:smallR,
      };
    });

    cell.state = 'brooding';
    cell.setSelected(false);
    cell.angularVelocity = 0;
    this.activeBrood = {
      kind:'brood', cell, buds,
      currentIndex:0,
      elapsed:0,
      migrationDuration:0,
      divisionDuration:Math.max(0.8, this.broodVisual.broodDivisionDuration ?? 3.10),
      startedAt:nowSeconds,
      holding:false,
      created:[],
    };
    return true;
  }

  getBroodActiveState() {
    const br=this.activeBrood;
    if(!br) return null;
    const bud=br.buds[br.currentIndex];
    if(!bud) return null;
    const timeline=evaluateBroodStep({
      bud, elapsed:br.elapsed, parentRadius:br.cell.radius,
      divisionDuration:br.divisionDuration,
    });
    let mechanics=evaluateFusionSplitMechanics({
      raw:timeline.divisionRaw,
      phase:'dividing',
      fusionVisual:this.fusionVisual,
      splitVisual:this.splitVisual,
      dynamics:{ contactResistance:0.92, adhesion:0.88, surfaceTension:0.92, fluidReaction:0, pinchStrength:0.88, recoil:0.42 },
      startPairSep:this.fusionVisual.radius*0.58,
    });
    // Reuse the exact Split curve but stretch its separation so the child ends
    // at this bud's collision-safe target while the mother remains at local 0.
    const inner=this.fusionVisual.radius*0.58;
    const release=this.fusionVisual.radius*1.005+0.018;
    const p=Math.max(0,Math.min(1,(mechanics.pairSep-inner)/Math.max(1e-6,release-inner)));
    const targetHalf=Math.hypot(bud.targetLocal[0],bud.targetLocal[1])*0.5;
    mechanics={...mechanics,pairSep:inner+(targetHalf-inner)*p};
    /* Brood-specific nucleus timing. The small nucleus starts at its calm
       resting position and remains there while the mother silhouette is still
       closed. It moves/grows outward only with the same relax curve that
       reveals the Split-derived lobe. */
    mechanics={...mechanics,nucleusMove:mechanics.relax};
    return {br,bud,timeline,mechanics};
  }

  #broodCurrentHandoffClear(state) {
    if(!state) return true;
    const {br,bud}=state, parent=br.cell;
    const p=[parent.position[0]+bud.targetLocal[0], parent.position[1]+bud.targetLocal[1]];
    const outR=this.fusionVisual.radius+(this.settings.collisionPadding??0.010);
    for(const cell of this.cells){
      if(cell===parent) continue;
      const min=outR+this.collisionRadius(cell)+0.004;
      if(length2(cell.position[0]-p[0],cell.position[1]-p[1])<min) return false;
    }
    return true;
  }

  #finishCurrentBroodDivision() {
    const state=this.getBroodActiveState();
    if(!state) return;
    const {br,bud}=state, parent=br.cell;
    const p=[parent.position[0]+bud.targetLocal[0],parent.position[1]+bud.targetLocal[1]];
    const n={id:bud.nucleusId,visualSeed:bud.nucleusSeed,offset:[0,0]};
    const dirLen=Math.max(1e-6,Math.hypot(bud.targetLocal[0],bud.targetLocal[1]));
    const dx=bud.targetLocal[0]/dirLen,dy=bud.targetLocal[1]/dirLen;
    const releaseSpeed=Math.min(0.11,this.settings.temporaryYieldMaxSpeed??0.12);
    const child=this.#armPhysicsRelease(this.addFusion(p,[parent.velocity[0]+dx*releaseSpeed,parent.velocity[1]+dy*releaseSpeed],n,{
      visualSeed:bud.visualSeed,rotation:parent.rotation,physicsBlend:0,species:parent.species,
    }));
    if(child){ child.corridorYield=1; child.broodReleaseTime=1.35; br.created.push(child); }
    parent.broodNuclei=parent.broodNuclei.filter(nuc=>nuc.id!==bud.nucleusId);
    br.currentIndex++;
    br.elapsed=0;
    br.holding=false;

    if(br.currentIndex>=br.buds.length){
      parent.type='fusion';
      parent.state='idle';
      parent.visualProfile=this.fusionVisual;
      parent.broodNuclei.length=0;
      const created=br.created.length;
      this.activeBrood=null;
      this.syncBroodNuclei();
      this.lastEvent={kind:'brood-complete',created,parentId:parent.id};
    }
  }

  #applyBroodForces(force, dt) {
    const br=this.activeBrood;
    if(!br || !this.cells.includes(br.cell)){
      if(br) this.activeBrood=null;
      return;
    }
    br.elapsed += dt;
    const parent=br.cell;
    this.#addForce(force,parent,-parent.velocity[0]*0.42,-parent.velocity[1]*0.42);
    // Already-born daughters keep drifting gently away from the mother while
    // later serial buds form. This prevents high-N Brood runs from stalling
    // because an earlier daughter is still sitting in the next pinch-off zone.
    for(const child of br.created){
      if(!child||!this.cells.includes(child)) continue;
      const dx=child.position[0]-parent.position[0],dy=child.position[1]-parent.position[1];
      const dist=Math.max(1e-6,length2(dx,dy));
      child.corridorYield=Math.max(child.corridorYield??0,0.92);
      this.#addForce(force,child,dx/dist*0.26,dy/dist*0.26);
    }
    const state=this.getBroodActiveState();
    if(!state) return;
    const {bud,timeline,mechanics}=state;
    if(timeline.stage!=='division') return;

    const localDist=mechanics.pairSep*2;
    const cx=parent.position[0]+Math.cos(bud.rotation)*localDist;
    const cy=parent.position[1]+Math.sin(bud.rotation)*localDist;
    const body=Math.max(timeline.divisionRaw, mechanics.stretch, mechanics.pinch);
    const obstacleR=this.fusionVisual.radius+(this.settings.collisionPadding??0.010);
    for(const other of this.cells){
      if(other===parent) continue;
      const dx=other.position[0]-cx,dy=other.position[1]-cy;
      const dist=Math.max(0.0001,length2(dx,dy));
      const minDist=obstacleR+this.collisionRadius(other)+0.004;
      const influence=minDist+0.060;
      if(dist>=influence) continue;
      const pressure=broodSmooth01((influence-dist)/Math.max(0.001,influence-minDist*0.82))*0.34*body;
      other.corridorYield=Math.max(other.corridorYield??0,body);
      this.#addForce(force,other,dx/dist*pressure,dy/dist*pressure);
    }
  }

  #addForce(forceMap, cell, fx, fy) {
    const f = forceMap.get(cell.id);
    if (!f) return;
    f[0] += fx; f[1] += fy;
  }

  #updatePhysicsRelease(dt) {
    for (const cell of this.cells) {
      if (cell.physicsReleaseProgress === undefined || cell.physicsReleaseProgress === null) continue;
      cell.physicsReleaseProgress += dt / 0.42;
      const p = clamp(cell.physicsReleaseProgress, 0, 1);
      cell.physicsBlend = smooth01(p);
      if (p >= 1) { cell.physicsBlend = 1; cell.physicsReleaseProgress = null; }
    }
  }

  #applyOneApproach(force, dt, ap) {
    if (!ap || !this.cells.includes(ap.cellA) || !this.cells.includes(ap.cellB)) return false;

    const a = ap.cellA, b = ap.cellB;
    const dx = b.position[0] - a.position[0], dy = b.position[1] - a.position[1];
    const dist = Math.max(0.0001, length2(dx, dy));
    const nx = dx / dist, ny = dy / dist;

    ap.elapsed = Math.min(ap.elapsed + dt, ap.duration + 2.0);
    ap.engagement = clamp(ap.engagement + dt / Math.max(0.05, ap.engagementDuration), 0, 1);
    const engage = smooth01(ap.engagement);
    const u = clamp(ap.elapsed / Math.max(0.001, ap.duration), 0, 1);
    const u2 = u * u, u3 = u2 * u;
    const easeRate = (30 * u2 * (1 - u) * (1 - u)) / Math.max(0.001, ap.duration);
    const originalTravel = Math.max(0, ap.startDistance - ap.targetDistance);
    const feedForward = originalTravel * easeRate;
    const plannedEase = u3 * (10 + u * (-15 + 6 * u));
    const plannedDist = ap.targetDistance + originalTravel * (1 - plannedEase);
    const tracking = Math.max(0, dist - plannedDist) * (this.settings.fusionApproachTrackResponse ?? 3.8);
    const closingSpeed = Math.min(
      this.settings.fusionApproachMaxClosingSpeed ?? 0.22,
      feedForward + tracking
    ) * engage;

    const centerVx = (a.velocity[0] + b.velocity[0]) * 0.5;
    const centerVy = (a.velocity[1] + b.velocity[1]) * 0.5;
    const targetAVx = centerVx + nx * closingSpeed * 0.5;
    const targetAVy = centerVy + ny * closingSpeed * 0.5;
    const targetBVx = centerVx - nx * closingSpeed * 0.5;
    const targetBVy = centerVy - ny * closingSpeed * 0.5;
    const response = (this.settings.fusionApproachResponse ?? 6.0) * engage;
    this.#addForce(force, a, (targetAVx - a.velocity[0]) * response, (targetAVy - a.velocity[1]) * response);
    this.#addForce(force, b, (targetBVx - b.velocity[0]) * response, (targetBVy - b.velocity[1]) * response);

    /* Stable material orientation: cells translate into contact; they never
       pre-rotate toward the interaction axis. */
    a.angularVelocity = 0; b.angularVelocity = 0;

    /* Slow corridor clearing. A bystander keeps one side for the whole approach,
       eliminating centre-line sign flips. Speed caps below make this pressure
       incapable of turning into a visible ejection. */
    const sx = a.position[0], sy = a.position[1], ex = b.position[0], ey = b.position[1];
    const segx = ex - sx, segy = ey - sy, segLen2 = Math.max(0.0001, segx * segx + segy * segy);
    for (const other of this.cells) {
      if (other === a || other === b) continue;
      const ox = other.position[0] - sx, oy = other.position[1] - sy;
      const t = clamp((ox * segx + oy * segy) / segLen2, 0, 1);
      const qx = sx + segx * t, qy = sy + segy * t;
      const rx = other.position[0] - qx, ry = other.position[1] - qy;
      const rd = length2(rx, ry);
      const clearance = this.collisionRadius(other) + this.collisionRadius(a) + 0.055;
      if (rd >= clearance) continue;

      const px = -ny, py = nx;
      let side = ap.corridorSides.get(other.id);
      if (side === undefined) {
        const signed = rx * px + ry * py;
        side = Math.abs(signed) > 0.0005 ? (signed >= 0 ? 1 : -1) : ((other.id % 2) ? 1 : -1);
        ap.corridorSides.set(other.id, side);
      }
      const yieldAmount = smooth01((clearance - rd) / clearance) * engage;
      other.corridorYield = Math.max(other.corridorYield ?? 0, yieldAmount);
      const strength = yieldAmount * (this.settings.corridorPush ?? 0.20);
      this.#addForce(force, other, px * side * strength, py * side * strength);
    }

    const rvx = b.velocity[0] - a.velocity[0], rvy = b.velocity[1] - a.velocity[1];
    const relativeSpeed = length2(rvx, rvy);
    if (dist <= ap.targetDistance + 0.0025 && relativeSpeed < 0.022 && engage >= 0.999) ap.stableTime += dt;
    else ap.stableTime = 0;
    return true;
  }

  #applyApproachForces(force, dt) {
    if(this.activeApproach && !this.#applyOneApproach(force,dt,this.activeApproach)) this.activeApproach=null;
    for(const job of this.parallelFusions){
      if(job.stage!=='approach') continue;
      if(!this.#applyOneApproach(force,dt,job.ap)) job.cancelled=true;
    }
  }

  #isApproachPair(a,b) {
    const match=ap=>Boolean(ap && ((a===ap.cellA&&b===ap.cellB)||(b===ap.cellA&&a===ap.cellB)));
    if(match(this.activeApproach)) return true;
    return this.parallelFusions.some(job=>job.stage==='approach'&&match(job.ap));
  }

  #cellInApproach(cell) {
    if(this.activeApproach && (cell===this.activeApproach.cellA||cell===this.activeApproach.cellB)) return true;
    return this.parallelFusions.some(job=>job.stage==='approach'&&job.ap&&(cell===job.ap.cellA||cell===job.ap.cellB));
  }

  #applyCollisionSprings(force) {
    const softness = this.settings.collisionSoftness ?? 0.88;
    for (let i = 0; i < this.cells.length; i++) {
      for (let j = i + 1; j < this.cells.length; j++) {
        const a = this.cells[i], b = this.cells[j];
        if (this.#isApproachPair(a,b)) continue;

        let dx = b.position[0] - a.position[0], dy = b.position[1] - a.position[1];
        const dist = Math.max(0.0001, length2(dx, dy));
        const nx = dx / dist, ny = dy / dist;
        const rest = this.collisionRadius(a) + this.collisionRadius(b);
        const influence = rest + 0.040;
        if (dist >= influence) continue;
        const pressure = smooth01((influence - dist) / Math.max(0.001, influence - rest * 0.82));
        const spring = pressure * (this.settings.collisionSpring ?? 0.58) * softness;
        const total = a.mass + b.mass;
        const aShare = b.mass / total, bShare = a.mass / total;
        this.#addForce(force, a, -nx * spring * aShare, -ny * spring * aShare);
        this.#addForce(force, b,  nx * spring * bShare,  ny * spring * bShare);
      }
    }
  }

  #applyBoundarySprings(force, bounds) {
    for (const cell of this.cells) {
      const r = this.collisionRadius(cell) + this.settings.boundaryPadding;
      const margin = 0.080;
      const leftDist = (cell.position[0] - r) - bounds.left;
      const rightDist = bounds.right - (cell.position[0] + r);
      const bottomDist = (cell.position[1] - r) - bounds.bottom;
      const topDist = bounds.top - (cell.position[1] + r);
      const k = this.settings.boundarySpring ?? 0.72;
      if (leftDist < margin) this.#addForce(force, cell,  k * smooth01((margin - leftDist) / margin), 0);
      if (rightDist < margin) this.#addForce(force, cell, -k * smooth01((margin - rightDist) / margin), 0);
      if (bottomDist < margin) this.#addForce(force, cell, 0,  k * smooth01((margin - bottomDist) / margin));
      if (topDist < margin) this.#addForce(force, cell, 0, -k * smooth01((margin - topDist) / margin));
    }
  }

  #updateOneTransitionBody(force, dt, damp, tr) {
    if (!tr) return;
    if (!tr.justStarted) {
      tr.center[0] += tr.velocity[0] * dt;
      tr.center[1] += tr.velocity[1] * dt;
      tr.velocity[0] *= damp; tr.velocity[1] *= damp;
    }

    const pad = this.settings.collisionPadding ?? 0.010;
    const raw = tr.currentMechanics?.raw ?? 0;
    const boost = tr.kind === 'fusion' ? smooth01((raw - 0.70) / 0.30) : smooth01((raw - 0.58) / 0.42);

    // v0.4.1: a Division does not hand off at its centre: it creates two
    // Fusion cells at +/- pairSep. Clear those actual daughter positions while
    // the authored animation is finishing. This removes the old deadlock where
    // a bystander could sit on a daughter endpoint forever even though the
    // transition looked visually complete. Fusion keeps its single centre body.
    const obstacles = [];
    if (tr.kind === 'division') {
      const sep = tr.currentMechanics?.pairSep ?? tr.previousPairSep ?? (this.fusionVisual.radius * 0.58);
      const outR = this.fusionVisual.radius + pad;
      obstacles.push({p:rotateLocal(tr.center,tr.angle,-sep),r:outR});
      obstacles.push({p:rotateLocal(tr.center,tr.angle, sep),r:outR});
    } else {
      obstacles.push({p:tr.center,r:this.splitVisual.radius + pad});
    }

    for (const cell of this.cells) {
      for (const obstacle of obstacles) {
        let dx = cell.position[0] - obstacle.p[0], dy = cell.position[1] - obstacle.p[1];
        let dist = length2(dx, dy);
        // A perfectly coincident bystander has no usable radial direction. Give
        // it a deterministic sideways escape vector instead of leaving it stuck.
        if (dist < 0.0001) {
          const side = (cell.id & 1) ? 1 : -1;
          dx = Math.cos(tr.angle + side * Math.PI * 0.5);
          dy = Math.sin(tr.angle + side * Math.PI * 0.5);
          dist = 1;
        }
        const minDist = this.collisionRadius(cell) + obstacle.r + 0.004;
        const influence = minDist + 0.060 + 0.030 * boost;
        const actualDist = length2(cell.position[0] - obstacle.p[0], cell.position[1] - obstacle.p[1]);
        if (actualDist >= influence) continue;
        const pressure = smooth01((influence - actualDist) / Math.max(0.001, influence - minDist * 0.82)) * (0.24 + 0.26 * boost);
        this.#addForce(force, cell, dx / dist * pressure, dy / dist * pressure);
        cell.corridorYield = Math.max(cell.corridorYield ?? 0, 0.72 * boost);
      }
    }
  }

  #updateTransitionBody(force, dt, damp) {
    this.#updateOneTransitionBody(force,dt,damp,this.activeTransition);
    for(const job of this.parallelFusions) if(job.stage==='transition') this.#updateOneTransitionBody(force,dt,damp,job.tr);
    for(const job of this.parallelDivisions) if(job.stage==='transition') this.#updateOneTransitionBody(force,dt,damp,job.tr);
  }

  #updateParallelFusionProgress(dt) {
    for(const job of this.parallelFusions){
      if(job.stage!=='transition'||!job.tr) continue;
      const tr=job.tr;
      const fusionDuration=Math.max(0.25,job.duration??5.20);
      if(!tr.justStarted) job.progress=clamp(job.progress+dt*(job.controller?.playbackSpeed??1)/fusionDuration,0,1);
      const mechanics=evaluateFusionSplitMechanics({
        raw:job.progress,phase:'fusing',fusionVisual:this.fusionVisual,splitVisual:this.splitVisual,
        dynamics:job.dynamics??{contactResistance:0.92,adhesion:0.88,surfaceTension:0.92,fluidReaction:0,pinchStrength:0.88,recoil:0.62},
        startPairSep:tr.startPairSep,
      });
      tr.previousPairSep=mechanics.pairSep;
      tr.currentMechanics=mechanics;
    }
  }


  #updateParallelDivisionProgress(dt) {
    for(const job of this.parallelDivisions){
      if(job.stage!=='transition'||!job.tr) continue;
      const tr=job.tr;
      const divisionDuration=Math.max(0.25,job.duration??5.80);
      if(!tr.justStarted) job.progress=clamp(job.progress+dt*(job.controller?.playbackSpeed??1)/divisionDuration,0,1);
      const mechanics=evaluateFusionSplitMechanics({
        raw:job.progress,phase:'dividing',fusionVisual:this.fusionVisual,splitVisual:this.splitVisual,
        dynamics:job.dynamics??{contactResistance:0.92,adhesion:0.88,surfaceTension:0.92,fluidReaction:0,pinchStrength:0.88,recoil:0.62},
        startPairSep:tr.startPairSep,
      });
      tr.previousPairSep=mechanics.pairSep;
      tr.currentMechanics=mechanics;
    }
  }

  #integrateVelocities(force, dt, damp) {
    for (const cell of this.cells) {
      const f = force.get(cell.id) ?? [0, 0];
      const blend = cell.physicsBlend ?? 1;
      let fx = f[0] * blend, fy = f[1] * blend;
      const isApproach = this.#cellInApproach(cell);
      const yieldBlend = smooth01(cell.corridorYield ?? 0);

      let maxAcc = isApproach
        ? (this.settings.fusionApproachMaxAcceleration ?? 0.32)
        : (this.settings.maxAcceleration ?? 0.22) +
          ((this.settings.temporaryYieldMaxAcceleration ?? 0.32) - (this.settings.maxAcceleration ?? 0.22)) * yieldBlend;
      if((cell.broodReleaseTime??0)>0) maxAcc=Math.max(maxAcc,0.48);
      const acc = length2(fx, fy);
      if (acc > maxAcc) { fx *= maxAcc / acc; fy *= maxAcc / acc; }

      cell.velocity[0] = (cell.velocity[0] + fx * dt) * damp;
      cell.velocity[1] = (cell.velocity[1] + fy * dt) * damp;

      let maxSpeed = isApproach
        ? (this.settings.fusionApproachCellMaxSpeed ?? 0.120)
        : (this.settings.maxSpeed ?? 0.090) +
          ((this.settings.temporaryYieldMaxSpeed ?? 0.120) - (this.settings.maxSpeed ?? 0.090)) * yieldBlend;
      if((cell.broodReleaseTime??0)>0) maxSpeed=Math.max(maxSpeed,0.18);
      const speed = length2(cell.velocity[0], cell.velocity[1]);
      if (speed > maxSpeed) {
        cell.velocity[0] *= maxSpeed / speed;
        cell.velocity[1] *= maxSpeed / speed;
      }
    }
  }

  #solvePairVelocityBarriers(dt) {
    const contactMargin = 0.0025;
    for (let sweep = 0; sweep < 12; sweep++) {
      for (let i = 0; i < this.cells.length; i++) {
        for (let j = i + 1; j < this.cells.length; j++) {
          const a = this.cells[i], b = this.cells[j];
          const apPair = this.#isApproachPair(a,b);

          const dx = b.position[0] - a.position[0], dy = b.position[1] - a.position[1];
          const dist = Math.max(0.0001, length2(dx, dy));
          const nx = dx / dist, ny = dy / dist, tx = -ny, ty = nx;
          const physicalSafe = this.collisionRadius(a) + this.collisionRadius(b) + contactMargin;
          let requestedSafe=physicalSafe;
          if(apPair){
            const aps=[this.activeApproach,...this.parallelFusions.filter(j=>j.stage==='approach').map(j=>j.ap)].filter(Boolean);
            const ap=aps.find(x=>(a===x.cellA&&b===x.cellB)||(b===x.cellA&&a===x.cellB));
            requestedSafe=Math.max(physicalSafe,ap?.targetDistance??physicalSafe);
          }
          const safeDist = Math.min(requestedSafe, dist);

          const rvx = b.velocity[0] - a.velocity[0], rvy = b.velocity[1] - a.velocity[1];
          const vn = rvx * nx + rvy * ny;
          const vt = rvx * tx + rvy * ty;
          const tangentialStep = vt * dt;
          const radialTarget = Math.sqrt(Math.max(0, safeDist * safeDist - tangentialStep * tangentialStep));
          const minVn = (radialTarget - dist) / Math.max(dt, 0.0001);
          if (vn >= minVn) continue;

          const delta = minVn - vn;
          const vaN = a.velocity[0] * nx + a.velocity[1] * ny;
          const vbN = b.velocity[0] * nx + b.velocity[1] * ny;
          const aClosing = Math.max(0, vaN);
          const bClosing = Math.max(0, -vbN);
          const capacity = aClosing + bClosing;
          if (capacity <= EPS) continue;
          const fraction = Math.min(1, delta / capacity);
          a.velocity[0] -= nx * aClosing * fraction;
          a.velocity[1] -= ny * aClosing * fraction;
          b.velocity[0] += nx * bClosing * fraction;
          b.velocity[1] += ny * bClosing * fraction;
        }
      }
    }
  }

  #solveBoundaryVelocityBarriers(bounds, dt) {
    for (const cell of this.cells) {
      const r = this.collisionRadius(cell) + this.settings.boundaryPadding;
      const minX = bounds.left + r, maxX = bounds.right - r;
      const minY = bounds.bottom + r, maxY = bounds.top - r;
      if (cell.position[0] + cell.velocity[0] * dt < minX && cell.velocity[0] < 0) cell.velocity[0] = 0;
      if (cell.position[0] + cell.velocity[0] * dt > maxX && cell.velocity[0] > 0) cell.velocity[0] = 0;
      if (cell.position[1] + cell.velocity[1] * dt < minY && cell.velocity[1] < 0) cell.velocity[1] = 0;
      if (cell.position[1] + cell.velocity[1] * dt > maxY && cell.velocity[1] > 0) cell.velocity[1] = 0;
    }
  }

  update(dt, bounds, now, transitionController) {
    if (!(dt > 0)) return;
    this.#updatePhysicsRelease(dt);
    this.#updateDestruction(dt);
    this.#updateSwap(dt);
    this.#updateImitation(dt);
    this.#updateParallelFusionProgress(dt);
    this.#updateParallelDivisionProgress(dt);
    const damp = Math.pow(this.settings.driftDamping, dt * 60);

    for (const cell of this.cells) {
      cell.angularVelocity = 0; // v0.7: no autonomous cell spin at all.
      cell.corridorYield = Math.max(0, (cell.corridorYield ?? 0) - dt * 1.8);
      if((cell.broodReleaseTime??0)>0) cell.broodReleaseTime=Math.max(0,cell.broodReleaseTime-dt);
      if (cell.type === 'brood' && (!this.activeBrood || this.activeBrood.cell !== cell)) {
        for (const n of cell.broodNuclei) {
          if (n.retiring) n.retireAge = Math.min(1, (n.retireAge ?? 0) + dt / 0.42);
          else n.age = Math.min(1, (n.age ?? 0) + dt / 0.55);
        }
        cell.broodNuclei = cell.broodNuclei.filter(n=>!n.retiring || (n.retireAge??0)<1);
      }
    }

    const force = new Map(this.cells.map(c => [c.id, [0, 0]]));
    for (const cell of this.cells) {
      const wander = 0.010;
      this.#addForce(force, cell,
        Math.sin(cell.id * 2.71 + cell.position[1] * 7.4 + now * 0.00012) * wander,
        Math.cos(cell.id * 1.93 + cell.position[0] * 6.8 + now * 0.00010) * wander
      );
    }

    this.#applyApproachForces(force, dt);
    this.#applyBroodForces(force, dt);
    this.#applyCollisionSprings(force);
    this.#applyBoundarySprings(force, bounds);
    this.#updateTransitionBody(force, dt, damp);
    this.#integrateVelocities(force, dt, damp);
    this.#solvePairVelocityBarriers(dt);
    this.#solveBoundaryVelocityBarriers(bounds, dt);

    for (const cell of this.cells) {
      cell.position[0] += cell.velocity[0] * dt;
      cell.position[1] += cell.velocity[1] * dt;
      // Rotation is a persistent material frame, not a free physics variable.
    }

    const ap = this.activeApproach;
    if (ap && ap.stableTime >= 0.050) this.#startFusionTransition(transitionController, now);

    for(const job of this.parallelFusions){
      if(job.cancelled||job.completed) continue;
      if(job.stage==='approach' && job.ap?.stableTime>=0.050) this.#startParallelFusionTransition(job);
      if(job.stage==='transition' && job.progress>=1 && this.#isFusionTransitionHandoffClear(job.tr)){
        this.#completeParallelFusion(job);
      }
    }
    const completedParallel=this.parallelFusions.some(j=>j.completed);
    this.parallelFusions=this.parallelFusions.filter(j=>!j.cancelled&&!j.completed);

    for(const job of this.parallelDivisions){
      if(job.completed) continue;
      if(job.stage==='transition' && job.progress>=1 && this.#isDivisionTransitionHandoffClear(job.tr)){
        this.#completeParallelDivision(job);
      }
    }
    const completedParallelDiv=this.parallelDivisions.some(j=>j.completed);
    this.parallelDivisions=this.parallelDivisions.filter(j=>!j.completed);
    if(completedParallel || completedParallelDiv) this.syncBroodNuclei();

    const br = this.activeBrood;
    if (br) {
      const state=this.getBroodActiveState();
      if(state && state.timeline.complete){
        br.holding=!this.#broodCurrentHandoffClear(state);
        if(!br.holding) this.#finishCurrentBroodDivision();
      }
    }
  }
}
