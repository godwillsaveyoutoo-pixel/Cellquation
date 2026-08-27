# CELLQUATION v0.7.7a — Audio Research & Visual Recovery

## Status

This is deliberately **not** a new soundtrack build.

v0.7.7a has two jobs only:

1. restore the proven v0.7.6.4.13 visual/game baseline so cell readability is safe again;
2. research what the next audio prototype should actually sound like before creating or integrating new audio.

The v0.7.7 audio runtime and all v0.7.7 audio assets are **not active in this build**.

---

## 1. Post-mortem: why v0.7.7 ambience felt like a vacuum cleaner

The rejected file `ambience_deepsea_loop.ogg` was analysed separately from this recovery build.

Measured properties:

- integrated loudness: approximately **-14.7 LUFS**
- loudness range: approximately **2.2 LU**
- true peak: approximately **-2.2 dBFS**
- approximately **79.1% of measured spectral power from 20 Hz–16 kHz lies between 20–100 Hz**
- only about **0.2%** lies between 3–8 kHz

The in-game volume attenuated this file, so loudness alone was not the main fault. The deeper problem was **spectral and temporal character**:

- far too much continuous sub/low-frequency energy;
- very little dynamic ebb and flow;
- almost no airy or biological high-frequency detail;
- a long, stable noise bed instead of a changing ecosystem.

That combination readily reads as machinery, ventilation, pressure or an engine-like hum — exactly the unwanted “vacuum cleaner” association.

The other v0.7.7 music stems were also very dense as source files (roughly -12.9, -13.4 and -9.2 LUFS, with only 0.5–1.5 LU loudness range). Their in-game gains were lower, but the source design still left too little natural silence and variation.

---

## 2. What real underwater soundscapes suggest

### NOAA: underwater is not silent, but it is not one continuous drone either

NOAA describes ocean soundscapes as mixtures of:

- **biotic** sound: fish, invertebrates, marine mammals;
- **abiotic** sound: waves, rain and other physical processes;
- **anthropogenic** sound: vessels, sonar and other human activity.

This is important for Cellquation: merely making a low-frequency drone and calling it “underwater” can accidentally imitate the anthropogenic portion of an ocean soundscape rather than an organic ecosystem.

NOAA's Cordell Bank work specifically reports that very-low-frequency sound can be strongly influenced by both large vessels and baleen whales, with vessel contributions relatively omnipresent. A continuous low band is therefore a poor shortcut for “natural deep sea”.

Sources:
- NOAA Fisheries — Environmental and Anthropogenic Ocean Sounds: https://www.fisheries.noaa.gov/national/science-data/sounds-ocean-environmental-and-anthropogenic
- NOAA Ocean Service — What is a hydrophone?: https://oceanservice.noaa.gov/facts/hydrophone.html
- NOAA repository — Cordell Bank low-frequency soundscape: https://repository.library.noaa.gov/view/noaa/52398

### Game-audio guidance: variation + silence prevent fatigue

Audiokinetic/Wwise describes successful ambience as a combination of a background layer and randomized environmental elements, including weighted silence. Their stated goal is a non-repetitive soundscape that reduces listening fatigue.

The LIMBO audio case study is also useful conceptually: rather than relying on one looping noise bed, ambience was decomposed into fragments and regenerated in varying structures; near-silence was part of the aesthetic language.

Sources:
- Audiokinetic, Wwise Project Adventure: https://www.audiokinetic.com/download/documents/WwiseProjectAdventure_en.pdf
- Audiokinetic, Playdead/LIMBO customer profile: https://www.audiokinetic.com/download/documents/customer_profiles/Audiokinetic_Customer_Profile_Playdead_July2010.pdf

### Mobile playback has limited dynamic range

Phones have much less acoustic and dynamic range than headphones or larger speakers. A low-frequency-heavy design often collapses into a generic hum on a small speaker because the phone cannot reproduce the lowest fundamentals faithfully and their upper harmonics dominate perception.

Therefore Cellquation audio must be judged on the actual target phone, not only on desktop headphones.

Sources:
- ITU-T H.872 — Safe listening for video gameplay and esports: https://www.itu.int/epublications/publication/itu-t-h-872-2024-10-safe-listening-for-video-gameplay-and-esports
- Plarium — Mobile Audio: Challenges and Solutions: https://company.plarium.com/en/articles/mobile-audio-challenges-and-solutions/

---

## 3. New Cellquation audio principles

The next audio prototype must obey these rules.

### A. Silence is part of the soundtrack

No permanent tonal drone is allowed.

A player should be able to sit in an idle level and occasionally experience almost-silence. The world should breathe rather than continuously fill the spectrum.

### B. Ambient does not mean “low-frequency noise”

Avoid continuous strong energy below roughly 100 Hz. Low frequencies may appear as rare distant events, but never as the defining bed.

### C. The world is made of living micro-events

Instead of one large loop, use a tiny neutral bed plus sparse independent events such as:

- a distant soft organic click;
- a muted bubble cluster;
- a faint membrane creak;
- an occasional glassy bioluminescent ping;
- a very distant tonal call with a long decay.

Long gaps are intentional.

### D. Action sounds carry more identity than background ambience

Fusion, Split, Brood, Destruct, Swap, Imitation and Synapse should communicate Cellquation's biological identity. Background sound must leave enough space for them.

### E. Music should be harmonic atmosphere, not a looped song

No constant beat and no obvious 30–60 s melody loop.

Use occasional tonal cells/chords that can overlap and recombine. The result should feel coherent without the player learning “where the loop restarts”.

### F. The mix must work on a phone speaker first

Headphones are a second target. Every prototype should be tested on:

- Samsung A20 / similarly limited speaker;
- a stronger smartphone;
- headphones.

---

## 4. Three directions for a later A/B/C prototype

No audio for these directions is included in v0.7.7a. They are design candidates only.

### Direction A — ABYSSAL LIFE

**Character:** quiet, mysterious, biological.

- near-silent neutral water bed;
- sparse invertebrate-like clicks and soft pressure ticks;
- occasional distant non-verbal living calls;
- essentially no conventional music in idle play;
- cell actions provide most of the recognizable sound identity.

**Risk:** may feel too empty without careful timing.

### Direction B — BIOLUMINESCENT MINIMALISM

**Character:** more magical and legible as a game.

- very quiet physical ambience;
- sparse glass/ceramic harmonic glints every 8–20 seconds;
- no melody loop;
- Network activity can add one faint harmonic relationship;
- 3 Colour can add one higher spectral tone rather than a whole extra music stem.

**Risk:** can become generic “ambient sci-fi” if the timbres are too synthetic.

### Direction C — CELLULAR OCEAN

**Character:** organic and tactile.

- almost no environmental loop;
- membrane pulses, micro-bubbles, distant viscous movement;
- musicality comes from pitched action SFX rather than separate music;
- solved sequences can form temporary harmonic patterns.

**Risk:** requires especially good action-SFX design.

### Recommended direction

Prototype **A + B hybrid** first:

> mostly Abyssal Life, with rare Bioluminescent Minimalism glints.

The environment stays quiet and physical; the magical identity appears only occasionally. This gives gameplay SFX room to matter.

---

## 5. Required next audio experiment

Before integrating audio into the main game again, create a separate tiny listening lab with **three 25–40 second scenes**:

- A: Abyssal Life
- B: Bioluminescent Minimalism
- C: A+B hybrid

Each scene should have only:

- ambience;
- one Fusion cue;
- one Split cue;
- one Synapse cue.

No campaign integration. No full soundtrack. No Brood/Destruct/etc. yet.

Decision gate:

1. Does the idle sound still resemble a fan, vacuum, engine or HVAC? If yes: reject.
2. Can it stay pleasant for five minutes? If no: reject.
3. Are Fusion/Split clear above the ambience at phone-speaker volume? If no: reject.
4. Does it still sound like Cellquation with the screen hidden? If no: iterate before integration.

Only after one direction passes these gates should the full v0.7.7 audio architecture be rebuilt.
