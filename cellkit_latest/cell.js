import { createBroodNucleus } from './brood.js?v=0.12.1';

let NEXT_CELL_ID = 1;
let NEXT_NUCLEUS_ID = 1;

export function makeNucleus(offset = [0, 0], id = null, visualSeed = null) {
  const resolvedId = id ?? NEXT_NUCLEUS_ID++;
  return {
    id: resolvedId,
    offset: [...offset],
    visualSeed: visualSeed ?? resolvedId * 1.137,
  };
}

export class Cell {
  constructor({
    id = null,
    type = 'fusion',
    species = 'blue',
    position = [0, 0],
    velocity = [0, 0],
    rotation = 0,
    angularVelocity = 0,
    visualSeed = null,
    visualProfile = {},
    nuclei = null,
    state = 'idle',
    physicsBlend = 1,
    broodNuclei = null,
  } = {}) {
    this.id = id ?? NEXT_CELL_ID++;
    this.type = type;
    this.species = species === 'green' ? 'green' : species === 'violet' ? 'violet' : 'blue';
    this.position = [...position];
    this.velocity = [...velocity];
    this.rotation = rotation;
    this.angularVelocity = angularVelocity;
    this.visualSeed = visualSeed ?? (this.id * 0.917 + 0.31);
    this.visualProfile = visualProfile;
    this.state = state;
    this.selected = false;
    this.physicsBlend = physicsBlend;

    if (nuclei) {
      this.nuclei = nuclei.map(n => makeNucleus(n.offset ?? [0, 0], n.id, n.visualSeed));
    } else if (type === 'split') {
      this.nuclei = [
        makeNucleus([-0.05, 0], null, this.visualSeed + 0.21),
        makeNucleus([ 0.05, 0], null, this.visualSeed + 1.73),
      ];
    } else {
      this.nuclei = [makeNucleus([0, 0], null, this.visualSeed)];
    }

    this.broodNuclei = Array.isArray(broodNuclei) ? broodNuclei.map((n, i) => ({
      ...createBroodNucleus(i, this.visualSeed, n.id ?? null),
      ...n,
    })) : [];
    this.broodTargetCount = this.broodNuclei.filter(n=>!n.retiring).length;
  }

  get radius() { return this.visualProfile.radius ?? 0.15; }
  get mass() { return Math.max(0.01, this.radius * this.radius); }

  containsPoint(x, y, scale = 1.12) {
    return Math.hypot(x - this.position[0], y - this.position[1]) <= this.radius * scale;
  }

  setSelected(value) { this.selected = Boolean(value); }

  get liveBroodNuclei() { return this.broodNuclei.filter(n=>!n.retiring); }

  ensureBroodNuclei(count) {
    if (this.type !== 'brood') return;
    const target = Math.max(0, Math.floor(Number(count) || 0));
    this.broodTargetCount = target;
    let live = this.liveBroodNuclei;

    // If N rises again while an old nucleus is still fading, reuse it first.
    if (live.length < target) {
      const retiring = this.broodNuclei.filter(n=>n.retiring);
      while (live.length < target && retiring.length) {
        const n=retiring.shift();
        n.retiring=false; n.retireAge=0; n.age=Math.max(0.15,n.age??0);
        live.push(n);
      }
    }
    while (live.length < target) {
      const i = this.broodNuclei.length;
      const n=createBroodNucleus(i, this.visualSeed, NEXT_NUCLEUS_ID++);
      this.broodNuclei.push(n); live.push(n);
    }
    if (live.length > target) {
      // Fade the newest/exterior nuclei first; never hard-delete a visible one.
      const excess=live.length-target;
      live.slice(-excess).forEach(n=>{n.retiring=true;n.retireAge=0;});
    }
  }
}
