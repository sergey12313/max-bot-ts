import type { Context } from './core/index.js';
import { MemorySessionStorage, SessionManager, type SessionStorage } from './session.js';

export interface SceneState {
  scene: string;
  step: string;
  data: Record<string, unknown>;
}

export interface FSMContext {
  readonly state: SceneState | null;
  enter(scene: string, step?: string, data?: Record<string, unknown>): void;
  next(step: string, patch?: Record<string, unknown>): void;
  updateData(patch: Record<string, unknown>): void;
  leave(): void;
}

export type SceneHandler<Ctx extends Context = Context> = (ctx: Ctx, fsm: FSMContext) => Promise<void>;

export interface Scene<Ctx extends Context = Context> {
  readonly name: string;
  onEnter(ctx: Ctx, fsm: FSMContext): Promise<void>;
  onMessage(ctx: Ctx, fsm: FSMContext): Promise<void>;
}

export class SceneManager<Ctx extends Context = Context> {
  private readonly scenes = new Map<string, Scene<Ctx>>();

  constructor(private readonly fsm = new FSM()) {}

  register(...scenes: Array<Scene<Ctx>>): this {
    for (const scene of scenes) {
      this.scenes.set(scene.name, scene);
    }
    return this;
  }

  get(name: string): Scene<Ctx> | undefined {
    return this.scenes.get(name);
  }

  async enter(
    ctx: Ctx,
    key: number | string,
    sceneName: string,
    step = 'start',
    data: Record<string, unknown> = {}
  ): Promise<boolean> {
    const scene = this.scenes.get(sceneName);
    if (!scene) return false;

    const fsmCtx = this.fsm.context(key);
    fsmCtx.enter(sceneName, step, data);
    await scene.onEnter(ctx, fsmCtx);
    return true;
  }

  async handleMessage(ctx: Ctx, key: number | string): Promise<boolean> {
    await this.fsm.hydrate(key);
    const fsmCtx = this.fsm.context(key);
    const state = fsmCtx.state;
    if (!state) return false;

    const scene = this.scenes.get(state.scene);
    if (!scene) return false;

    await scene.onMessage(ctx, fsmCtx);
    return true;
  }
}

export class FSM {
  private readonly sessions: SessionManager<SceneState>;
  private readonly cache = new Map<string, SceneState | null>();

  constructor(storage: SessionStorage<SceneState> = new MemorySessionStorage<SceneState>()) {
    this.sessions = new SessionManager(storage);
  }

  private static toKey(chatId: number | string): string {
    return String(chatId);
  }

  async hydrate(chatId: number | string): Promise<SceneState | null> {
    const key = FSM.toKey(chatId);
    if (this.cache.has(key)) {
      return this.cache.get(key) ?? null;
    }

    const state = await this.sessions.get(key);
    this.cache.set(key, state);
    return state;
  }

  get(chatId: number | string): SceneState | null {
    return this.cache.get(FSM.toKey(chatId)) ?? null;
  }

  async set(chatId: number | string, state: SceneState): Promise<void> {
    const key = FSM.toKey(chatId);
    this.cache.set(key, state);
    await this.sessions.set(key, state);
  }

  async leave(chatId: number | string): Promise<void> {
    const key = FSM.toKey(chatId);
    this.cache.delete(key);
    await this.sessions.delete(key);
  }

  context(chatId: number | string): FSMContext {
    const key = FSM.toKey(chatId);

    const loadState = (): SceneState | null => this.cache.get(key) ?? null;
    const saveState = (state: SceneState | null): void => {
      if (state) {
        this.cache.set(key, state);
        void this.sessions.set(key, state);
        return;
      }

      this.cache.delete(key);
      void this.sessions.delete(key);
    };

    return {
      get state() {
        return loadState();
      },
      enter(scene, step = 'start', data = {}) {
        saveState({ scene, step, data });
      },
      next(step, patch = {}) {
        const current = loadState();
        if (!current) return;
        saveState({ ...current, step, data: { ...current.data, ...patch } });
      },
      updateData(patch) {
        const current = loadState();
        if (!current) return;
        saveState({ ...current, data: { ...current.data, ...patch } });
      },
      leave() {
        saveState(null);
      },
    };
  }
}
