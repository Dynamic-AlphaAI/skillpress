"use client";

import { useSyncExternalStore } from "react";

type Cue = "step" | "book" | "paper";
const preference = "skillpress:sound";
let context: AudioContext | undefined;
let noise: AudioBuffer | undefined;
let enabled = false;
let restored = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  if (!restored) {
    restored = true;
    try {
      enabled = localStorage.getItem(preference) === "on";
    } catch {}
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useSound() {
  return useSyncExternalStore(
    subscribe,
    () => enabled,
    () => false,
  );
}

export function toggleSound() {
  enabled = !enabled;
  try {
    localStorage.setItem(preference, enabled ? "on" : "off");
  } catch {}
  listeners.forEach((listener) => listener());
  if (enabled) playSound("paper");
  else if (context?.state === "running") void context.suspend().catch(() => {});
}

/** Filtered noise makes short, slightly different cloth, paper, and footfall sounds. */
export function playSound(cue: Cue) {
  if (!enabled || typeof AudioContext === "undefined") return;
  try {
    context ??= new AudioContext();
    if (context.state !== "running") void context.resume().catch(() => {});
    if (!noise) {
      noise = context.createBuffer(1, context.sampleRate, context.sampleRate);
      const samples = noise.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    }
    const time = context.currentTime;
    const paper = cue === "paper";
    const duration = paper ? 0.34 : cue === "step" ? 0.17 : 0.22;
    const sound = context.createBufferSource();
    sound.buffer = noise;
    const tone = context.createBiquadFilter();
    tone.type = paper ? "bandpass" : "lowpass";
    const frequency = paper ? 2900 : cue === "step" ? 410 : 980;
    tone.frequency.setValueAtTime(frequency * (0.9 + Math.random() * 0.2), time);
    tone.frequency.exponentialRampToValueAtTime(frequency * 0.32, time + duration);
    const level = context.createGain();
    level.gain.setValueAtTime(0.001, time);
    level.gain.exponentialRampToValueAtTime(paper ? 0.12 : 0.23, time + (paper ? 0.065 : 0.015));
    if (paper) {
      level.gain.exponentialRampToValueAtTime(0.035, time + 0.12);
      level.gain.exponentialRampToValueAtTime(0.085, time + 0.17);
    } else {
      const impact = context.createOscillator();
      const impactLevel = context.createGain();
      impact.frequency.setValueAtTime(cue === "step" ? 103 : 155, time);
      impact.frequency.exponentialRampToValueAtTime(48, time + 0.12);
      impactLevel.gain.setValueAtTime(0.001, time);
      impactLevel.gain.exponentialRampToValueAtTime(0.065, time + 0.012);
      impactLevel.gain.exponentialRampToValueAtTime(0.001, time + 0.14);
      impact.connect(impactLevel).connect(context.destination);
      impact.onended = () => {
        impact.disconnect();
        impactLevel.disconnect();
      };
      impact.start(time);
      impact.stop(time + 0.15);
    }
    level.gain.exponentialRampToValueAtTime(0.001, time + duration);
    sound.connect(tone).connect(level).connect(context.destination);
    sound.onended = () => {
      sound.disconnect();
      tone.disconnect();
      level.disconnect();
    };
    sound.start(time, Math.random() * 0.5, duration);
  } catch {
    /* Audio is optional when the browser or output device is unavailable. */
  }
}
